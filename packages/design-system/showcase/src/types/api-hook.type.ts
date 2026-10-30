/**
 * Stackra file contract:
 * Purpose: `ApiHook`, a native hook and its return value.
 * Boundary: a type only, in its own file.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 7.1; ADR 0305 (one declaration per file).
 */
import type { ApiProp } from "#src/types/api-prop.type";

/** One hook of an entry. */
export interface ApiHook {
  readonly name: string;
  readonly signature: string;
  readonly returns: readonly ApiProp[];
}
