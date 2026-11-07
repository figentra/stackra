/**
 * Stackra file contract:
 * Purpose: `RUNWAY_OIDC`, GitHub Actions' OIDC issuer, its published keys and the audience runway asks for, so a
 *          token minted for another service is never accepted (`proveGithubJob`).
 * Boundary: a frozen record of public URLs and a name; no secret.
 * Runtime: node
 * Governing contract: ADR 0523; STA-2100.
 */

/** The issuer, its keys and runway's audience. */
export const RUNWAY_OIDC = Object.freeze({
  issuer: "https://token.actions.githubusercontent.com",
  keys: "https://token.actions.githubusercontent.com/.well-known/jwks",
  audience: "stackra-runway",
});
