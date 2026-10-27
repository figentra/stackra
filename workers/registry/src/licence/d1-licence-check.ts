/**
 * Stackra file contract:
 * Purpose: `D1LicenceCheck`, the `LicenceCheck` adapter over D1: the licence behind a token, found by the token's
 *          SHA-256 in `licence_tokens` (a revoked or unknown token is null), with its grants and internal flag.
 * Boundary: reads only; the read rule over the answer is `readAccess`'s, and `main.ts` puts it behind
 *           `cachedLicenceCheck` (revocation is seen within `REGISTRY_TOKEN_CACHE_SECONDS`).
 * Runtime: worker
 * Governing contract: ADR 0453 (decisions 3 and 13); ADR 0461 (decision 3); migrations/0002_licences.sql.
 */
import type { LicenceCheck } from "#src/access/licence-check.port";
import { sha256Hex } from "#src/bytes/sha256-hex";
import type { D1Database } from "#src/interfaces/d1-database.interface";
import type { LicenceView } from "#src/interfaces/licence-view.interface";
import { grantsOf } from "#src/licence/grants-of";

/** The token and licence columns the check reads. */
interface TokenLicenceRow {
  readonly token_id: string;
  readonly licence_id: string;
  readonly holder_ref: string;
  readonly status: LicenceView["status"];
  readonly internal: number;
  readonly not_before: string | null;
  readonly expires_at: string | null;
}

/**
 * Reads licence tokens from D1.
 *
 * @example
 * const licences = cachedLicenceCheck(new D1LicenceCheck(env.DB), caches.default, settings.tokenCacheSeconds);
 */
export class D1LicenceCheck implements LicenceCheck {
  private readonly db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  /** The licence behind `token`, or null for a non-`stkl_`, unknown or revoked token. */
  async check(token: string): Promise<LicenceView | null> {
    if (!token.startsWith("stkl_")) return null;
    const row = await this.db
      .prepare(
        `SELECT t.id AS token_id, l.id AS licence_id, l.holder_ref, l.status, l.internal, l.not_before, l.expires_at
         FROM licence_tokens t JOIN licences l ON l.id = t.licence_id
         WHERE t.hash = ?1 AND t.revoked_at IS NULL`,
      )
      .bind(await sha256Hex(token))
      .first<TokenLicenceRow>();
    if (row === null) return null;
    const { results } = await this.db
      .prepare("SELECT scope, name FROM licence_grants WHERE licence_id = ?1")
      .bind(row.licence_id)
      .all<{ scope: string; name: string }>();
    return {
      licenceId: row.licence_id,
      tokenId: row.token_id,
      holder: row.holder_ref,
      status: row.status,
      notBefore: row.not_before,
      expiresAt: row.expires_at,
      grants: grantsOf(results),
      internal: row.internal === 1,
    };
  }
}
