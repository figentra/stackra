/**
 * Stackra file contract:
 * Purpose: `GithubPlan`, the repository as code, read from the root runway: the org, the repository and its
 *          visibility, the repository Actions variables, the deployment environments, and the names of the CI
 *          secrets jobs decrypt from sops.
 * Boundary: type only; `githubPlan` builds it and `githubStack` (`./node`) applies it. A `ref:` value stays a ref
 *           here; the slice resolves it from the stack config. No secret value appears anywhere in it.
 * Runtime: isomorphic
 * Governing contract: ADR 0171 (decisions 2 and 4), ADR 0173 (decisions 5 and 6: names in git), ADR 0525 (CI decrypts
 *                     sops over OIDC), ADR 0284 (decision 7: the CI identity is a repository variable, never a secret).
 */
import type { GithubVisibility } from "#core/enums/github-visibility.enum";
import type { GithubEnvironment } from "#core/types/github-environment.type";

/** One repository's GitHub configuration. */
export type GithubPlan = {
  /** The organisation that owns the repository. */
  readonly org: string;
  /** The repository name. */
  readonly repo: string;
  /** Who can see it; `private` unless the runway says otherwise. */
  readonly visibility: GithubVisibility;
  /** The one-sentence description GitHub shows; the metadata standard declares it for every repository. */
  readonly description?: string;
  /** The topics, in the order listed: the base set for the repository's type, then its domain topics. */
  readonly topics?: readonly string[];
  /** The homepage URL: the live docs site, else the live product site; absent when neither is live. */
  readonly homepage?: string;
  /** Repository Actions variables: name → public value or `ref:<path>`. */
  readonly variables: Readonly<Record<string, string>>;
  /** The deployment environments, runway environments first in promotion order. */
  readonly environments: readonly GithubEnvironment[];
  /** The root runway's CI secret names: jobs decrypt them from sops over OIDC, and GitHub holds none of them. */
  readonly ciSecrets: readonly string[];
};
