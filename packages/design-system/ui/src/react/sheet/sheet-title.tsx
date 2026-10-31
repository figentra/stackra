/**
 * Stackra file contract:
 * Purpose: the web `Sheet.Title`: HeroUI's sheet heading at the contract's outline level (2 by default); it names the
 *          sheet's dialog.
 * Boundary: no styling of its own.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0312; WCAG 2.2 SC 1.3.1 and 4.1.2; STA-1371.
 */
import { Sheet as HeroSheet } from "@heroui/react";
import type { ReactElement } from "react";
import type { SheetTitleProps } from "#react/sheet/sheet-title.props";

/** The sheet's title, a heading placed in the outline by its `level`, which also names the dialog. */
export function SheetTitle({ level = 2, ...rest }: SheetTitleProps): ReactElement {
  return <HeroSheet.Heading {...rest} level={level} />;
}
