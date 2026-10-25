/**
 * Stackra file contract:
 * Purpose: `Signal`, the kind base of a fact sent into a parked run: a class with fields in the `workflows/` group,
 *          named by the step that waits for it (`@Step({ waitFor })`) and sent by an action or a listener with
 *          `ctx.signal(Signal, payload, correlation)`.
 * Boundary: bare only (`extends Signal`; the kind takes no options, ADR 0294 kind table). It holds no state and runs
 *           nothing: the engine holds a payload until a run of the same scope waits on the same signal and
 *           correlation, then hands the step an instance built from it. A signal that arrives before its run parks
 *           is held, so the order of the two never matters.
 * Runtime: isomorphic
 * Governing contract: ADR 0152 (0294 note: signals, early signals held); ADR 0294 (decisions 2, 3, 16 and 23: a noun
 *                     kind, so the class takes no suffix).
 */
import { registerKind } from "@stackra/container";

/**
 * The signal kind base.
 *
 * @example
 * export class RedemptionConfirmed extends Signal {
 *   memberId!: string;
 *   reference!: string;
 * }
 */
// oxlint-disable-next-line typescript/no-extraneous-class -- reason: a kind base is empty on purpose (0294 d25)
export abstract class Signal {
  /** Type-only kind brand, so a class of another kind cannot stand in for a signal. */
  declare readonly "~kind": "signal";
}

registerKind(Signal, "signal");
