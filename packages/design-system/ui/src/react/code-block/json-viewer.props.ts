/**
 * Stackra file contract:
 * Purpose: `JsonViewerProps`, the props of the web `JsonViewer`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); STA-1371.
 */
import type { JsonViewerContractProps } from "#contracts/types/json-viewer-contract-props.type";

/** Props of the web JsonViewer. */
export type JsonViewerProps = JsonViewerContractProps & {
  readonly className?: string | undefined;
};
