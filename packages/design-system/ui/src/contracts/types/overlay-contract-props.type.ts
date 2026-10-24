/**
 * Stackra file contract:
 * Purpose: the props of an overlay the user can dismiss: the open state, and whether a press outside it or the
 *          Escape key closes it. Modal, Drawer, AlertDialog and Popover extend it; Menu and Tooltip, which dismiss
 *          themselves, take only the open state.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0312; WCAG 2.2 SC 2.1.2 (no keyboard trap).
 */
import type { OpenStateContractProps } from "#contracts/types/open-state-contract-props.type";

/** Props shared by every dismissable overlay on web and native. */
export interface OverlayContractProps extends OpenStateContractProps {
  /**
   * True, the default, to close the overlay on a press outside it (the backdrop on a modal, a drawer and a dialog).
   * Set false for a step the user must finish, and give the content its own close control.
   */
  readonly isDismissable?: boolean | undefined;
  /**
   * True to keep the Escape key from closing the overlay. It is for a flow with unsaved work or a nested overlay
   * open, so set it only with `isDismissable` false or a close control in reach. Native has no Escape key, so it
   * stays unread there unless a component's own page says it maps to the Android back button.
   */
  readonly isKeyboardDismissDisabled?: boolean | undefined;
}
