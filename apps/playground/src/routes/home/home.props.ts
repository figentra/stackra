/**
 * Stackra file contract:
 * Purpose: `HomeProps`: props of `Home`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 12).
 */
import type { PageLink } from "#src/types/page-link.type";

/** Props of {@link Home}. */
export interface HomeProps {
  /** The pages to list, in order. */
  pages: readonly PageLink[];
}
