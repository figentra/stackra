/**
 * Stackra file contract:
 * Purpose: `SheetCloseProps`, the props of the web `Sheet.Close` in `sheet-close.tsx`.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12); ADR 0302 (decision 3); STA-1371.
 */
import type { SheetCloseTriggerProps as HeroSheetCloseProps } from "@heroui/react";
import type { CloseButtonContractProps } from "#contracts/types/close-button-contract-props.type";

/** Props of the web Sheet.Close: the close-button contract plus HeroUI v3's own close-trigger props. */
export type SheetCloseProps = CloseButtonContractProps &
  Omit<HeroSheetCloseProps, keyof CloseButtonContractProps | "children" | "aria-label">;
