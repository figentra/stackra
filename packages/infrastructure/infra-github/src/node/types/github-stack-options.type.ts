/**
 * Stackra file contract:
 * Purpose: `GithubStackOptions`, what `githubStack` applies beyond the repository, its environments and variables:
 *          the OIDC subject template, and the committed rulesets and branch protection. Both are off by default.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0171 (decision 2), ADR 0524 (figentra/infra manages repositories; rules are Flow's).
 */

/** The opt-in parts of the GitHub slice. */
export type GithubStackOptions = {
  /**
   * Pin the repository's OIDC subject template to GitHub's default. Off by default: a repository may use immutable
   * subjects or a custom template that its cloud roles and Infisical identities already trust.
   */
  readonly oidcTemplate?: boolean;
  /** Apply the committed rulesets and branch protection. Off by default: where a tool renders them (Flow), it owns them. */
  readonly rules?: boolean;
};
