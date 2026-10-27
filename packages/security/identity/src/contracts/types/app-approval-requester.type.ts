/**
 * Stackra file contract:
 * Purpose: `AppApprovalRequester`, who asks for an app approval: the requesting device, its IP address, a coarse
 *          location and its user agent, shown in the app so the user can spot a request that is not theirs.
 * Boundary: a type only. The host fills it from the request (the device id from its device cookie, the location from
 *           its IP lookup, city level at most); personal data, shown to the account holder only and never logged.
 * Runtime: isomorphic
 * Governing contract: STA-1304 (owner request 2026-10-27); ADR 0134 (personal data).
 */

/** The requesting device. */
export interface AppApprovalRequester {
  /** The requesting device's id; one pending challenge per principal per device. */
  readonly device: string;

  /** Its IP address. */
  readonly ip: string;

  /** A coarse location (`Riyadh, SA`), when the host resolves one. */
  readonly location?: string;

  /** Its user agent. */
  readonly userAgent: string;
}
