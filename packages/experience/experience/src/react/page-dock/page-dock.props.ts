/**
 * Stackra file contract:
 * Purpose: `PageDockProps`, what a page hands the PageDock: the dock's spoken name and the page's sections, each
 *          with the status line the dock shows while it is current.
 * Boundary: an interface in its own file beside the component (ADR 0305). Every word is page content; an item's `id`
 *           is a section's element id on the same page (a station's `id`).
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0305 (`<name>.props.ts`); STA-2041 (taste v2 §6, design pass §6).
 */

/**
 * The landing's section dock.
 *
 * @example
 * <PageDock label="Stations" items={[{ id: "write", label: "Write", status: "gen: 1 action" }]} />
 */
export interface PageDockProps {
  /** The navigation's spoken name, such as "Stations". */
  readonly label: string;
  /** The page's sections in reading order. */
  readonly items: readonly {
    /** The section's element id; the dock links to `#id`. */
    readonly id: string;
    /** The section's name in the dock. */
    readonly label: string;
    /** The status line in the CLI's voice while the section is current, such as `gen: 1 endpoint, 1 client`. */
    readonly status?: string | undefined;
  }[];
  /** Styles the dock. */
  readonly className?: string | undefined;
}
