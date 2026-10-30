/**
 * Stackra file contract:
 * Purpose: `MarkdownViewerProps`, the props of the native `MarkdownViewer`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303; STA-1371.
 */
import type { MarkdownViewerContractProps } from "#contracts/types/markdown-viewer-contract-props.type";

/** Props of the native MarkdownViewer. */
export type MarkdownViewerProps = MarkdownViewerContractProps & {
  readonly className?: string | undefined;
};
