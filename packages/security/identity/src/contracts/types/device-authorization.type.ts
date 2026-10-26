/**
 * Stackra file contract:
 * Purpose: `DeviceAuthorization`, the start of an OAuth device flow (RFC 8628 section 3.2): the device code the device
 *          polls with, the user code and the page the user enters it on, and the timing.
 * Boundary: a type only. The device code is a credential while it lives: kept on the device, never logged.
 * Runtime: isomorphic
 * Governing contract: RFC 8628; ADR 0235 (decision 1); ADR 0410 (STA-834).
 */

/** A started device authorization. */
export interface DeviceAuthorization {
  /** What the device polls the token endpoint with. */
  readonly deviceCode: string;

  /** What the user types on the verification page. */
  readonly userCode: string;

  /** The page the user opens. */
  readonly verificationUri: string;

  /** The page with the user code filled in, when the provider offers one (for a QR code). */
  readonly verificationUriComplete?: string;

  /** Seconds until the codes expire. */
  readonly expiresIn: number;

  /** Seconds to wait between polls. */
  readonly interval: number;
}
