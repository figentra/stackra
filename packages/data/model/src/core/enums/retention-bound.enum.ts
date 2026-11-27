/**
 * Stackra file contract:
 * Purpose: `RetentionBound`, whether a model holding a field of a data class must bound how long its rows live with
 *          the `Retention` trait (`required`), or may keep them open-ended (`none`).
 * Boundary: an `Enum.of` value plus the type of the same name; one of the eight effects a data class sets. Gen refuses
 *           a model that holds a `required` field and declares no `Retention`.
 * Runtime: isomorphic
 * Governing contract: ADR 0540 (decision 1: the `retention` effect); ADR 0134 (decision 3: `Retention`).
 */
import { Enum } from "@stackra/contracts";

/** Whether a class's fields need a bounded retention. */
export const RetentionBound = Enum.of({
  /** The model may keep its rows as long as its own rules say. */
  None: "none",
  /** The model must declare `Retention({ keep, basis, policy })`. */
  Required: "required",
});

/** One of the codes above. */
export type RetentionBound = Enum.Value<typeof RetentionBound>;
