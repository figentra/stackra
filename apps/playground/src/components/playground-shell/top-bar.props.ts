/**
 * Stackra file contract:
 * Purpose: `TopBarProps`: props of `TopBar`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 12).
 */
import type { MaterialMode } from "@stackra/tokens/contracts";

import type { SiteSection } from "./site-section.type";
import type { ShowcaseNumerals } from "./showcase-numerals.type";

/** Props of {@link TopBar}. */
export interface TopBarProps {
  /** The width classes of the row's content, the same measure as the page under it. */
  readonly width: string;
  /** Whether a component page is on screen (its sidebar folds into the menu drawer below `lg`). */
  readonly hasSidebar: boolean;
  /** The site section on screen, whose link is lit (none on the home page). */
  readonly section: SiteSection | undefined;
  /** Whether the menu drawer is open. */
  readonly isMenuOpen: boolean;
  /** Opens the menu drawer. */
  readonly onMenuOpen: () => void;
  /** Opens the command palette. */
  readonly onSearch: () => void;
  /** The material mode on screen. */
  readonly material: MaterialMode;
  /** Called with the material the reader picks. */
  readonly onMaterialChange: (material: MaterialMode) => void;
  /** The digits on screen (the customer's setting; Latin by default). */
  readonly numerals: ShowcaseNumerals;
  /** Called with the digits the reader picks. */
  readonly onNumeralsChange: (numerals: ShowcaseNumerals) => void;
}
