/**
 * Stackra file contract:
 * Purpose: `ThreadStatus`, whether a comment thread still asks for attention (`open`) or was settled (`resolved`).
 * Boundary: an `Enum.of` in the leaf entry. A new comment in a resolved thread reopens it.
 * Runtime: isomorphic
 * Governing contract: ADR 0433 (decision 1).
 */
import { Enum } from "@stackra/contracts";

/** The states of a thread. */
export const ThreadStatus = Enum.of({
  /** Taking replies. */
  Open: "open",
  /** Settled; a reply reopens it. */
  Resolved: "resolved",
});

/** One of the states above. */
export type ThreadStatus = Enum.Value<typeof ThreadStatus>;
