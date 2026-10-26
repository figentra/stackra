/**
 * Stackra file contract:
 * Purpose: the web `Drawer.Title`: HeroUI's drawer heading, a React Aria `Heading` in the `title` slot, so it names
 *          the dialog (`aria-labelledby`) and keeps HeroUI's classes; `level` places it in the outline (default 2).
 * Boundary: reached as `Drawer.Title`; the barrel exports only its props type. React Aria's own default level is 3,
 *           which would skip a level under a page's `h1`, so the default is set here.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0312; WCAG 2.2 SC 1.3.1 and 4.1.2.
 */
import { Drawer as HeroDrawer } from "@heroui/react";
import type { ReactElement } from "react";
import type { DrawerTitleProps } from "#react/drawer/drawer-title.props";

/** The drawer's title, a heading at `level` (default 2) that also names the dialog. */
export function DrawerTitle({ level = 2, ...rest }: DrawerTitleProps): ReactElement {
  return <HeroDrawer.Heading {...rest} level={level} />;
}
