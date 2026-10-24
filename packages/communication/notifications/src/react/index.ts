/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./react` entry of @stackra/notifications (`MailProps`, `useMail`), what a `.mail.tsx`
 *          body imports, until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Imports `.` only. The renderer and the tools type stay internal;
 *           tests render through `renderMail` in `./testing`. This folds the old `./mail` entry into a standard one
 *           (owner answer to registry Q4).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export type { MailProps } from "#react/mail/mail-props.type";
export { useMail } from "#react/mail/use-mail";
