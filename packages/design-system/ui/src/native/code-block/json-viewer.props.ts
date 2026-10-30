/**
 * Stackra file contract:
 * Purpose: `JsonViewerProps`, the props of the native `JsonViewer`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303; STA-1371.
 */
import type { JsonViewerContractProps } from "#contracts/types/json-viewer-contract-props.type";

/** Props of the native JsonViewer. */
export type JsonViewerProps = JsonViewerContractProps & {
  readonly className?: string | undefined;
};
