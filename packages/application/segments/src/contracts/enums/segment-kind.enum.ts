/**
 * Stackra file contract:
 * Purpose: `SegmentKind`, how a segment defines its members: dynamic (the published revision of a rule set decides) or
 *          manual (a static list a person keeps).
 * Boundary: an `Enum.of` value plus the type of the same name. The code is stored on each segment and never changes:
 *           a segment keeps its kind for life.
 * Runtime: isomorphic
 * Governing contract: ADR 0332 (decision 2); ADR 0294 (decision 16: `Enum.of`); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/** The ways a segment is defined. */
export const SegmentKind = Enum.of({
  /** Its members are the subjects its rule set's published revision matches, recomputed. */
  Dynamic: "dynamic",
  /** Its members are the subjects a person added. */
  Manual: "manual",
});

/** One of the codes above. */
export type SegmentKind = Enum.Value<typeof SegmentKind>;
