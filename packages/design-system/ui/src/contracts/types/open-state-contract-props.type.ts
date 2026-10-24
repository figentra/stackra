/**
 * Stackra file contract:
 * Purpose: the three props that make an overlay open or closed, controlled or not: `isOpen`, `defaultOpen` and
 *          `onOpenChange`. Modal, Drawer, AlertDialog, Popover, Menu and Tooltip share them, so an app drives any of
 *          them the same way.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0312.
 */

/** Props for the open state of an overlay on web and native. */
export interface OpenStateContractProps {
  /** The open state, for a controlled overlay; pair it with `onOpenChange`. */
  readonly isOpen?: boolean | undefined;
  /** The starting open state, for an uncontrolled overlay. Native's own name for it is `isDefaultOpen`. */
  readonly defaultOpen?: boolean | undefined;
  /** Called with the new state each time the overlay opens or closes, from its trigger, a dismissal or the app. */
  readonly onOpenChange?: ((isOpen: boolean) => void) | undefined;
}
