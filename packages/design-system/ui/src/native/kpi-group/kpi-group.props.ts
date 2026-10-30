/**
 * Stackra file contract:
 * Purpose: `KpiGroupProps`, the props of the native `KpiGroup`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303; STA-1371.
 */
import type { KpiGroupContractProps } from "#contracts/types/kpi-group-contract-props.type";

/** Props of the native KpiGroup. */
export type KpiGroupProps = KpiGroupContractProps & {
  readonly className?: string | undefined;
};
