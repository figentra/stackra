/**
 * Stackra file contract:
 * Purpose: `SiteFooterBlock`, the landing kit's footer: the link columns, the legal line and a locale switcher slot on
 *          @stackra/ui's `Footer`.
 * Boundary: composition only; the `contentinfo` landmark, the named navigation and the columns' order (mirrored in
 *           right-to-left) are the Footer's. Every word comes in props.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0165 (UI through @stackra/ui); ADR 0060 (light, dark, RTL);
 *          STA-2041.
 */
import { Footer } from "@stackra/ui/react";
import type { ReactElement } from "react";

import type { SiteFooterBlockProps } from "#react/site-footer-block/site-footer-block.props";

/**
 * The site's footer.
 *
 * @example
 * <SiteFooterBlock groups={groups} legal="Stackra is made by Figentra Technologies L.L.C" />
 */
export function SiteFooterBlock({
  groups,
  legal,
  localeSwitcher,
  className,
}: SiteFooterBlockProps): ReactElement {
  return (
    <Footer
      groups={groups}
      copyright={legal}
      localeSwitcher={localeSwitcher}
      className={className}
    />
  );
}
