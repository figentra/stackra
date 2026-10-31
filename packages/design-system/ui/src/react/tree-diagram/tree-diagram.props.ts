/**
 * Stackra file contract:
 * Purpose: `TreeDiagramProps`, the props of the web `TreeDiagram`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); STA-1371.
 */
import type { TreeDiagramContractProps } from "#contracts/types/tree-diagram-contract-props.type";

/** Props of the web TreeDiagram. */
export type TreeDiagramProps = TreeDiagramContractProps & {
  readonly className?: string | undefined;
};
