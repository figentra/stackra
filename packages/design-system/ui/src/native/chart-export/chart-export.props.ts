/**
 * Stackra file contract:
 * Purpose: `ChartExportProps`, the props of the native `ChartExport`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); STA-1371.
 */
import type { ChartExportContractProps } from "#contracts/types/chart-export-contract-props.type";

/** Props of the native ChartExport. */
export type ChartExportProps = ChartExportContractProps & {
  readonly className?: string | undefined;
};
