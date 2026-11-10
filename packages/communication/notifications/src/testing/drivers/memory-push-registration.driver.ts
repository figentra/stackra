/**
 * Stackra file contract:
 * Purpose: `MemoryPushRegistrationDriver`, a `PushRegistration` held in memory, for tests, the showcase and local
 *          runs: `answers` sets what the device's permission prompt answers (granted by default); a granted answer
 *          records the registration once per idempotency key.
 * Boundary: process-local; asks no device and registers nothing with a service.
 * Runtime: isomorphic
 * Governing contract: ADR 0263 (a driver is named by its class: `memory`); ADR 0266 (memory first); ADR 0269
 *                     (decision 3); ADR 0138 (idempotency).
 */
import { Driver } from "@stackra/container";

import { PushRegistration } from "#contracts/ports/push-registration.port";
import type { PushPermission } from "#contracts/types/push-permission.type";

/** What one `register` receives. */
type Input = Parameters<PushRegistration["register"]>[0];

/**
 * A push registration held in memory.
 *
 * @example
 * const registration = new MemoryPushRegistrationDriver().answers("denied");
 */
export class MemoryPushRegistrationDriver extends Driver(PushRegistration) {
  /** Each registration made, oldest first, for a test to read. */
  readonly registrations: Input[] = [];

  /** What the permission prompt answers. */
  private answer: PushPermission = "granted";

  /** The idempotency keys already registered. */
  private readonly keys = new Set<string>();

  /** Sets what the permission prompt answers; returns this driver. */
  answers(permission: PushPermission): this {
    this.answer = permission;
    return this;
  }

  /** Records `input` once per idempotency key when permission is granted; resolves to the set answer. */
  register(input: Input): Promise<PushPermission> {
    const isRepeat = input.idempotencyKey !== undefined && this.keys.has(input.idempotencyKey);
    if (this.answer === "granted" && !isRepeat) {
      this.registrations.push(input);
      if (input.idempotencyKey !== undefined) this.keys.add(input.idempotencyKey);
    }
    return Promise.resolve(this.answer);
  }
}
