/**
 * Stackra file contract:
 * Purpose: `RegistryStore`: the registry's D1 access.
 * Boundary: SQL over the D1 binding only; no rule is decided here. Writes that belong together go in one D1 batch
 *           (one transaction). The licence tables are `LicenceStore`'s (src/licence); this class reads only
 *           `name_rules` of migration 0002, for the read rule and the catalogue.
 * Runtime: worker
 * Governing contract: ADR 0453 (decision 3); ADR 0461 (decision 3); migrations/0001_registry.sql and
 *                     0002_licences.sql.
 */
import type { AuditEvent } from "#src/interfaces/audit-event.interface";
import type { CatalogueQuery } from "#src/interfaces/catalogue-query.interface";
import type { CatalogueRow } from "#src/interfaces/catalogue-row.interface";
import type { D1Database } from "#src/interfaces/d1-database.interface";
import type { D1Statement } from "#src/interfaces/d1-statement.interface";
import type { PackageRow } from "#src/interfaces/package-row.interface";
import type { PublishTokenRow } from "#src/interfaces/publish-token-row.interface";
import type { PublisherRow } from "#src/interfaces/publisher-row.interface";
import type { ScopeRow } from "#src/interfaces/scope-row.interface";
import type { VersionRow } from "#src/interfaces/version-row.interface";
import { VersionExistsError } from "#src/store/version-exists-error";

/** The registry's D1 access. */
export class RegistryStore {
  private readonly db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  /** A scope row, or null for an unknown scope. */
  scope(scope: string): Promise<ScopeRow | null> {
    return this.db.prepare("SELECT * FROM scopes WHERE scope = ?1").bind(scope).first<ScopeRow>();
  }

  /** The `name_rules` read rule of one name (it tightens its scope's), or null when the scope's rule applies. */
  async nameRule(name: string): Promise<"internal" | null> {
    const row = await this.db
      .prepare("SELECT read_rule FROM name_rules WHERE name = ?1")
      .bind(name)
      .first<{ read_rule: "internal" }>();
    return row?.read_rule ?? null;
  }

  /** Every trusted publisher of a scope. */
  async publishers(scope: string): Promise<PublisherRow[]> {
    const { results } = await this.db
      .prepare("SELECT * FROM publishers WHERE scope = ?1")
      .bind(scope)
      .all<PublisherRow>();
    return results;
  }

  /** A package row, or null. */
  package(name: string): Promise<PackageRow | null> {
    return this.db.prepare("SELECT * FROM packages WHERE name = ?1").bind(name).first<PackageRow>();
  }

  /** Every version of a package, oldest first. */
  async versions(name: string): Promise<VersionRow[]> {
    const { results } = await this.db
      .prepare("SELECT * FROM versions WHERE name = ?1 ORDER BY published_at, version")
      .bind(name)
      .all<VersionRow>();
    return results;
  }

  /** One version, or null. */
  version(name: string, version: string): Promise<VersionRow | null> {
    return this.db
      .prepare("SELECT * FROM versions WHERE name = ?1 AND version = ?2")
      .bind(name, version)
      .first<VersionRow>();
  }

  /** The dist-tags of a package. */
  async distTags(name: string): Promise<Record<string, string>> {
    const { results } = await this.db
      .prepare("SELECT tag, version FROM dist_tags WHERE name = ?1 ORDER BY tag")
      .bind(name)
      .all<{ tag: string; version: string }>();
    return Object.fromEntries(results.map((row) => [row.tag, row.version]));
  }

  /** The dist-tags of several packages, by name. */
  async distTagsOf(names: readonly string[]): Promise<Record<string, Record<string, string>>> {
    const { results } = await this.db
      .prepare(
        "SELECT name, tag, version FROM dist_tags WHERE name IN (SELECT value FROM json_each(?1))",
      )
      .bind(JSON.stringify(names))
      .all<{ name: string; tag: string; version: string }>();
    const byName: Record<string, Record<string, string>> = {};
    for (const row of results) (byName[row.name] ??= {})[row.tag] = row.version;
    return byName;
  }

  /**
   * Writes a new version, its tags and its audit row in one batch.
   *
   * @throws VersionExistsError when the version is already there (a racing publish).
   */
  async publish(
    row: VersionRow,
    scope: string,
    tags: readonly string[],
    audit: AuditEvent,
  ): Promise<void> {
    if ((await this.version(row.name, row.version)) !== null)
      throw new VersionExistsError(`${row.name}@${row.version} exists`);
    const statements: D1Statement[] = [
      this.db
        .prepare(
          `INSERT INTO packages (name, scope, kind, created_at, modified_at) VALUES (?1, ?2, ?3, ?4, ?4)
           ON CONFLICT (name) DO UPDATE SET kind = excluded.kind, modified_at = excluded.modified_at`,
        )
        .bind(row.name, scope, row.kind, row.published_at),
      this.db
        .prepare(
          `INSERT INTO versions (name, version, kind, manifest, integrity, shasum, sha256, signatures,
             predicate_type, size, publisher_run, published_at, deprecated)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, NULL)`,
        )
        .bind(
          row.name,
          row.version,
          row.kind,
          row.manifest,
          row.integrity,
          row.shasum,
          row.sha256,
          row.signatures,
          row.predicate_type,
          row.size,
          row.publisher_run,
          row.published_at,
        ),
      ...tags.map((tag) => this.tagStatement(row.name, tag, row.version)),
      this.auditStatement(audit),
    ];
    try {
      await this.db.batch(statements);
    } catch (error) {
      if ((await this.version(row.name, row.version)) !== null)
        throw new VersionExistsError(`${row.name}@${row.version} exists`);
      throw error;
    }
  }

  /** Points a dist-tag at a version. */
  async setDistTag(name: string, tag: string, version: string, audit: AuditEvent): Promise<void> {
    await this.db.batch([this.tagStatement(name, tag, version), this.auditStatement(audit)]);
  }

  /** Removes a dist-tag. */
  async deleteDistTag(name: string, tag: string, audit: AuditEvent): Promise<void> {
    await this.db.batch([
      this.db.prepare("DELETE FROM dist_tags WHERE name = ?1 AND tag = ?2").bind(name, tag),
      this.auditStatement(audit),
    ]);
  }

  /** Sets or clears (null) a version's deprecation message. */
  async deprecate(
    name: string,
    version: string,
    message: string | null,
    audit: AuditEvent,
  ): Promise<void> {
    await this.db.batch([
      this.db
        .prepare("UPDATE versions SET deprecated = ?3 WHERE name = ?1 AND version = ?2")
        .bind(name, version, message),
      this.auditStatement(audit),
    ]);
  }

  /** Stores a publish token's hash and writes its audit row. */
  async savePublishToken(row: PublishTokenRow, audit: AuditEvent): Promise<void> {
    await this.db.batch([
      this.db
        .prepare(
          "INSERT INTO publish_tokens (hash, name, repository, run, expires_at) VALUES (?1, ?2, ?3, ?4, ?5)",
        )
        .bind(row.hash, row.name, row.repository, row.run, row.expires_at),
      this.db.prepare("DELETE FROM publish_tokens WHERE expires_at <= ?1").bind(audit.at),
      this.auditStatement(audit),
    ]);
  }

  /** A publish token that has not expired at `now`, or null. */
  publishToken(hash: string, now: string): Promise<PublishTokenRow | null> {
    return this.db
      .prepare("SELECT * FROM publish_tokens WHERE hash = ?1 AND expires_at > ?2")
      .bind(hash, now)
      .first<PublishTokenRow>();
  }

  /** Counts one download for a package, licence ('' when open) and day. */
  async countDownload(day: string, name: string, licenceId: string): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO downloads_daily (day, name, licence_id, count) VALUES (?1, ?2, ?3, 1)
         ON CONFLICT (day, name, licence_id) DO UPDATE SET count = count + 1`,
      )
      .bind(day, name, licenceId)
      .run();
  }

  /** One page of catalogue rows (limit + 1 rows, so the caller knows whether there is a next page). */
  async catalogue(query: CatalogueQuery): Promise<CatalogueRow[]> {
    const like = query.q === null ? null : `%${query.q.replaceAll(/[\\%_]/g, "\\$&")}%`;
    const { results } = await this.db
      .prepare(
        `SELECT p.name, p.scope, p.kind, p.modified_at, s.read_rule, t.version AS latest, v.manifest, v.deprecated
         FROM packages p
         JOIN scopes s ON s.scope = p.scope
         LEFT JOIN dist_tags t ON t.name = p.name AND t.tag = 'latest'
         LEFT JOIN versions v ON v.name = p.name AND v.version = t.version
         WHERE s.read_rule IN ('open', 'licensed')
           AND NOT EXISTS (SELECT 1 FROM name_rules r WHERE r.name = p.name)
           AND (?1 IS NULL OR p.kind = ?1)
           AND (?2 IS NULL OR p.scope = ?2)
           AND (?3 IS NULL OR p.name LIKE ?3 ESCAPE '\\'
                OR json_extract(v.manifest, '$.description') LIKE ?3 ESCAPE '\\')
           AND (?4 IS NULL OR p.modified_at < ?4 OR (p.modified_at = ?4 AND p.name < ?5))
         ORDER BY p.modified_at DESC, p.name DESC
         LIMIT ?6`,
      )
      .bind(
        query.kind,
        query.scope,
        like,
        query.after?.modifiedAt ?? null,
        query.after?.name ?? null,
        query.limit + 1,
      )
      .all<CatalogueRow>();
    return results;
  }

  private tagStatement(name: string, tag: string, version: string): D1Statement {
    return this.db
      .prepare(
        `INSERT INTO dist_tags (name, tag, version) VALUES (?1, ?2, ?3)
         ON CONFLICT (name, tag) DO UPDATE SET version = excluded.version`,
      )
      .bind(name, tag, version);
  }

  private auditStatement(event: AuditEvent): D1Statement {
    return this.db
      .prepare(
        `INSERT INTO audit_events (at, action, name, version, tag, actor, run, detail)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`,
      )
      .bind(
        event.at,
        event.action,
        event.name,
        event.version ?? null,
        event.tag ?? null,
        event.actor,
        event.run,
        event.detail ?? null,
      );
  }
}
