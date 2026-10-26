/**
 * Stackra file contract:
 * Purpose: the web `SingleColumnLayout`: the frame of a detail page with one column, a flex column that stacks its
 *          children (usually Sections) with an even gap; every `div` prop passes through.
 * Boundary: HeroUI has no page layout, so this is a plain `div` of theme tokens (a gap), the documented adapted form,
 *           and it imports no sibling piece of wave 6 (ADR 0317 decision 4). It draws no landmark and no heading: the
 *           page's `main` is the shell's and its `h1` the PageHeader's. `min-w-0` lets a wide child (a table) scroll
 *           inside the column instead of widening the page.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3, decision 5: adapted form); ADR 0303 (decision 7); ADR 0317 (decision 7);
 *          WCAG 2.2 SC 1.4.10.
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";
import type { SingleColumnLayoutProps } from "#react/single-column-layout/single-column-layout.props";

/** A page of one column: its children stacked from top to bottom with a gap. */
export function SingleColumnLayout({ className, ...rest }: SingleColumnLayoutProps): ReactElement {
  return <div {...rest} className={cn("flex min-w-0 flex-col gap-3", className)} />;
}
