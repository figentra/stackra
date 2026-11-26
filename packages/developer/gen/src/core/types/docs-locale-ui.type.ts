/**
 * Stackra file contract:
 * Purpose: `DocsLocaleUi`, what a generated docs site needs for one language beyond its pages: the Fumadocs interface
 *          strings, the labels of the tab and group gen adds, and the web font.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0514 (Fumadocs docs sites).
 */
import type { DocsLocaleFont } from "#core/types/docs-locale-font.type";

/** The interface of one language. */
export interface DocsLocaleUi {
  /** Fumadocs interface strings (`search`, `toc`, `nextPage`, …) in the language. */
  readonly translations: Readonly<Record<string, string>>;

  /** The labels of gen's own tab and group (`API reference`, `Services`) in the language. */
  readonly labels: Readonly<Record<string, string>>;

  /** The font the language is set in; null for the site's default font. */
  readonly font: DocsLocaleFont | null;
}
