/**
 * Stackra file contract:
 * Purpose: `VerifiedApiKey`, what `ApiKeyVerifierService.verify` answers for a key that passed: its kind and its stored
 *          record (principal, tenant, scopes).
 * Boundary: a type only. Passing proves the key exists, is live and, for a publishable key, came from a bound origin;
 *           the scopes and the tenant binding are checked by the caller after (ADR 0278 decisions 6 and 7).
 * Runtime: isomorphic
 * Governing contract: ADR 0278; ADR 0410 (STA-835).
 */
import type { ApiKeyRecord } from "#contracts/types/api-key-record.type";
import type { ApiKeyKind } from "#core/enums/api-key-kind.enum";

/** A verified key. */
export interface VerifiedApiKey {
  /** The kind its prefix names. */
  readonly kind: ApiKeyKind;

  /** The stored record. */
  readonly record: ApiKeyRecord;
}
