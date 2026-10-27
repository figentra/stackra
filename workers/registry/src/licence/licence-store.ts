/**
 * Stackra file contract:
 * Purpose: `LicenceStore`: the licence API's D1 access: issuer tokens, Idempotency-Key receipts, a licence as the API
 *          answers it, and the statements that write licences, grants, tokens, receipts and audit rows.
 * Boundary: SQL over the D1 binding only; no rule is decided here. The handler commits one call's statements in one D1
 *           batch (one transaction), the receipt with them, so a call is applied once or not at all. Never stores a
 *           token, only its SHA-256. `licences.internal` is never written here (the owner sets it).
 * Runtime: worker
 * Governing contract: ADR 0453 (decisions 3, 13 and 14); ADR 0461 (decision 3); migrations/0002_licences.sql.
 */
import type { RegistryLicence, RegistryLicenceGrant } from "@stackra/licensing/contracts";

import type { D1Database } from "#src/interfaces/d1-database.interface";
import type { D1Statement } from "#src/interfaces/d1-statement.interface";
import { grantsOf } from "#src/licence/grants-of";

/** A `licences` row. */
interface LicenceRow {
  readonly id: string;
  readonly holder_ref: string;
  readonly status: RegistryLicence["status"];
  readonly not_before: string | null;
  readonly expires_at: string | null;
}

/** A `licence_tokens` row without its hash. */
interface TokenRow {
  readonly id: string;
  readonly label: string;
  readonly created_at: string;
  readonly revoked_at: string | null;
}

/** A stored answer of one applied Idempotency-Key. */
interface Receipt {
  readonly fingerprint: string;
  readonly status: number;
  readonly body: string;
}

/** The licence API's D1 access. */
export class LicenceStore {
  private readonly db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  /** The label of an issuer token that is not revoked, by its hash, or null. */
  async issuer(hash: string): Promise<string | null> {
    const row = await this.db
      .prepare("SELECT label FROM issuer_tokens WHERE hash = ?1 AND revoked_at IS NULL")
      .bind(hash)
      .first<{ label: string }>();
    return row?.label ?? null;
  }

  /** The receipt of an Idempotency-Key, or null when the key was never applied. */
  receipt(key: string): Promise<Receipt | null> {
    return this.db
      .prepare("SELECT fingerprint, status, body FROM licence_requests WHERE idempotency_key = ?1")
      .bind(key)
      .first<Receipt>();
  }

  /** The read rules of scopes, by scope (a scope not in the table is left out). */
  async readRules(scopes: readonly string[]): Promise<Map<string, string>> {
    const { results } = await this.db
      .prepare(
        "SELECT scope, read_rule FROM scopes WHERE scope IN (SELECT value FROM json_each(?1))",
      )
      .bind(JSON.stringify(scopes))
      .all<{ scope: string; read_rule: string }>();
    return new Map(results.map((row) => [row.scope, row.read_rule]));
  }

  /** A licence as the API answers it (`issuedToken` null), or null for an unknown id. */
  async licence(id: string): Promise<RegistryLicence | null> {
    const row = await this.db
      .prepare("SELECT id, holder_ref, status, not_before, expires_at FROM licences WHERE id = ?1")
      .bind(id)
      .first<LicenceRow>();
    if (row === null) return null;
    const [grants, tokens] = await Promise.all([
      this.db
        .prepare("SELECT scope, name FROM licence_grants WHERE licence_id = ?1")
        .bind(id)
        .all<{ scope: string; name: string }>(),
      this.db
        .prepare(
          "SELECT id, label, created_at, revoked_at FROM licence_tokens WHERE licence_id = ?1 ORDER BY created_at, id",
        )
        .bind(id)
        .all<TokenRow>(),
    ]);
    return {
      id: row.id,
      holderRef: row.holder_ref,
      grants: grantsOf(grants.results),
      notBefore: row.not_before,
      expiresAt: row.expires_at,
      status: row.status,
      tokens: tokens.results.map((token) => ({
        id: token.id,
        label: token.label,
        createdAt: token.created_at,
        revokedAt: token.revoked_at,
      })),
      issuedToken: null,
    };
  }

  /** Inserts or updates the licence row (never `internal`). */
  saveLicence(licence: RegistryLicence, now: string): D1Statement {
    return this.db
      .prepare(
        `INSERT INTO licences (id, holder_ref, status, not_before, expires_at, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6)
         ON CONFLICT (id) DO UPDATE SET status = excluded.status, not_before = excluded.not_before,
           expires_at = excluded.expires_at, updated_at = excluded.updated_at`,
      )
      .bind(
        licence.id,
        licence.holderRef,
        licence.status,
        licence.notBefore,
        licence.expiresAt,
        now,
      );
  }

  /** Replaces every grant of a licence: one row per scope and name, `*` for every name. */
  replaceGrants(id: string, grants: readonly RegistryLicenceGrant[]): D1Statement[] {
    return [
      this.db.prepare("DELETE FROM licence_grants WHERE licence_id = ?1").bind(id),
      ...grants.flatMap((grant) =>
        (grant.names === "*" ? ["*"] : grant.names).map((name) =>
          this.db
            .prepare(
              "INSERT OR IGNORE INTO licence_grants (licence_id, scope, name) VALUES (?1, ?2, ?3)",
            )
            .bind(id, grant.scope, name),
        ),
      ),
    ];
  }

  /** Inserts a token by its hash. */
  addToken(
    licenceId: string,
    tokenId: string,
    hash: string,
    label: string,
    now: string,
  ): D1Statement {
    return this.db
      .prepare(
        "INSERT INTO licence_tokens (id, licence_id, hash, label, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
      )
      .bind(tokenId, licenceId, hash, label, now);
  }

  /** Revokes one token, or (tokenId null) every token of the licence that is not revoked yet. */
  revokeTokens(licenceId: string, tokenId: string | null, now: string): D1Statement {
    return this.db
      .prepare(
        `UPDATE licence_tokens SET revoked_at = ?3
         WHERE licence_id = ?1 AND (?2 IS NULL OR id = ?2) AND revoked_at IS NULL`,
      )
      .bind(licenceId, tokenId, now);
  }

  /** Records the answer of an Idempotency-Key; a second insert of the same key fails the whole batch. */
  saveReceipt(
    key: string,
    fingerprint: string,
    status: number,
    body: string,
    now: string,
  ): D1Statement {
    return this.db
      .prepare(
        "INSERT INTO licence_requests (idempotency_key, fingerprint, status, body, at) VALUES (?1, ?2, ?3, ?4, ?5)",
      )
      .bind(key, fingerprint, status, body, now);
  }

  /** One `audit_events` row for a licence API call (name = licence id, run = Idempotency-Key). */
  audit(action: string, licenceId: string, actor: string, key: string, now: string): D1Statement {
    return this.db
      .prepare(
        "INSERT INTO audit_events (at, action, name, actor, run) VALUES (?1, ?2, ?3, ?4, ?5)",
      )
      .bind(now, action, licenceId, actor, key);
  }

  /** Runs one call's statements in one transaction. */
  async commit(statements: D1Statement[]): Promise<void> {
    await this.db.batch(statements);
  }
}
