/**
 * Stackra file contract:
 * Purpose: `MemoryAccountSecurityDriver`, the `AccountSecurity` driver of tests and previews: one account's password
 *          flag, second factors, passkeys and device sessions in memory, changed by the port's calls.
 * Boundary: test code only. It checks no password; `requireStepUpOnce` makes the next sensitive call (changing the
 *           password, removing a passkey) refuse with `StepUpRequiredError`, once, as the server does after an old
 *           authentication. Removing or revoking an unknown id is a no-op.
 * Runtime: isomorphic
 * Governing contract: ADR 0269 (decision 3: test drivers in ./testing); ADR 0260 (client ports); ADR 0207 (decision 1).
 */
import { Driver } from "@stackra/container";
import { AssuranceLevel } from "@stackra/contracts";

import { AccountSecurity } from "#contracts/index";
import type { AccountSecurityOverview, DeviceSession } from "#contracts/index";
import { StepUpRequiredError } from "#core/index";

/**
 * One account's security settings in memory.
 *
 * @example
 * const security = new MemoryAccountSecurityDriver().seed({ passkeys: [{ id: "pk_1", name: "iPhone", createdAt, lastUsedAt: null }] });
 * security.requireStepUpOnce();
 * await security.removePasskey("pk_1"); // throws StepUpRequiredError
 */
export class MemoryAccountSecurityDriver extends Driver(AccountSecurity) {
  /** The passwords set, newest last; a test reads it. */
  readonly passwords: string[] = [];

  /** The account's sign-in methods. */
  private state: AccountSecurityOverview = { hasPassword: true, secondFactors: [], passkeys: [] };

  /** The device sessions, this one first. */
  private devices: readonly DeviceSession[] = [];

  /** Whether the next sensitive call refuses with `step_up_required`. */
  private isStepUpDue = false;

  /**
   * Replaces the held settings.
   *
   * @returns this driver, to chain.
   */
  seed(
    overview: Partial<AccountSecurityOverview> = {},
    sessions: readonly DeviceSession[] = [],
  ): this {
    this.state = { ...this.state, ...overview };
    this.devices = sessions;
    return this;
  }

  /**
   * Makes the next sensitive call refuse with `StepUpRequiredError`, once.
   *
   * @returns this driver, to chain.
   */
  requireStepUpOnce(): this {
    this.isStepUpDue = true;
    return this;
  }

  /** The held settings. */
  overview(): Promise<AccountSecurityOverview> {
    return Promise.resolve(this.state);
  }

  /** Keeps `next`; refuses once after `requireStepUpOnce`. */
  async changePassword(input: { readonly current: string; readonly next: string }): Promise<void> {
    this.stepUp();
    this.passwords.push(input.next);
    this.state = { ...this.state, hasPassword: true };
    await Promise.resolve();
  }

  /** Drops the passkey; refuses once after `requireStepUpOnce`. */
  async removePasskey(id: string): Promise<void> {
    this.stepUp();
    this.state = {
      ...this.state,
      passkeys: this.state.passkeys.filter((passkey) => passkey.id !== id),
    };
    await Promise.resolve();
  }

  /** Renames the passkey. */
  renamePasskey(input: { readonly id: string; readonly name: string }): Promise<void> {
    this.state = {
      ...this.state,
      passkeys: this.state.passkeys.map((passkey) =>
        passkey.id === input.id ? { ...passkey, name: input.name } : passkey,
      ),
    };
    return Promise.resolve();
  }

  /** The held device sessions. */
  sessions(): Promise<readonly DeviceSession[]> {
    return Promise.resolve(this.devices);
  }

  /** Drops the session. */
  revokeSession(id: string): Promise<void> {
    this.devices = this.devices.filter((device) => device.id !== id);
    return Promise.resolve();
  }

  /** Keeps only the current session. */
  revokeOtherSessions(): Promise<void> {
    this.devices = this.devices.filter((device) => device.isCurrent);
    return Promise.resolve();
  }

  /** Throws the pending step-up refusal, once. */
  private stepUp(): void {
    if (!this.isStepUpDue) return;
    this.isStepUpDue = false;
    throw StepUpRequiredError.create({ required: AssuranceLevel.Aal2 });
  }
}
