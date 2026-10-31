/**
 * Stackra file contract:
 * Purpose: `ChordDiagramProps`, the props of the web `ChordDiagram`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); STA-1371.
 */
import type { ChordDiagramContractProps } from "#contracts/types/chord-diagram-contract-props.type";

/** Props of the web ChordDiagram. */
export type ChordDiagramProps = ChordDiagramContractProps & {
  readonly className?: string | undefined;
};
