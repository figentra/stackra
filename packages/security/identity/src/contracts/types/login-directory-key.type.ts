/**
 * Stackra file contract:
 * Purpose: `LoginDirectoryKey`, the HMAC key the login directory hashes identifiers with: its id (part of every
 *          directory key, so a rotation writes a fresh set beside the old one) and the secret.
 * Boundary: type only. The secret is read from the secret store (a Worker secret at the edge, the
 *           `IDENTITY_LOGIN_DIRECTORY_KEY` secret in a region); it is never logged, stored in KV or sent anywhere.
 * Runtime: isomorphic
 * Governing contract: ADR 0353 (decision 4); ADR 0173 (secrets are names); ADR 0451.
 */

/** The directory's hash key. */
export type LoginDirectoryKey = {
  /** The key id, such as `k2026-10`; no `:`. */
  readonly id: string;
  /** The HMAC secret. */
  readonly secret: string;
};
