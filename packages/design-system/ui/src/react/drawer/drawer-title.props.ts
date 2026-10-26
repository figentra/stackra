/**
 * Stackra file contract:
 * Purpose: `DrawerTitleProps`, the props of the web `DrawerTitle` in `drawer-title.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0312; WCAG 2.2
 *          SC 1.3.1 and 4.1.2.
 */
import type { DrawerHeadingProps as HeroDrawerHeadingProps } from "@heroui/react";
import type { OverlayTitleContractProps } from "#contracts/types/overlay-title-contract-props.type";

/** Props of the web Drawer.Title: the shared contract plus HeroUI v3's own heading props, passed through. */
export type DrawerTitleProps = OverlayTitleContractProps &
  Omit<HeroDrawerHeadingProps, keyof OverlayTitleContractProps>;
