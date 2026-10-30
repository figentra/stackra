/**
 * Stackra file contract:
 * Purpose: `NotificationsPanelProps`, the props of the web `NotificationsPanel` in `notifications-panel.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); gap inventory row 13; ADR 0302.
 */
import type { NotificationsPanelContractProps } from "#contracts/types/notifications-panel-contract-props.type";

/** Props of the web NotificationsPanel, with a class for the panel. */
export type NotificationsPanelProps = NotificationsPanelContractProps & {
  readonly className?: string | undefined;
};
