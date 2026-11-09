/**
 * Stackra file contract:
 * Purpose: `GithubJobClaims`, the claims of a GitHub Actions job `proveGithubJob` verified: the repository, the job's
 *          GitHub environment, its ref and commit.
 * Boundary: type only; claims, never the token.
 * Runtime: node
 * Governing contract: ADR 0468; ADR 0523; STA-2100.
 */

/** The verified claims of one job. */
export type GithubJobClaims = {
  /** `<org>/<repo>`, as the root runway names it. */
  readonly repository: string;
  /** The GitHub environment the job runs in, when it runs in one. */
  readonly environment?: string | undefined;
  /** The ref the job runs on (`refs/heads/main`). */
  readonly ref?: string | undefined;
  /** The commit the job runs on. */
  readonly sha?: string | undefined;
};
