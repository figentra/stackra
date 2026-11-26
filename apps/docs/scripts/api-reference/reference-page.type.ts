/**
 * Stackra file contract:
 * Purpose: `ReferencePage`, one generated reference page: its path under `src/docs` and its MDX.
 * Boundary: data only; `renderReferencePages` fills it.
 * Runtime: node
 * Governing contract: STA-2857.
 */

/** One generated page. */
export interface ReferencePage {
  /** The path under `src/docs`, with the extension (`customers/reference/money.mdx`). */
  readonly path: string;
  /** The page's MDX, ending with one newline. */
  readonly content: string;
}
