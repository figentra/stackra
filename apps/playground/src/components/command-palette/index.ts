/**
 * Stackra file contract:
 * Purpose: public surface of the command-palette component folder: the component and its Props only.
 * Boundary: re-exports only.
 * Runtime: browser
 * Governing contract: ADR 0294 (decision 14).
 */
export { CommandPalette, type CommandPaletteProps, type PaletteAction } from "./command-palette";
