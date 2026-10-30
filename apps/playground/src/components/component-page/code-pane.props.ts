/**
 * Stackra file contract:
 * Purpose: `CodePaneProps`, props of the collapsible code pane under a preview.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); showcase redesign spec (2026-10-27) section 4.
 */

/** Props of `CodePane`. */
export interface CodePaneProps {
  /** The file name shown in the header. */
  readonly fileName: string;
  /** Loads the source when the pane first opens; undefined when no demo file exists. */
  readonly load?: (() => Promise<string>) | undefined;
  /** True to show the code at once, without the Show code toggle (the Code tab of an example). */
  readonly isOpen?: boolean | undefined;
}
