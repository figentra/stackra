/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./react` entry of @stackra/notifications: what a `.mail.tsx` body imports
 *          (`MailProps`, `useMail`) and the notifications kit's web blocks (`NotificationInbox`,
 *          `NotificationPreferences`), until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Imports `.` and `./contracts` only. The renderer and the tools
 *           type stay internal; tests render through `renderMail` in `./testing`. This folds the old `./mail` entry
 *           into a standard one (owner answer to registry Q4).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0504 (module UI kits); the STA-347 stand-in barrel decision.
 */
export type { MailProps } from "#react/mail/mail-props.type";
export { useMail } from "#react/mail/use-mail";
export { NotificationInbox } from "#react/notification-inbox/notification-inbox";
export type { NotificationInboxProps } from "#react/notification-inbox/notification-inbox.props";
export { NotificationPreferences } from "#react/notification-preferences/notification-preferences";
export type { NotificationPreferencesProps } from "#react/notification-preferences/notification-preferences.props";
