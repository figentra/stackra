/**
 * Stackra file contract:
 * Purpose: `AccessRecord`, one logged access: who read whose data, through which class and method, when, and how the
 *          class classified it.
 * Boundary: a type in the leaf entry; ids only, never the data that was read (ADR 0134).
 * Runtime: isomorphic
 * Governing contract: ADR 0212 (decision 5); ADR 0134 (classification); ADR 0098 (the actor chain); ADR 0294
 *                     (decision 15).
 */
import type { Actor, DataClassification } from "@stackra/contracts";

/** One access to classified data. */
export interface AccessRecord {
  /** The id of the action or query call the access ran in; every record of one call shares it. */
  readonly callId: string;

  /** The full actor with its `onBehalfOf` chain. */
  readonly actor: Actor;

  /** `<Class>.<method>` that was called. */
  readonly target: string;

  /** The data classification the class declared. */
  readonly classification: DataClassification;

  /**
   * Public ids of the people whose data the call touched: the principal the call is for, or the named field of the
   * records the call handled.
   */
  readonly subjects: readonly string[];

  /** When the access was recorded, from the Clock port. */
  readonly at: Date;
}
