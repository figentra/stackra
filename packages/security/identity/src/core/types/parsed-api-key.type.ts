/**
 * Stackra file contract:
 * Purpose: `ParsedApiKey`, what an API key's text says before any lookup: its kind (from its prefix) and whether its
 *          checksum matches.
 * Boundary: a type only. A matching checksum proves the key is well-formed, never that it exists or is active.
 * Runtime: isomorphic
 * Governing contract: ADR 0278 (decisions 4 and 5).
 */
import type { ApiKeyKind } from "#core/enums/api-key-kind.enum";

/** A key's text, read. */
export interface ParsedApiKey {
  /** The kind its prefix names. */
  readonly kind: ApiKeyKind;

  /** Its checksum matches its body. */
  readonly wellFormed: boolean;
}
