/**
 * Stackra file contract:
 * Purpose: `listUnsubscribeHeaders(category, mandatory, link)`, the RFC 8058 headers a bulk mail carries
 *          (`List-Unsubscribe: <link>` and `List-Unsubscribe-Post: List-Unsubscribe=One-Click`), or none for a
 *          category the recipient cannot mute (transactional, or mandatory for the pack).
 * Boundary: pure. A bulk category is one `canMute` allows muting, so the rule is the category data plus the pack's
 *           mandatory list (configuration), never a list here. The link comes from `unsubscribeLink` and must be
 *           https; the result goes into `OutboundMail.headers`.
 * Runtime: isomorphic
 * Governing contract: RFC 8058; RFC 2369; ADR 0223 (decision 5); stackra-218 (STA-1376).
 */
import { canMute } from "#core/functions/can-mute.function";

/**
 * The one-click unsubscribe headers of a mail of `category`, empty when it cannot be muted.
 *
 * @throws TypeError when `link` is not https.
 * @example
 * const headers = listUnsubscribeHeaders("marketing", config.mandatoryCategories, link);
 * await transport.send({ ...mail, headers: { ...mail.headers, ...headers } }, key);
 */
export function listUnsubscribeHeaders(
  category: string,
  mandatory: readonly string[],
  link: string,
): Readonly<Record<string, string>> {
  if (!canMute(category, mandatory)) return {};
  if (!link.startsWith("https://"))
    throw new TypeError("List-Unsubscribe: RFC 8058 needs an https link");
  return {
    "List-Unsubscribe": `<${link}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}
