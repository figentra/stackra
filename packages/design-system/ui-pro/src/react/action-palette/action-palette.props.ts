/**
 * Stackra file contract:
 * Purpose: `ActionPaletteProps`, props of the `ActionPalette` root: its children.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 4); ADR 0303 (decision 7); ADR 0294 (decision
 *                     23); STA-403 FR-004.
 */
import type { ActionPaletteContractProps } from "#contracts/types/action-palette-contract-props.type";

/** Props of the `ActionPalette` root: its children. */
export type ActionPaletteProps = ActionPaletteContractProps;
