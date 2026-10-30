/**
 * Stackra file contract:
 * Purpose: `KpiProps`, the props of the web `Kpi`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0307 (decisions 15 and 18); STA-1371.
 */
import type { KpiContractProps } from "#contracts/types/kpi-contract-props.type";

/** Props of the web Kpi. */
export type KpiProps = KpiContractProps & {
  readonly className?: string | undefined;
};
