/**
 * Stackra file contract:
 * Purpose: `EnvReadInput`, what the CI-only environment reads take: the repository root, the environment, the
 *          runtime project id, and the runner and CI answer a test replaces.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0173 (amendment 2026-11-04, decision 4); STA-2104.
 */
import type { CommandRunner } from "#node/types/command-runner.type";

/** The inputs of the CI-only environment reads. */
export type EnvReadInput = {
  /** The repository root that holds the runways. */
  readonly root: string;

  /** The Runway environment whose values are read. */
  readonly environment: string;

  /** The runtime Infisical project id; the root runway's `providers.infisical.workspace` when unset. */
  readonly projectId?: string | undefined;

  /** The command runner for the Infisical CLI; a test replaces it. */
  readonly run?: CommandRunner | undefined;

  /** Whether this is a CI job; unset proves it by the job's GitHub OIDC token, and a test sets it. */
  readonly ci?: boolean | undefined;
};
