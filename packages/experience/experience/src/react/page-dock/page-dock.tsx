/**
 * Stackra file contract:
 * Purpose: `PageDock`, the landing's section dock: @stackra/ui's `SectionDock`, a sticky bottom navigation with one
 *          link per section, the current one marked as the page scrolls, and the page narrating itself in a status
 *          line.
 * Boundary: composition of @stackra/ui's `SectionDock` only; the scroll spy, the keyboard, the landmark and the status
 *           line are the dock's. It draws outside the ruled column. Every word comes in props.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0165 (UI through @stackra/ui); ADR 0060 (RTL); STA-2041 (taste
 *                     v2 §6, design pass §6).
 */
import { SectionDock } from "@stackra/ui/react";
import type { ReactElement } from "react";

import type { PageDockProps } from "#react/page-dock/page-dock.props";

/**
 * The page's sections in a dock.
 *
 * @example
 * <PageDock label="Stations" items={stations} />
 */
export function PageDock({ label, items, className }: PageDockProps): ReactElement {
  return <SectionDock label={label} items={items} className={className} />;
}
