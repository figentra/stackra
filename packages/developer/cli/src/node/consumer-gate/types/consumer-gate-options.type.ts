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
  readonly core: string;
  readonly checkout: string;
  readonly product: string;
  readonly out: string;
  readonly matrix: Readonly<Record<string, ConsumerGateProduct>>;
  readonly allow: ConsumerGateAllowList;
  readonly overlays?: string;
  readonly services?: readonly string[];
  readonly steps?: readonly string[];
  readonly mode?: ConsumerGateMode;
  readonly reproduce?: string;
  readonly dryRun?: boolean;
  readonly today: string;
};
