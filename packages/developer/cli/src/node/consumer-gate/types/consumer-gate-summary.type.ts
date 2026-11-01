/**
 * Stackra file contract:
 * Purpose: `ConsumerGateSummary`, what a run writes as `summary-<product>.json`.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); STA-1813.
 */
import type { ConsumerGateStepResult } from "#node/consumer-gate/types/consumer-gate-step-result.type";

/** The summary of one product run. */
export type ConsumerGateSummary = {
  readonly product: string;
  readonly verdict: "GREEN" | "RED";
  readonly date: string;
  readonly ref: string;
  readonly core: { readonly dir: string; readonly sha: string | undefined };
  readonly checkout: { readonly sha: string | undefined };
  readonly steps: readonly ConsumerGateStepResult[];
  readonly problems: readonly string[];
};
