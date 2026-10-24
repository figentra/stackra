/**
 * Stackra file contract:
 * Purpose: `TenantSwitcher`, the client's tenant context: the signed-in user's memberships, the active one, and the
 *          switch, which makes the tenant's scope node the active scope so the generated client sends its path as
 *          `X-Scope-Path`.
 * Boundary: a singleton service named as the template binds it (no `Service` suffix, like `GraphQuery`). The identity
 *           package hands it the session's memberships through `setMemberships`; it keeps the active tenant while it
 *           is still a membership, else takes the first, and clears with none. It persists nothing (remembering a
 *           choice per user is the app's store) and checks nothing a server relies on: the server drops a scope header
 *           outside the caller's grants. Subscribers are told after every change; `current` and `memberships` return
 *           the same objects until one, so they are `useSyncExternalStore` snapshots.
 * Runtime: isomorphic
 * Governing contract: ADR 0210 (decision 3: one tenant per request); ADR 0327 (decisions 7, 8 and 10); ADR 0208
 *                     (memberships); ADR 0294 (decisions 16 and 17).
 */
import { Service } from "@stackra/container";
import { ActiveScopeService } from "@stackra/scope";

import { TenantMembershipMissingError } from "#core/errors/tenant-membership-missing.error";
import type { TenantMembership } from "#core/types/tenant-membership.type";

/** No memberships. */
const NONE: readonly TenantMembership[] = Object.freeze([]);

/**
 * The active tenant on a client.
 *
 * @example
 * switcher.setMemberships(session.user.tenants);
 * await switcher.switchTo(remembered ?? switcher.memberships()[0].tenantId);
 */
export class TenantSwitcher extends Service {
  /** The active scope the switch sets. */
  private readonly scope: ActiveScopeService;

  /** The memberships, frozen. */
  private list: readonly TenantMembership[] = NONE;

  /** The active membership, or `null`. */
  private active: TenantMembership | null = null;

  /** Who to call after a change. */
  private readonly listeners = new Set<() => void>();

  /** @param scope - the client's active scope, which follows the active tenant. */
  constructor(scope: ActiveScopeService) {
    super();
    this.scope = scope;
  }

  /** The active membership, or `null` before one is chosen or for a user with none. */
  readonly current = (): TenantMembership | null => this.active;

  /** Every membership of the signed-in user, in the session's order; empty when signed out. */
  readonly memberships = (): readonly TenantMembership[] => this.list;

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

  /**
   * Replaces the memberships, as the session lists them: the active tenant stays when it is still one (with its
   * refreshed name and roles), else the first becomes active, else none.
   */
  readonly setMemberships = (memberships: readonly TenantMembership[]): void => {
    this.list = memberships.length === 0 ? NONE : Object.freeze([...memberships]);
    const kept = this.list.find((membership) => membership.tenantId === this.active?.tenantId);
    this.activate(kept ?? this.list[0] ?? null);
  };

  /**
   * Makes the membership of `tenantId` the active one and its node the active scope.
   *
   * @throws TenantMembershipMissingError when the user has no membership in `tenantId`.
   */
  readonly switchTo = async (tenantId: string): Promise<void> => {
    const membership = this.list.find((candidate) => candidate.tenantId === tenantId);
    if (membership === undefined) throw TenantMembershipMissingError.create();
    this.activate(membership);
  };

  /** Sets the active membership and scope, then tells every subscriber. */
  private activate(membership: TenantMembership | null): void {
    this.active = membership;
    this.scope.set(membership === null ? null : { id: membership.tenantId, path: membership.path });
    // oxlint-disable-next-line unicorn/no-useless-spread -- reason: a copy, so a listener that unsubscribes another mid-loop does not skip it
    for (const listener of [...this.listeners]) listener();
  }
}
