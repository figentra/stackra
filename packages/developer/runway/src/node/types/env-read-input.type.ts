/**
 * Stackra file contract:
 * Purpose: `EnvReadInput`, what the CI-only environment reads take: the repository root, the environment, and the
 *          job's environment and CI answer a test replaces.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0525; ADR 0173 (amendment 2026-11-04, decision 4); STA-2104.
 */

/** The inputs of the CI-only environment reads. */
export type EnvReadInput = {
  /** The repository root that holds the runways. */
  readonly root: string;

  /** The Runway environment whose values are read. */
  readonly environment: string;

  /** The job's environment, where the secrets-decrypt action put the scope; `process.env` when unset. */
  readonly env?: Readonly<Record<string, string | undefined>> | undefined;

  /** Whether this is a CI job; unset proves it by the job's GitHub OIDC token, and a test sets it. */
  readonly ci?: boolean | undefined;
};
