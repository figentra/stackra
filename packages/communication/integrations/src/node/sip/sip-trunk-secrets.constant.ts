/**
 * Stackra file contract:
 * Purpose: `SIP_TRUNK_SECRETS`, the default secret names of a SIP trunk's digest user name and password, read from the
 *          `SecretStore` at each REGISTER or challenged request.
 * Boundary: names only, never values; a trunk's options may name others (`usernameSecret`, `passwordSecret`).
 * Runtime: node
 * Governing contract: ADR 0308 (rule 6: a secret is a name); ADR 0376 (decision 7: the SIP driver).
 */

/** The default secret names. */
export const SIP_TRUNK_SECRETS = Object.freeze({
  username: "SIP_TRUNK_USERNAME",
  password: "SIP_TRUNK_PASSWORD",
} as const);
