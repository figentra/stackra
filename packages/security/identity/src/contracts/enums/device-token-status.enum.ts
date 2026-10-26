/**
 * Stackra file contract:
 * Purpose: `DeviceTokenStatus`, the answer to one poll of the OAuth device flow (RFC 8628 section 3.5): still waiting,
 *          poll slower, the user refused, the code expired, or the token was issued.
 * Boundary: an `Enum.of` value plus the type of the same name; the codes are the RFC's error codes where it has one.
 * Runtime: isomorphic
 * Governing contract: RFC 8628; ADR 0235 (decision 1: devices sign in with the device flow); ADR 0410 (STA-834).
 */
import { Enum } from "@stackra/contracts";

/** The states of a device authorization poll. */
export const DeviceTokenStatus = Enum.of({
  /** The user has not finished yet; poll again after the interval. */
  Pending: "authorization_pending",
  /** Polled too fast; add five seconds to the interval. */
  SlowDown: "slow_down",
  /** The user refused. */
  Denied: "access_denied",
  /** The device code expired; start again. */
  Expired: "expired_token",
  /** The token was issued. */
  Issued: "issued",
});

/** One of the codes above. */
export type DeviceTokenStatus = Enum.Value<typeof DeviceTokenStatus>;
