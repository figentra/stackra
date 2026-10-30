/**
 * Stackra file contract:
 * Purpose: `KpiProps`, the props of the native `Kpi`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303; STA-1371.
 */
import type { KpiContractProps } from "#contracts/types/kpi-contract-props.type";

/** Props of the native Kpi. */
export type KpiProps = KpiContractProps & {
  readonly className?: string | undefined;
};
