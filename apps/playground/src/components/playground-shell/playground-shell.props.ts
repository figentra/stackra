/**
 * Stackra file contract:
 * Purpose: `PlaygroundShellProps`: props of `PlaygroundShell`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 12).
 */
import type { PageLink } from "#src/types/page-link.type";

/** Props of {@link PlaygroundShell}. */
export interface PlaygroundShellProps {
  /** The pages the navigation links to, in order. */
  pages: readonly PageLink[];
}
