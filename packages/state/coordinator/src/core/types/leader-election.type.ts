/**
 * Stackra file contract:
 * Purpose: `LeaderElection`, one participant in a named election that `electLeader` returns: whether it leads now (a
 *          signal to read or subscribe to, `useSignal(election.isLeader)` in a component), a promise for the moment it
 *          leads, and `resign` to leave.
 * Boundary: a type only. `isLeader` is the read half of @stackra/state's `StateSignal`: only the election writes it.
 * Runtime: isomorphic
 * Governing contract: ADR 0079 (decision 6: the coordinator builds on @stackra/state); ADR 0084 (the coordinator row).
 */
// oxlint-disable-next-line no-restricted-imports -- reason: `signal` is React-free but @stackra/state exports it from `./react` only (ADR 0079 decision 6 puts this package on it); drop this line when state exports it from `.`
import type { StateSignal } from "@stackra/state/react";

import type { ElectionMethod } from "#core/enums/election-method.enum";

/** One participant in a named leader election. */
export interface LeaderElection {
  /** The election's name; participants with the same name compete. */
  readonly name: string;

  /** How this participant reaches the others. */
  readonly method: ElectionMethod;

  /** `true` while this participant leads. */
  readonly isLeader: Pick<StateSignal<boolean>, "get" | "subscribe">;

  /**
   * Resolves once this participant leads, at once when it already does.
   *
   * @throws Error (as a rejection) when the participant resigns first.
   */
  whenLeader(): Promise<void>;

  /** Leaves the election for good, handing leadership on when it led; a second call does nothing. */
  resign(): void;
}
