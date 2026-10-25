/**
 * Stackra file contract:
 * Purpose: `messagesOf`, how a client runtime that has no route loader (native, a prerendered page's hydration) gets
 *          a locale's merged catalogues: through the wiring's `messages` section, gen's `loadMessages`.
 * Boundary: loads through the wiring only; a wiring without the section fails loudly, so the i18n context is never
 *           mounted with empty catalogues that would render raw keys. Not exported.
 * Runtime: isomorphic
 * Governing contract: ADR 0295 (decision 10); ADR 0080 (catalogues); ADR 0263 (decision 11).
 */
import type { Wiring } from "@stackra/container";
import type { Locale } from "@stackra/i18n";

import type { AppMessages } from "#core/types/app-messages.type";
import type { AppSections } from "#core/types/app-sections.type";

/**
 * The catalogues of `locale`.
 *
 * @throws Error when the wiring has no `messages` loader.
 * @example
 * const messages = await messagesOf(wiring, Locale.Ar);
 */
export async function messagesOf(
  wiring: Wiring & AppSections,
  locale: Locale,
): Promise<AppMessages> {
  if (wiring.messages === undefined)
    throw new Error(
      `The wiring of ${wiring.member} has no \`messages\` loader, so the ${locale} catalogues cannot load; rerun \`stackra gen\`.`,
    );
  return wiring.messages(locale);
}
