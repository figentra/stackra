/**
 * Stackra file contract:
 * Purpose: `CommandPaletteProps`, the props of the web `CommandPalette`: the shared contract.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); STA-1371.
 */
import type { CommandPaletteContractProps } from "#contracts/types/command-palette-contract-props.type";

/** Props of the web CommandPalette. */
export type CommandPaletteProps = CommandPaletteContractProps;
