/**
 * Stackra file contract:
 * Purpose: `StaffPinService`, staff PINs on a shared device: enrol a PIN, quick-switch to a staff member by PIN, and a
 *          manager override, which checks the manager's PIN and then that the manager holds the permission.
 * Boundary: over `StaffPinStore`, the IAM decision point and `Clock`, under `IdentityConfig`'s PIN rules (length,
 *           iterations, attempts, lockout, override window). The PIN is never stored or logged: only its salted hash.
 *           Wrong PINs in a row lock that staff member on that device for the lockout; a right PIN resets the count.
 *           Whether a PIN-only principal is a seat is the product's catalogue choice, not decided here.
 * Runtime: isomorphic
 * Governing contract: ADR 0361 (decision 8); owner round 3 #15 (staff PIN quick-switch, manager override); ADR 0208.
 */
import { Service } from "@stackra/container";
import type { Clock } from "@stackra/contracts";
import { type Actor, type PublicId, type ScopeRef } from "@stackra/contracts";
import { ForbiddenError } from "@stackra/errors";
import type { PolicyDecisionPointService } from "@stackra/iam";

import type { IdentityConfig } from "#config/identity.config";
import type { StaffPinStore } from "#contracts/index";
import type { StaffPinCredential } from "#contracts/index";
import { StaffPinLockedError } from "#core/errors/staff-pin-locked.error";
import { StaffPinRejectedError } from "#core/errors/staff-pin-rejected.error";
import { base64UrlOf } from "#core/functions/base64-url-of.function";
import { hashStaffPin } from "#core/functions/hash-staff-pin.function";
import { sameText } from "#core/functions/same-text.function";
import type { ManagerOverride } from "#core/types/manager-override.type";
import type { StaffSwitch } from "#core/types/staff-switch.type";

/**
 * Staff PINs on shared devices.
 *
 * @example
 * const working = await pins.switchTo(till.id, cashier.id, "2468");
 * const override = await pins.override(till.id, manager, "1357", "sales.sale.refund", { scope: store });
 */
export class StaffPinService extends Service {
  /** The PIN rules. */
  private readonly config: IdentityConfig;

  /** The credentials. */
  private readonly store: StaffPinStore;

  /** The decision point a manager override asks. */
  private readonly pdp: PolicyDecisionPointService;

  /** The current time. */
  private readonly clock: Clock;

  /**
   * @param config - the PIN rules.
   * @param store - where the device keeps its PINs.
   * @param pdp - the IAM decision point.
   * @param clock - the current time.
   */
  constructor(
    config: IdentityConfig,
    store: StaffPinStore,
    pdp: PolicyDecisionPointService,
    clock: Clock,
  ) {
    super();
    this.config = config;
    this.store = store;
    this.pdp = pdp;
    this.clock = clock;
  }

  /**
   * Sets `principal`'s PIN on `device`, replacing any earlier one and clearing its lockout.
   *
   * @throws RangeError when `pin` is not digits within the configured length.
   */
  async enrol(device: PublicId, principal: PublicId, pin: string): Promise<void> {
    const { pinMinLength, pinMaxLength, pinHashIterations } = this.config;
    if (!/^\d+$/.test(pin) || pin.length < pinMinLength || pin.length > pinMaxLength)
      throw new RangeError(`a staff PIN is ${pinMinLength} to ${pinMaxLength} digits`);
    const salt = base64UrlOf(crypto.getRandomValues(new Uint8Array(16)));
    await this.store.put({
      device,
      principal,
      salt,
      iterations: pinHashIterations,
      hash: await hashStaffPin(pin, salt, pinHashIterations),
      failures: 0,
    });
  }

  /**
   * Makes `principal` the staff member working `device`, after their PIN.
   *
   * @throws StaffPinRejectedError when the PIN is wrong or `principal` has none on the device.
   * @throws StaffPinLockedError when too many wrong PINs locked them out.
   */
  async switchTo(device: PublicId, principal: PublicId, pin: string): Promise<StaffSwitch> {
    await this.check(device, principal, pin);
    return { device, staff: principal, at: this.clock.now() };
  }

  /**
   * A manager's approval of `permission` on `device`: their PIN, then the decision point.
   *
   * @throws StaffPinRejectedError or StaffPinLockedError as `switchTo`.
   * @throws ForbiddenError when the manager does not hold `permission` where the call acts.
   */
  async override(
    device: PublicId,
    manager: Actor,
    pin: string,
    permission: string,
    options: { readonly scope?: ScopeRef } = {},
  ): Promise<ManagerOverride> {
    await this.check(device, manager.id, pin);
    const at = this.clock.now();
    if (!(await this.pdp.check(manager, permission, { ...options, at })))
      throw ForbiddenError.create();
    return {
      device,
      manager: manager.id,
      permission,
      at,
      expiresAt: new Date(at.getTime() + this.config.managerOverrideSeconds * 1000),
    };
  }

  /** Checks `pin` for `principal` on `device`, counting failures and locking out. */
  private async check(device: PublicId, principal: PublicId, pin: string): Promise<void> {
    const credential = await this.store.get(device, principal);
    if (credential === undefined) throw StaffPinRejectedError.create();
    const now = this.clock.now();
    if (credential.lockedUntil !== undefined && credential.lockedUntil.getTime() > now.getTime())
      throw StaffPinLockedError.create();
    const hash = await hashStaffPin(pin, credential.salt, credential.iterations);
    if (sameText(hash, credential.hash)) {
      if (credential.failures > 0 || credential.lockedUntil !== undefined)
        await this.store.put(this.reset(credential));
      return;
    }
    const failures = credential.failures + 1;
    const locked = failures >= this.config.pinMaxAttempts;
    await this.store.put({
      ...this.reset(credential),
      failures: locked ? 0 : failures,
      ...(locked
        ? { lockedUntil: new Date(now.getTime() + this.config.pinLockoutMinutes * 60_000) }
        : {}),
    });
    throw locked ? StaffPinLockedError.create() : StaffPinRejectedError.create();
  }

  /** `credential` with no failures and no lockout. */
  private reset(credential: StaffPinCredential): StaffPinCredential {
    const { lockedUntil: _ended, ...rest } = credential;
    return { ...rest, failures: 0 };
  }
}
