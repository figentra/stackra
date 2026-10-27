/**
 * Stackra file contract:
 * Purpose: `R2Head`: an R2 object's metadata.
 * Boundary: types only. Each interface is a subset of the platform's; never add a member the Worker does not call.
 * Runtime: worker
 * Governing contract: ADR 0453 (decision 3).
 */

/** An R2 object's metadata. */
export interface R2Head {
  /** The object's size in bytes. */
  readonly size: number;
  /** The custom metadata stored with the object, when it has any. */
  readonly customMetadata?: Record<string, string> | undefined;
}
