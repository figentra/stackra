/**
 * Stackra file contract:
 * Purpose: `siteSectionOf`, the site section of the page on screen, whose top bar link is lit: `components` for the
 *          components index and every registry page (the foundations included), `studio` for the Theme Studio, `docs`
 *          for a route whose `handle` says so. It reads the registry and the routes' metadata, never the URL.
 * Boundary: a pure function of whether the page is a registry page and the matched routes' handles.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); WCAG 2.2 SC 2.4.8; STA-1371 (owner, 2026-10-29: component pages light
 *          Components).
 */
import type { SiteSection } from "./site-section.type";

/**
 * `components` for a registry page, else the first `section` a matched route's `handle` declares (the home page
 * declares none, so no link is lit).
 */
export function siteSectionOf(
  isRegistryPage: boolean,
  handles: readonly unknown[],
): SiteSection | undefined {
  if (isRegistryPage) return "components";
  for (const handle of handles) {
    const section = (handle as { section?: SiteSection } | undefined)?.section;
    if (section) return section;
  }
  return undefined;
}
