/**
 * Stackra file contract:
 * Purpose: `CommandListOptions`, how the command list is drawn: the order of its headings and how many commands it
 *          leaves out, so it can say that `<bin> list --all` shows them.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: STA-2872 spec FR-001 and FR-003.
 */

/** The options of a command list. */
export interface CommandListOptions {
  /** The headings drawn first, in this order; any other heading follows alphabetically. */
  readonly order?: readonly string[];

  /** How many commands the list leaves out (hidden or unlisted); a positive count adds the `list --all` hint. */
  readonly more?: number;
}
