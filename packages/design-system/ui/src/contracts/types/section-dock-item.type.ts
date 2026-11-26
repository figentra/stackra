/**
 * Stackra file contract:
 * Purpose: `SectionDockItem`, one section a `SectionDock` links to: its element id, its name and the status line the
 *          dock shows while it is the current section.
 * Boundary: types only. The label and status are page copy, already translated by the caller.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-2041.
 */

/** One section of the dock. */
export interface SectionDockItem {
  /** The section element's id; the link goes to `#id`. */
  readonly id: string;
  /** The section's name, shown in the dock. */
  readonly label: string;
  /** What the page is "doing" in this section, in the CLI's voice, such as `gen: 1 endpoint, 1 client`. */
  readonly status?: string | undefined;
}
