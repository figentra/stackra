/**
 * Stackra file contract:
 * Purpose: `GithubStack`, what `githubStack` gives the generated Pulumi program to export: the repository's full name
 *          and the CI secret names jobs read from Infisical.
 * Boundary: type only. Names and ids, never a secret value.
 * Runtime: node
 * Governing contract: ADR 0171 (decision 3: the generated program), ADR 0173 (decision 6: names in git).
 */
import type * as pulumi from "@pulumi/pulumi";

/** The GitHub slice's outputs. */
export type GithubStack = {
  /** `<org>/<repo>`, once GitHub reports it. */
  readonly repository: pulumi.Output<string>;
  /** The CI secret names the deploy jobs fetch from Infisical `/ci`; GitHub stores none of them. */
  readonly ciSecrets: readonly string[];
};
