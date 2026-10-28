/**
 * Stackra file contract:
 * Purpose: `electLeader(name, options)`, which joins this tab to the named leader election and returns its
 *          `LeaderElection`: exactly one tab of the device leads at a time (one tab drains the offline queue, one holds
 *          the realtime socket), and when it closes or resigns another takes over.
 * Boundary: picks the method (Web Locks, else the BroadcastChannel heartbeat, else memory) unless `options.method`
 *           names one, and keeps the leader flag in a @stackra/state signal. Joining is immediate; leading happens when
 *           the method grants it. `resign` leaves for good: a later election needs a new call.
 * Runtime: isomorphic
 * Governing contract: ADR 0084 (the coordinator row); ADR 0079 (decision 6); ADR 0252 (one tab drains the queue).
 */
import { Duration } from "@stackra/contracts";
// oxlint-disable-next-line no-restricted-imports -- reason: `signal` is React-free but @stackra/state exports it from `./react` only (ADR 0079 decision 6 puts this package on it); drop this line when state exports it from `.`
import { signal } from "@stackra/state/react";

import { ElectionMethod } from "#core/enums/election-method.enum";
import { detectElectionMethod } from "#core/functions/detect-election-method.function";
import { electByBroadcastChannel } from "#core/functions/elect-by-broadcast-channel.function";
import { electByWebLocks } from "#core/functions/elect-by-web-locks.function";
import { electInMemory } from "#core/functions/elect-in-memory.function";
import type { ElectLeaderOptions } from "#core/types/elect-leader-options.type";
import type { LeaderElection } from "#core/types/leader-election.type";

/**
 * Joins the named election.
 *
 * @throws RangeError when `name` is empty.
 * @example
 * const election = electLeader("query.queue");
 * election.isLeader.subscribe((leads) => (leads ? queue.start() : queue.stop()));
 * window.addEventListener("pagehide", () => election.resign());
 */
export function electLeader(name: string, options: ElectLeaderOptions = {}): LeaderElection {
  if (name === "") throw new RangeError("A leader election needs a name");
  const method = options.method ?? detectElectionMethod();
  const isLeader = signal(false);
  const heartbeatMs = Duration.toMilliseconds(options.heartbeat ?? Duration.seconds(1));
  const leave =
    method === ElectionMethod.WebLocks
      ? electByWebLocks(name, isLeader)
      : method === ElectionMethod.BroadcastChannel
        ? electByBroadcastChannel(name, isLeader, heartbeatMs)
        : electInMemory(name, isLeader);
  const rejecters = new Set<() => void>();
  let resigned = false;

  return Object.freeze({
    name,
    method,
    isLeader: Object.freeze({ get: isLeader.get, subscribe: isLeader.subscribe }),
    whenLeader: () =>
      new Promise<void>((resolve, reject) => {
        if (resigned) {
          reject(new Error(`Resigned from the "${name}" election`));
          return;
        }
        if (isLeader.get()) {
          resolve();
          return;
        }
        const stop = isLeader.subscribe((leads) => {
          if (!leads) return;
          stop();
          rejecters.delete(rejecter);
          resolve();
        });
        const rejecter = (): void => {
          stop();
          reject(new Error(`Resigned from the "${name}" election before leading`));
        };
        rejecters.add(rejecter);
      }),
    resign: () => {
      if (resigned) return;
      resigned = true;
      leave();
      isLeader.set(false);
      for (const rejecter of rejecters) rejecter();
      rejecters.clear();
    },
  });
}
