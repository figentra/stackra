/**
 * Stackra file contract:
 * Purpose: `ChordDiagramProps`, the props of the native `ChordDiagram`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); STA-1371.
 */
import type { ChordDiagramContractProps } from "#contracts/types/chord-diagram-contract-props.type";

/** Props of the native ChordDiagram. */
export type ChordDiagramProps = ChordDiagramContractProps & {
  readonly className?: string | undefined;
};
