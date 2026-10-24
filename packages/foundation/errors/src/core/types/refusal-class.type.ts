/**
 * Stackra file contract:
 * Purpose: `RefusalClass`, the exported class type `Refusal({ kind })` returns: an abstract class of refusals whose
 *          statics build one with typed details (`X.create({...})`) or its envelope (`X.envelope({...})`).
 * Boundary: a type only (ADR 0294 decision 25: each factory returns an exported, named class type). The construct
 *           signature takes nothing, because a refusal is built with `create`, never `new` with arguments; details are
 *           required exactly when the class declares a required field.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 25), ADR 0305 (rule 43), ADR 0140.
 */
import type { Refusal } from "#core/bases/refusal.base";
import type { ErrorEnvelope } from "#core/types/error-envelope.type";
import type { FieldErrors } from "#core/types/field-errors.type";
import type { RefusalDetails } from "#core/types/refusal-details.type";

/** What `create` takes beside the details. */
interface Extras {
  /** The refused input paths and why; they travel in the envelope. */
  readonly fieldErrors?: FieldErrors;
  /** The error that led to the refusal; kept on the refusal, never put in the envelope. */
  readonly cause?: unknown;
}

/** True when every declared field is optional (or there are none), so the details may be left out. */
type DetailsOptional<T extends Refusal> =
  Partial<RefusalDetails<T>> extends RefusalDetails<T> ? true : false;

/** A refusal class. */
export type RefusalClass = (abstract new () => Refusal) & {
  /**
   * Builds a refusal of this class with its details, and optionally field errors and the error that caused it.
   *
   * @example
   * throw InsufficientPointsError.create({ balance, requested: points });
   * throw SiteContextMissingError.create();
   */
  create<T extends Refusal>(
    this: new () => T,
    ...args: DetailsOptional<T> extends true
      ? [details?: RefusalDetails<T>, extras?: Extras]
      : [details: RefusalDetails<T>, extras?: Extras]
  ): T;

  /**
   * The envelope of a refusal of this class with these details, without throwing it.
   *
   * @example
   * Promise.resolve({ ok: false, error: CoreRefusals.bridge_rejected.envelope() });
   */
  envelope<T extends Refusal>(
    this: new () => T,
    ...args: DetailsOptional<T> extends true
      ? [details?: RefusalDetails<T>]
      : [details: RefusalDetails<T>]
  ): ErrorEnvelope;
};
