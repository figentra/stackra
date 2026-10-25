/**
 * Stackra file contract:
 * Purpose: `PERMISSIONS_POLICY_BASELINE`, the powerful browser features every response turns off unless the
 *          configuration allows them by name (`CspConfig.permissionsAllow`): camera, microphone, geolocation, payment,
 *          the device buses and screen capture.
 * Boundary: a host never edits it. `securityHeaders` prints each feature as `feature=()` unless the configuration
 *           lists sources for it; a feature not named here is left to the browser's default. Internal: not exported.
 * Runtime: isomorphic
 * Governing contract: ADR 0237 (edge headers); owner round 3 #34 (security headers on by default).
 */

/** The features denied unless allowed. */
export const PERMISSIONS_POLICY_BASELINE = Object.freeze([
  "camera",
  "microphone",
  "geolocation",
  "payment",
  "usb",
  "serial",
  "hid",
  "bluetooth",
  "display-capture",
] as const);
