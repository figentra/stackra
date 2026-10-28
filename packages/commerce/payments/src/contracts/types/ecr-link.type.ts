/**
 * Stackra file contract:
 * Purpose: `EcrLink`, the local link a semi-integrated card terminal driver sends its electronic cash
 *          register (ECR) messages over: `exchange` sends one message and resolves with the terminal's answer,
 *          `signal` sends one (a cancel) and resolves once the terminal acknowledges it.
 * Boundary: a structural interface, so `@stackra/payments` and `@stackra/peripherals` never import each other (ADR
 *           0377 decision 1): `EcrCardTerminalDriver` of `@stackra/peripherals/desktop` satisfies it, and a native
 *           transport (serial, USB, Bluetooth) satisfies it the same way. The link frames, acknowledges and retries;
 *           the payload is the driver's. Both calls reject when the terminal does not acknowledge or answer within
 *           `timing`, or the link drops: the driver reads every rejection as a lost answer.
 * Runtime: isomorphic
 * Governing contract: ADR 0377 (decisions 1 and 2); ADR 0339 (decision 1); ADR 0357 (decision 6).
 */

import type { EcrTiming } from "#contracts/types/ecr-timing.type";

/**
 * The till's link to the paired terminal.
 *
 * @example
 * const answer = await link.exchange(new TextEncoder().encode(message), profile.timing);
 */
export interface EcrLink {
  /** Sends `payload` and resolves with the terminal's answer payload. */
  exchange: (payload: Uint8Array, timing: EcrTiming) => Promise<Uint8Array>;

  /** Sends `payload` while an exchange may be running, and resolves once the terminal acknowledges it. */
  signal: (payload: Uint8Array, timing: EcrTiming) => Promise<void>;
}
