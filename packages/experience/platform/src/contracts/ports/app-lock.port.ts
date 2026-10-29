/**
 * Stackra file contract:
 * Purpose: the `AppLock` port, the device check behind the opt-in app lock (STA-1537): whether this phone can prove
 *          its owner (biometrics, or the device passcode when allowed) and the OS prompt that does.
 * Boundary: an abstract class that is its own token, keyed `platform.AppLock`; a driver per target implements it with
 *           `extends Driver(AppLock)` (memory, Expo). It never decides when to lock: `AppLockConfig` and
 *           `AppLockGate` (`./native`) do. A phone that cannot authenticate is never locked.
 * Runtime: isomorphic
 * Governing contract: ADR 0250 (2026-10-29 note); ADR 0478 (Expo's own libraries).
 */
import { Port } from "@stackra/contracts";

/**
 * Proves the phone's owner before the app shows its content.
 *
 * @example
 * const lock = useContainer().get(AppLock);
 * if (await lock.canAuthenticate(true)) unlocked = await lock.authenticate(t("platform::app_lock.reason"), true);
 */
export abstract class AppLock extends Port {
  /** Type-only port key, so `DriverName<AppLock>` narrows to this port's drivers. */
  declare readonly "~key": "platform.AppLock";

  /** Whether the phone has an enrolled biometric, or a passcode when `allowPasscode` is true. */
  abstract canAuthenticate(allowPasscode: boolean): Promise<boolean>;

  /** Shows the OS prompt with `reason`; resolves true once the owner is proven, false on cancel or failure. */
  abstract authenticate(reason: string, allowPasscode: boolean): Promise<boolean>;
}
