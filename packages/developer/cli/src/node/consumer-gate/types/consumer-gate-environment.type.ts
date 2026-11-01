/**
 * Stackra file contract:
 * Purpose: `ConsumerGateEnvironment`, the environment record of a run: what a reader needs to reproduce it.
 * Boundary: type only; hashes are sha256 hex, never a secret.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); STA-1813 (FR-012 of the Flow spec, STA-1815).
 */
import type { ConsumerGateMode } from "#node/consumer-gate/types/consumer-gate-mode.type";

/** The environment of one run; a value is `undefined` when it could not be read (a dry run installs nothing). */
export type ConsumerGateEnvironment = {
  readonly coreCommit: string | undefined;
  readonly productRef: string;
  readonly mode: ConsumerGateMode;
  readonly node: string;
  readonly pnpm: string | undefined;

  /** sha256 of the product's own committed lockfile, before the run drops it. */
  readonly lockfileBefore: string | undefined;

  /** sha256 of the scratch copy's lockfile after install. */
  readonly lockfileAfter: string | undefined;

  /** `@stackra/gen` version in the core tree. */
  readonly gen: string | undefined;

  /** sha256 of each overlay manifest, by service. */
  readonly overlays: Readonly<Record<string, string>>;

  /** One command line that re-runs the exact invocation. */
  readonly reproduce: string;
};
