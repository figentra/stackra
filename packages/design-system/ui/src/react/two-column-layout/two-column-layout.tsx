/**
 * Stackra file contract:
 * Purpose: the web `TwoColumnLayout`: the frame of a detail page with a main column (`children`) and a side column
 *          (`aside`). From `collapseBelow` (default `lg`) up the side column is a 20 rem column beside the main one;
 *          below it the side column stacks under the main one. It sits at the logical end, so in right-to-left it is at
 *          the left. Every `div` prop passes through to the root.
 * Boundary: HeroUI has no page layout, so this is a CSS grid of theme tokens, the documented adapted form, and it
 *           imports no sibling piece of wave 6 (ADR 0317 decision 4). The collapse point is a named breakpoint mapped to
 *           a static class (`TWO_COLUMN_LAYOUT_CLASS_NAME`), never a computed string (decision 6). The main column comes
 *           first in the document in every layout, so the reading and tab order never depend on the width. Neither
 *           column is a landmark: a side column inside the page's `main` is not a complementary region, and a `region`
 *           or `aside` nested in another landmark breaks axe's `landmark-complementary-is-top-level`. The columns
 *           themselves are `div`s with `min-w-0`, so a wide child scrolls inside its column.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3, decision 5: adapted form); ADR 0303 (decision 7); ADR 0317 (decisions 1 and
 *          6); ADR 0060 (right-to-left); WCAG 2.2 SC 1.3.2 and 1.4.10.
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";

import { TWO_COLUMN_LAYOUT_CLASS_NAME } from "#core/constants/two-column-layout-class-name.constant";
import type { TwoColumnLayoutProps } from "#react/two-column-layout/two-column-layout.props";

/** A page of a main column and a side column, stacked below `collapseBelow`. */
export function TwoColumnLayout({
  aside,
  children,
  collapseBelow = "lg",
  className,
  ...rest
}: TwoColumnLayoutProps): ReactElement {
  return (
    <div {...rest} className={cn(TWO_COLUMN_LAYOUT_CLASS_NAME[collapseBelow], className)}>
      <div data-slot="two-column-main" className="flex min-w-0 flex-col gap-3">
        {children}
      </div>
      <div data-slot="two-column-aside" className="flex min-w-0 flex-col gap-3">
        {aside}
      </div>
    </div>
  );
}
