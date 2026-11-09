/**
 * Stackra file contract:
 * Purpose: `ConsumerGateSummary`, what a run writes as `summary-<product>.json`.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); STA-1813.
 */
import type { ConsumerGateEnvironment } from "#node/consumer-gate/types/consumer-gate-environment.type";
import type { ConsumerGateMode } from "#node/consumer-gate/types/consumer-gate-mode.type";
import type { ConsumerGateStepResult } from "#node/consumer-gate/types/consumer-gate-step-result.type";

/** The summary of one product run. */
export type ConsumerGateSummary = {
  /** The matrix key of the gated product. */
  readonly product: string;

  /** The file key, `<product>@<pin>` (and `~<services>` when narrowed): one run's work, logs and summary. */
  readonly key: string;

  /** How core reached the product, `link` or `pack`. */
  readonly mode: ConsumerGateMode;

  /** GREEN when no step failed and the allow-list had no problem. */
  readonly verdict: "GREEN" | "RED";

  /** The run date, `YYYY-MM-DD`. */
  readonly date: string;

  /** The commit the product is pinned to. */
  readonly ref: string;

  /** The core tree's folder and the commit it is at. */
  readonly core: { readonly dir: string; readonly sha: string | undefined };

  /** The commit the product checkout is at. */
  readonly checkout: { readonly sha: string | undefined };

  /** How each step ended, in run order. */
  readonly steps: readonly ConsumerGateStepResult[];

  /** The allow-list problems that make the run RED. */
  readonly problems: readonly string[];

  /** What a reader needs to reproduce the run. */
  readonly environment: ConsumerGateEnvironment;

  /** Where gen left the scratch copy uncommitted (a product needs a gen commit), and how many paths. */
  readonly genDrift?: { readonly file: string; readonly changes: number };
};
