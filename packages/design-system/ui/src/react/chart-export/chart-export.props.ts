/**
 * Stackra file contract:
 * Purpose: `ChartExportProps`, the props of the web `ChartExport`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); STA-1371.
 */
import type { ChartExportContractProps } from "#contracts/types/chart-export-contract-props.type";

/** Props of the web ChartExport. */
export type ChartExportProps = ChartExportContractProps & {
  readonly className?: string | undefined;
};
