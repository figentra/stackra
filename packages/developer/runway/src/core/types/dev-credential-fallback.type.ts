/**
 * Stackra file contract:
 * Purpose: `DevCredentialFallback`, the placeholder credentials a dev infra kind offers a member's local run for one
 *          SDK credential chain (`aws`: the SeaweedFS store's key pair), given only when that run has no credential
 *          of its own on the chain, so a real credential the developer keeps (a profile, SSO, a web identity) is never
 *          shadowed for the other clients of that SDK.
 * Boundary: type only. The values are placeholders a loopback-only container accepts, never a secret; whether the
 *           member has its own credential is checked where the environment and the home folder are known (the CLI).
 * Runtime: isomorphic
 * Governing contract: ADR 0199 (decision 3); ADR 0173 (no secret values); STA-2664 (item 6).
 */

/** Placeholder credentials for one credential chain. */
export type DevCredentialFallback = {
  /** The SDK credential chain the placeholders stand in for. */
  readonly chain: "aws";
  /** The variables, given only when the member has no credential on `chain`. */
  readonly env: Readonly<Record<string, string>>;
};
