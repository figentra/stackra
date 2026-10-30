/**
 * Stackra file contract:
 * Purpose: `KpiGroupProps`, the props of the web `KpiGroup`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0307 (decision 18); STA-1371.
 */
import type { KpiGroupContractProps } from "#contracts/types/kpi-group-contract-props.type";

/** Props of the web KpiGroup. */
export type KpiGroupProps = KpiGroupContractProps & {
  readonly className?: string | undefined;
};
