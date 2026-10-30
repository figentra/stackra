/**
 * Stackra file contract:
 * Purpose: `MarkdownViewerProps`, the props of the web `MarkdownViewer`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); STA-1371.
 */
import type { MarkdownViewerContractProps } from "#contracts/types/markdown-viewer-contract-props.type";

/** Props of the web MarkdownViewer. */
export type MarkdownViewerProps = MarkdownViewerContractProps & {
  readonly className?: string | undefined;
};
