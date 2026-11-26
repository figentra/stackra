/**
 * Stackra file contract:
 * Purpose: `I18n`, the stand-in for the typed keys gen writes into `#stackra/i18n` from a member's lang files: here the
 *          keys of the "Notifications" guide's answer mail (`support::ticket_answered.mail.subject` and `.intro`).
 * Boundary: data only; an app imports `I18n` from `#stackra/i18n` and never writes this file. The English text lives in
 *           the member's `assets/lang/en/support.json`.
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (i18n keys, never literals); ADR 0294 (decision 15); STA-2852.
 */
import { keys } from "@stackra/i18n";

/** The guide's typed message keys. */
export const I18n = keys({ support: { ticket_answered: { mail: ["subject", "intro"] } } });
