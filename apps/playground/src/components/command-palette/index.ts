/**
 * Stackra file contract:
 * Purpose: public surface of the command-palette component folder: the component and its Props only.
 * Boundary: re-exports only.
 * Runtime: browser
 * Governing contract: ADR 0294 (decision 14).
 */
export { CommandPalette } from "./command-palette";
export { type PaletteAction } from "./palette-action.type";
export { type CommandPaletteProps } from "./command-palette.props";
