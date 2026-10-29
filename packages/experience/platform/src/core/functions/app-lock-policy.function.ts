/**
 * Stackra file contract:
 * Purpose: `appLockPolicy(config, role)`, the app lock for one session: the role's override merged over the app-wide
 *          values of `AppLockConfig`.
 * Boundary: pure; takes the built `AppLockConfig` the container holds. A null or unknown role gets the app-wide
 *           values.
 * Runtime: isomorphic
 * Governing contract: ADR 0250 (2026-10-29 note).
 */
import type { AppLockConfig } from "#config/app-lock.config";
import type { AppLockPolicy } from "#core/types/app-lock-policy.type";

/**
 * The app lock for a session with `role`.
 *
 * @example
 * const { isEnabled, lockAfter } = appLockPolicy(container.get(AppLockConfig), session.role);
 */
export function appLockPolicy(config: AppLockConfig, role: string | null): AppLockPolicy {
  const override = role === null ? undefined : config.roles[role];
  return {
    isEnabled: override?.isEnabled ?? config.isEnabled,
    lockAfter: override?.lockAfter ?? config.lockAfter,
  };
}
