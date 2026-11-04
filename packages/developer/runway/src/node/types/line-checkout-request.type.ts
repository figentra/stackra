/**
 * Stackra file contract:
 * Purpose: `LineCheckoutRequest`, one checkout of a template line: the line as the root runway names it, where its
 *          release comes from, the folder it lands in, whether the folder becomes a git checkout, whether it is a
 *          dry run, and the command runner.
 * Boundary: type only; `checkoutLine` takes it.
 * Runtime: node
 * Governing contract: ADR 0481; ADR 0439 (decision 1: one template per native line); ADR 0436 (decision 4).
 */
import type { CommandRunner } from "#node/types/command-runner.type";
import type { LineSource } from "#node/types/line-source.type";

/** One line checkout. */
export type LineCheckoutRequest = LineSource & {
  /** The line, `<owner>/<name>@<major>` (`os/mobile@3`). */
  readonly line: string;
  /** The folder the release is unpacked into; it must be absent or empty. */
  readonly into: string;
  /** Make the folder a git checkout of the release with one commit, as EAS builds from a commit. */
  readonly git?: boolean;
  /** Resolve the version (one `npm view`, a read) and plan the rest: nothing is fetched, copied or written. */
  readonly dryRun?: boolean;
  /** The command runner; `runCommand` when absent, `dryRunCommand` for a dry run. */
  readonly run?: CommandRunner;
};
