/**
 * Stackra file contract:
 * Purpose: `ToolsRegionPlan`, one region's tools stack: the region's cloud, location and account, its network, its
 *          private namespace, how long its logs are kept, and its tools.
 * Boundary: type only; plain data.
 * Runtime: isomorphic
 * Governing contract: owner decision R3-5 (2026-10-26); ADR 0444; ADR 0354 (decision 4: regions).
 */
import type { ToolPlan } from "#core/types/tool-plan.type";
import type { ToolsNetwork } from "#core/types/tools-network.type";

/** One region's stack. */
export type ToolsRegionPlan = {
  /** The root runway region key. */
  readonly key: string;
  /** `aws` or `gcp`. */
  readonly cloud: string;
  /** The cloud region (`me-central-1`). */
  readonly location: string;
  /** The account, an id or `ref:<path>`, when the runway names one. */
  readonly account?: string;
  /** The network the tools run in, when the runway names one. */
  readonly network?: ToolsNetwork;
  /** The private namespace, `<region>.tools.<project>.internal`. */
  readonly namespace: string;
  /** How many days the region's tool logs are kept. */
  readonly logRetentionDays: number;
  /** The tools this region runs. */
  readonly tools: readonly ToolPlan[];
};
