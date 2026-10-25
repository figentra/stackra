/**
 * Stackra file contract:
 * Purpose: `GithubEnvironment`, one GitHub deployment environment of the plan: who approves a deployment, which
 *          branches and tags may deploy, and its own Actions variables.
 * Boundary: type only; `githubPlan` builds it. Its name is the subject CI's OIDC trust matches
 *           (`repo:<org>/<repo>:environment:<name>`), so a job gets the environment's cloud role only when bound to it.
 * Runtime: isomorphic
 * Governing contract: ADR 0170 (decision 6), ADR 0167 (CI over OIDC), ADR 0284 (decision 6: the `static` environment).
 */

/** One deployment environment. */
export type GithubEnvironment = {
  /** The environment name: a runway environment, or one only GitHub knows (`release`, `static`). */
  readonly name: string;
  /** Slugs of the org's teams that may approve a deployment. */
  readonly teams: readonly string[];
  /** Logins of the users who may approve a deployment. */
  readonly users: readonly string[];
  /** Branch patterns that may deploy; with `tags` also empty, any ref may (a pull-request preview). */
  readonly branches: readonly string[];
  /** Tag patterns that may deploy. */
  readonly tags: readonly string[];
  /** Variables only jobs in this environment see: name → public value or `ref:<path>`. */
  readonly variables: Readonly<Record<string, string>>;
};
