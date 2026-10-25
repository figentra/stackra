/**
 * Stackra file contract:
 * Purpose: `Idempotency`, how an action treats the Idempotency-Key: honoured when sent, required from every caller,
 *          or derived from the call when none is sent.
 * Boundary: an enum (`Enum.of`) read by the pipeline's idempotency step and by gen (a client write with no declaration
 *           is a gen error, ADR 0136). Queries take no idempotency option.
 * Runtime: isomorphic
 * Governing contract: ADR 0136 (decision 3); ADR 0138 (as amended: the idempotency step); ADR 0294 (decision 16: Enum).
 */
import { Enum } from "@stackra/contracts";

/**
 * An action's Idempotency-Key policy.
 *
 * @example
 * export class RedeemPointsAction extends Action({ key: "points.redeem", actors, idempotency: Idempotency.Required }) {}
 */
export const Idempotency = Enum.of({
  /** The default: a sent key is honoured, a call without one runs every time. */
  Optional: "optional",
  /** Every call must send a key; a call without one is refused (`idempotency_key_required`). */
  Required: "required",
  /** A sent key is honoured; without one the key is derived from the actor and the input, so a repeat replays. */
  Derived: "derived",
});

/** One of the values above. */
export type Idempotency = Enum.Value<typeof Idempotency>;
