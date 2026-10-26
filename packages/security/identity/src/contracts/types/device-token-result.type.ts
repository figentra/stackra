/**
 * Stackra file contract:
 * Purpose: `DeviceTokenResult`, the answer to one poll of the device flow: its status and, once issued, the tokens.
 * Boundary: a type only. The tokens are credentials: the caller stores them in the device's secret storage at once.
 * Runtime: isomorphic
 * Governing contract: RFC 8628 (section 3.5); ADR 0235 (decision 1); ADR 0410 (STA-834).
 */
import type { DeviceTokenStatus } from "#contracts/enums/device-token-status.enum";

/** One poll's answer. */
export interface DeviceTokenResult {
  /** Where the flow stands. */
  readonly status: DeviceTokenStatus;

  /** The access token, once issued. */
  readonly accessToken?: string;

  /** The refresh token, once issued, when the scopes asked for one. */
  readonly refreshToken?: string;

  /** Seconds the access token lives, once issued. */
  readonly expiresIn?: number;
}
