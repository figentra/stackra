/**
 * Stackra file contract:
 * Purpose: `SheetTitleProps`, the props of the web `Sheet.Title` in `sheet-title.tsx`.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12); ADR 0302 (decision 3); STA-1371.
 */
import type { SheetHeadingProps as HeroSheetHeadingProps } from "@heroui/react";
import type { OverlayTitleContractProps } from "#contracts/types/overlay-title-contract-props.type";

/** Props of the web Sheet.Title: the shared contract plus HeroUI v3's own heading props, passed through. */
export type SheetTitleProps = OverlayTitleContractProps &
  Omit<HeroSheetHeadingProps, keyof OverlayTitleContractProps>;
