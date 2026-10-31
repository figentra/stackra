/**
 * Stackra file contract:
 * Purpose: `TreeDiagramProps`, the props of the native `TreeDiagram`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); STA-1371.
 */
import type { TreeDiagramContractProps } from "#contracts/types/tree-diagram-contract-props.type";

/** Props of the native TreeDiagram. */
export type TreeDiagramProps = TreeDiagramContractProps & {
  readonly className?: string | undefined;
};
