/**
 * Stackra file contract:
 * Purpose: `ActionPaletteInputGroupProps`, props of the search input group: the shared contract plus HeroUI Pro's own,
 *          with `aria-label` renamed.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 4); ADR 0303 (decision 7); STA-403 FR-004.
 */
import type { CommandInputGroupProps as HeroCommandInputGroupProps } from "@heroui-pro/react/command";

import type { ActionPaletteInputGroupContractProps } from "#contracts/types/action-palette-input-group-contract-props.type";

/** Props of the search input group: the shared contract plus HeroUI Pro's own, with `aria-label` renamed. */
export type ActionPaletteInputGroupProps = ActionPaletteInputGroupContractProps &
  Omit<HeroCommandInputGroupProps, keyof ActionPaletteInputGroupContractProps | "aria-label">;
