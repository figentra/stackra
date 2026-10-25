/**
 * Stackra file contract:
 * Purpose: `SequenceRegistration`, one row of `registerSequences`: a sequence class and the key gen derived and locked
 *          for it (`billing.invoice`).
 * Boundary: a type only. The locked key names the counter rows, so it never changes once numbers were issued; a rename
 *           goes through `@Renamed(old)` in gen, never through a new key.
 * Runtime: node
 * Governing contract: ADR 0342 (decision 1); ADR 0294 (decisions 10 and 20).
 */
import type { SequenceClass } from "#core/types/sequence-class.type";

/** A sequence and its locked key. */
export interface SequenceRegistration {
  /** The sequence class. */
  readonly type: SequenceClass;

  /** The locked key, `<module>.<key>`. */
  readonly key: string;
}
