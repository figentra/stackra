/**
 * Stackra file contract:
 * Purpose: `SiteFooterProps`, what a page hands the SiteFooter: the link columns, the legal line and a locale
 *          switcher slot.
 * Boundary: an interface in its own file beside the component (ADR 0305). Links and words are page content.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0305 (`<name>.props.ts`); STA-2041.
 */
import type { FooterLinkGroup } from "@stackra/ui/contracts";
import type { ReactNode } from "react";

/**
 * The site's footer.
 *
 * @example
 * <SiteFooter groups={groups} legal="Stackra is made by Figentra Technologies L.L.C" />
 */
export interface SiteFooterProps {
  /** The link columns, each a titled list. */
  readonly groups: readonly FooterLinkGroup[];
  /** The legal line in the bottom row, such as "Stackra is made by Figentra Technologies L.L.C". */
  readonly legal: string;
  /** A locale switcher at the end of the bottom row. */
  readonly localeSwitcher?: ReactNode;
  /** Styles the footer. */
  readonly className?: string | undefined;
}
