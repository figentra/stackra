/**
 * Stackra file contract:
 * Purpose: `ConsumerGateOptions`, the resolved input of one `runConsumerGate`: absolute paths, the loaded matrix and
 *          allow-list, and the narrowing flags.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); STA-1813.
 */
import type { ConsumerGateAllowList } from "#node/consumer-gate/types/consumer-gate-allow-list.type";
import type { ConsumerGateMode } from "#node/consumer-gate/types/consumer-gate-mode.type";
import type { ConsumerGateProduct } from "#node/consumer-gate/types/consumer-gate-product.type";

/** The input of one gate run. */
export type ConsumerGateOptions = {
  /** The built core tree the product is gated against. */
  readonly core: string;

  /** The product checkout, at the commit the matrix pins. */
  readonly checkout: string;

  /** The matrix key of the product to gate. */
  readonly product: string;

  /** The folder the run writes its work copy, logs and summaries to. */
  readonly out: string;

  /** Every product the gate knows, by key. */
  readonly matrix: Readonly<Record<string, ConsumerGateProduct>>;

  /** The loaded allow-list of excused failures. */
  readonly allow: ConsumerGateAllowList;

  /** The folder holding overlay manifests, one subfolder per service. */
  readonly overlays?: string;

  /** The services to gate, narrower than the matrix list. */
  readonly services?: readonly string[];

  /** The steps to run, narrower than the planned list. */
  readonly steps?: readonly string[];

  /** How core reaches the product; the matrix entry's mode when absent. */
  readonly mode?: ConsumerGateMode;

  /** The command line that re-runs this invocation, recorded in the summary. */
  readonly reproduce?: string;

  /** Plans every step and skips running it. */
  readonly dryRun?: boolean;

  /** The run date, `YYYY-MM-DD`. */
  readonly today: string;
};
