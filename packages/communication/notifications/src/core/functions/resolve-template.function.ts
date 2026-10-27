/**
 * Stackra file contract:
 * Purpose: `resolveTemplate(candidates, query)`, the template cascade: for each locale of the recipient's chain,
 *          nearest first, the nearest scope's override wins, then the code default; a restricted record takes only the
 *          content-free variant, and a content-free template that reads a restricted field is refused.
 * Boundary: pure. Locale before scope: a recipient never gets a tenant's English override while an Arabic template
 *           exists. A restricted record never falls back to the full variant: no fit is `NoTemplateError`.
 * Runtime: isomorphic
 * Governing contract: ADR 0223 (decision 3: code defaults, tenant overrides, console edits along the scope chain);
 *                     row "template override resolver" and "content-free templates" of the package needs; STA-964.
 */
import type { NotificationChannel } from "#contracts/enums/notification-channel.enum";
import { TemplateVariant } from "#contracts/enums/template-variant.enum";
import type { NotificationTemplate } from "#contracts/types/notification-template.type";
import { NoTemplateError } from "#core/errors/no-template.error";
import { assertContentFree } from "#core/functions/assert-content-free.function";

/**
 * The template that renders.
 *
 * @param query.locales - the recipient's locale chain, nearest first (`ar-SA`, `ar`, `en`).
 * @param query.scopes - the recipient's scope chain, nearest first (branch, tenant, product).
 * @param query.restricted - whether the record's data class is restricted.
 * @throws NoTemplateError when nothing fits.
 * @throws RestrictedFieldError when the content-free template that fits reads more than the kind and link.
 * @example
 * resolveTemplate(await overrides.candidates(key, channel), { key, channel, locales, scopes, restricted: false });
 */
export function resolveTemplate(
  candidates: readonly NotificationTemplate[],
  query: {
    readonly key: string;
    readonly channel: NotificationChannel;
    readonly locales: readonly string[];
    readonly scopes: readonly string[];
    readonly restricted: boolean;
  },
): NotificationTemplate {
  const variant = query.restricted ? TemplateVariant.ContentFree : TemplateVariant.Full;
  const fitting = candidates.filter(
    (template) =>
      template.key === query.key &&
      template.channel === query.channel &&
      template.variant === variant,
  );
  for (const locale of query.locales)
    for (const scope of [...query.scopes, undefined]) {
      const found = fitting.find(
        (template) => template.locale === locale && template.scope === scope,
      );
      if (found !== undefined) {
        assertContentFree(found);
        return found;
      }
    }
  throw NoTemplateError.create({ key: query.key, channel: query.channel, variant });
}
