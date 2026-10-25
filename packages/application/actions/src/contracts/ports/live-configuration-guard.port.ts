/**
 * Stackra file contract:
 * Purpose: the `LiveConfigurationGuard` port: whether a structural-configuration action (declared `structural: true`)
 *          may write where the call acts. Live structural configuration is read-only: it changes in a sandbox and
 *          reaches live by promotion, or through break-glass.
 * Boundary: an abstract class that is its own token, keyed `actions.LiveConfigurationGuard`. The tenancy package binds
 *           the driver: it knows whether the call's scope is a live or a sandbox environment and whether a break-glass
 *           grant is open. It rejects with @stackra/errors' `LiveReadOnlyError`. A structural action with no bound
 *           guard is an error, never an allowed write. A leaf file.
 * Runtime: isomorphic
 * Governing contract: ADR 0359 (decisions 3, 5 and 9); ADR 0280 (sandbox to live promotion).
 */
import { Port } from "@stackra/contracts";

import type { CallDescriptor } from "#contracts/types/call-descriptor.type";

/**
 * Guards live structural configuration.
 *
 * @example
 * export class TenancyLiveConfigurationGuardDriver extends Driver(LiveConfigurationGuard) {
 *   async check(call: CallDescriptor): Promise<void> {
 *     if (await this.environments.isLive(call.scope) && !(await this.breakGlass.isOpen(call.actor)))
 *       throw LiveReadOnlyError.create();
 *   }
 * }
 */
export abstract class LiveConfigurationGuard extends Port {
  /** Type-only port key, so `DriverName<LiveConfigurationGuard>` narrows to this port's drivers. */
  declare readonly "~key": "actions.LiveConfigurationGuard";

  /** Resolves when the call may change structural configuration; rejects with `LiveReadOnlyError` otherwise. */
  abstract check(call: CallDescriptor): Promise<void>;
}
