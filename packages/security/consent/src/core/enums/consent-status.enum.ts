/**
 * Stackra file contract:
 * Purpose: `ConsentStatus`, where one category stands for the current visitor: granted, refused, or not decided yet.
 * Boundary: an `Enum.of` value plus the type of the same name. Only `granted` lets the gated work run; `undecided` runs
 *           nothing (decline by default) and is what the banner asks about.
 * Runtime: isomorphic
 * Governing contract: ADR 0298 (decisions 1 to 3); ADR 0294 (decision 16).
 */
import { Enum } from "@stackra/contracts";

/**
 * The state of one category.
 *
 * @example
 * const isDecided = useConsent(ConsentCategory.Analytics).status !== ConsentStatus.Undecided;
 */
export const ConsentStatus = Enum.of({
  /** The visitor allowed it, it is required, or the region's regime grants it before a decision. */
  Granted: "granted",
  /** The visitor refused it, or the browser sends Global Privacy Control. */
  Denied: "denied",
  /** No decision for the current policy version yet; treated as refused. */
  Undecided: "undecided",
});

/** One of the codes above. */
export type ConsentStatus = Enum.Value<typeof ConsentStatus>;
