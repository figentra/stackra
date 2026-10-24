/**
 * Stackra file contract:
 * Purpose: `ActiveScopeService`, the client's current scope: the one the generated client writes into `X-Scope-Path`,
 *          `useScope()` reads, and a scope switcher sets.
 * Boundary: a singleton service holding one `ScopeRef` or `null` in memory and notifying subscribers on a change;
 *           setting an equal ref (same id and path) notifies nobody. It persists nothing and checks nothing: the server
 *           drops a header outside the caller's grants, so a stale or forged choice widens no access.
 * Runtime: isomorphic
 * Governing contract: ADR 0327 (decisions 7 and 10); ADR 0079 (client state); ADR 0294 (decisions 16 and 17).
 */
import { Service } from "@stackra/container";
import type { ScopeRef } from "@stackra/contracts";

/**
 * The active scope on a client.
 *
 * @example
 * activeScope.set({ id: node.id, path: node.path });
 * headers.set(SCOPE_PATH_HEADER, activeScope.current()?.path ?? "");
 */
export class ActiveScopeService extends Service {
  /** The active scope, or `null` before one is chosen. */
  private scope: ScopeRef | null = null;

  /** Who to call after a change. */
  private readonly listeners = new Set<() => void>();

  /** The active scope, or `null`; the same object until it changes, so it is the snapshot `useSyncExternalStore` compares. */
  readonly current = (): ScopeRef | null => this.scope;

  /**
   * Calls `listener` after every change; the shape `useSyncExternalStore` takes.
   *
   * @returns removes the listener; safe to call twice.
   */
  readonly subscribe = (listener: () => void): (() => void) => {
    const entry = () => listener();
    this.listeners.add(entry);
    return () => {
      this.listeners.delete(entry);
    };
  };

  /** Makes `scope` the active one (`null` clears it) and notifies subscribers when it changed. */
  readonly set = (scope: ScopeRef | null): void => {
    if (scope?.id === this.scope?.id && scope?.path === this.scope?.path) return;
    this.scope = scope === null ? null : Object.freeze({ id: scope.id, path: scope.path });
    // oxlint-disable-next-line unicorn/no-useless-spread -- reason: a copy, so a listener that unsubscribes another mid-loop does not skip it
    for (const listener of [...this.listeners]) listener();
  };
}
