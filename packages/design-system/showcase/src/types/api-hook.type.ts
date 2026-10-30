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
  /** The hook's name. */
  readonly name: string;
  /** The hook's call signature as written. */
  readonly signature: string;
  /** The members of the hook's return value. */
  readonly returns: readonly ApiProp[];
}
