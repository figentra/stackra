/**
 * Stackra file contract:
 * Purpose: the web `Drawer.Title`: HeroUI's drawer heading, a React Aria `Heading` in the `title` slot, so it names
 *          the dialog (`aria-labelledby`) and keeps HeroUI's classes; `level` places it in the outline (default 2).
 * Boundary: reached as `Drawer.Title`; the barrel exports only its props type. React Aria's own default level is 3,
 *           which would skip a level under a page's `h1`, so the default is set here.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0312; WCAG 2.2 SC 1.3.1 and 4.1.2.
 */
import {
  Drawer as HeroDrawer,
  type DrawerHeadingProps as HeroDrawerHeadingProps,
} from "@heroui/react";
import type { ReactElement } from "react";

import type { OverlayTitleContractProps } from "#contracts/types/overlay-title-contract-props.type";

/** Props of the web Drawer.Title: the shared contract plus HeroUI v3's own heading props, passed through. */
export type DrawerTitleProps = OverlayTitleContractProps &
  Omit<HeroDrawerHeadingProps, keyof OverlayTitleContractProps>;

/** The drawer's title, a heading at `level` (default 2) that also names the dialog. */
export function DrawerTitle({ level = 2, ...rest }: DrawerTitleProps): ReactElement {
  return <HeroDrawer.Heading {...rest} level={level} />;
}
