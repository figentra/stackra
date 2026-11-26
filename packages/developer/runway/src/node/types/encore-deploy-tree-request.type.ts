/**
 * Stackra file contract:
 * Purpose: `EncoreDeployTreeRequest`, one Encore deploy tree to build: the repository whose service the push ships,
 *          the commit the tree starts from, and the command runner.
 * Boundary: type only; `encoreDeployTree` takes it.
 * Runtime: node
 * Governing contract: ADR 0091 (decision 2: the generated Encore app), ADR 0289 (decision 5: Encore Cloud), STA-136.
 */
import type { CommandRunner } from "#node/types/command-runner.type";

/** One Encore deploy tree. */
export type EncoreDeployTreeRequest = {
  /** The repository root (the folder with the root runway), with the product built and `stackra gen` run. */
  readonly repository: string;
  /** The commit the deploy commit sits on. */
  readonly sha: string;
  /** The command runner that runs `git`. */
  readonly run: CommandRunner;
};
