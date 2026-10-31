/**
 * Stackra file contract:
 * Purpose: `SheetProps`, the props of the web `Sheet` in `sheet.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0165 (HeroUI v3
 *          on web); owner approval 2026-10-31 (STA-1371).
 */
import type { SheetDialogProps as HeroSheetDialogProps } from "@heroui/react";
import type { SheetContractProps } from "#contracts/types/sheet-contract-props.type";

/**
 * Props of the web Sheet: the shared contract plus HeroUI v3's own dialog props, passed through to the dialog. HeroUI's
 * `aria-label` is the contract's `label`, and its physical `left` and `right` edges are the contract's `start` and
 * `end`.
 */
export type SheetProps = SheetContractProps &
  Omit<HeroSheetDialogProps, keyof SheetContractProps | "aria-label">;
