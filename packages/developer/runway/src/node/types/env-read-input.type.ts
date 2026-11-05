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
  readonly root: string;
  readonly environment: string;
  readonly projectId?: string | undefined;
  readonly run?: CommandRunner | undefined;
  readonly ci?: boolean | undefined;
};
