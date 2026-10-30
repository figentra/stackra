/**
 * Stackra file contract:
 * Purpose: `CommandPaletteProps`, the props of the native `CommandPalette`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303; STA-1371.
 */
import type { CommandPaletteContractProps } from "#contracts/types/command-palette-contract-props.type";

/** Props of the native CommandPalette. */
export type CommandPaletteProps = CommandPaletteContractProps & {
  readonly className?: string | undefined;
};
