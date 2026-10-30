/**
 * Stackra file contract:
 * Purpose: `ImportFlowProps`, the props of the native `ImportFlow`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303; STA-1371.
 */
import type { ImportFlowContractProps } from "#contracts/types/import-flow-contract-props.type";

/** Props of the native ImportFlow. */
export type ImportFlowProps = ImportFlowContractProps & {
  readonly className?: string | undefined;
};
