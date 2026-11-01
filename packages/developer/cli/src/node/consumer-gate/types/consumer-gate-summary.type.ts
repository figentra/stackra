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
  readonly product: string;

  /** The file key, `<product>@<pin>` (and `~<services>` when narrowed): one run's work, logs and summary. */
  readonly key: string;
  readonly mode: ConsumerGateMode;
  readonly verdict: "GREEN" | "RED";
  readonly date: string;
  readonly ref: string;
  readonly core: { readonly dir: string; readonly sha: string | undefined };
  readonly checkout: { readonly sha: string | undefined };
  readonly steps: readonly ConsumerGateStepResult[];
  readonly problems: readonly string[];
  readonly environment: ConsumerGateEnvironment;

  /** Where gen left the scratch copy uncommitted (a product needs a gen commit), and how many paths. */
  readonly genDrift?: { readonly file: string; readonly changes: number };
};
