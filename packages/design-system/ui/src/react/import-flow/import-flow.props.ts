/**
 * Stackra file contract:
 * Purpose: `ImportFlowProps`, the props of the web `ImportFlow`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); STA-1371.
 */
import type { ImportFlowContractProps } from "#contracts/types/import-flow-contract-props.type";

/** Props of the web ImportFlow. */
export type ImportFlowProps = ImportFlowContractProps & {
  readonly className?: string | undefined;
};
