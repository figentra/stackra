/**
 * Stackra file contract:
 * Purpose: `withTabLock(name, task, options)`, the lock half of the coordinator: runs `task` while this tab leads the
 *          named election, so only one tab of the device runs it at a time (a token refresh, a one-off migration of
 *          local storage), and resigns when it settles.
 * Boundary: a lock is an election held for one task, so a lock and an election of the same name exclude each other.
 *           It waits as long as another tab holds the name; with the BroadcastChannel fallback, even a free lock is
 *           taken only after three heartbeats. Client tabs only: server locks are `@stackra/locking` (ADR 0103).
 * Runtime: isomorphic
 * Governing contract: ADR 0084 (the coordinator row: leader election and locks); ADR 0103 (the two never share code).
 */
import { electLeader } from "#core/functions/elect-leader.function";
import type { ElectLeaderOptions } from "#core/types/elect-leader-options.type";

/**
 * Runs `task` once this tab holds the named lock, then releases it, whether the task resolves or throws.
 *
 * @throws whatever `task` throws, after the lock is released.
 * @example
 * const token = await withTabLock("identity.refresh", () => refreshToken());
 */
export async function withTabLock<T>(
  name: string,
  task: () => T | Promise<T>,
  options?: ElectLeaderOptions,
): Promise<T> {
  const election = electLeader(name, options);
  try {
    await election.whenLeader();
    return await task();
  } finally {
    election.resign();
  }
}
