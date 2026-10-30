/**
 * Stackra file contract:
 * Purpose: `FooterContractProps`, the props of `Footer`: a site footer with a brand slot, columns of links that stack
 *          on narrow screens, and a bottom row with the copyright, the legal links and a locale switcher slot.
 * Boundary: types only; web only (an app's footer is its tab bar).
 * Runtime: isomorphic
 * Governing contract: WCAG 2.2 SC 1.3.1 (landmarks); STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { ReactNode } from "react";

import type { FooterLink } from "#contracts/types/footer-link.type";
import type { FooterLinkGroup } from "#contracts/types/footer-link-group.type";

/** Props of `Footer`. */
export interface FooterContractProps {
  /** The brand block at the start: a logo, a line about the shop, social links. */
  readonly brand?: ReactNode;
  /** The link columns. */
  readonly groups?: readonly FooterLinkGroup[] | undefined;
  /** The copyright line, for example "© 2026 Dukkan". */
  readonly copyright?: ReactNode;
  /** Privacy, terms and the like, in the bottom row. */
  readonly legalLinks?: readonly FooterLink[] | undefined;
  /** A locale or currency switcher at the end of the bottom row. */
  readonly localeSwitcher?: ReactNode;
  /** The links' navigation landmark name. Defaults to the catalogue's "Footer". */
  readonly label?: string | undefined;
}
