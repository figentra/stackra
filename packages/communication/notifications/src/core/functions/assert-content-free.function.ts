/**
 * Stackra file contract:
 * Purpose: `assertContentFree(template)`, the check that a content-free template reads only `CONTENT_FREE_FIELDS`
 *          (the record's kind and link). `resolveTemplate` runs it on every content-free template it returns; the
 *          notifications service runs it when a studio override is saved.
 * Boundary: pure. Reads ICU argument names (`{name}`, `{name, plural, ...}`) of each content part; a full variant
 *           passes untouched. A mail part that is a document reference has no arguments to read, so the document
 *           itself is checked where it is authored (studio), not here.
 * Runtime: isomorphic
 * Governing contract: row "content-free templates for restricted records" of the package needs; ADR 0231; STA-964.
 */
import { TemplateVariant } from "#contracts/enums/template-variant.enum";
import type { NotificationTemplate } from "#contracts/types/notification-template.type";
import { CONTENT_FREE_FIELDS } from "#core/constants/content-free-fields.constant";
import { RestrictedFieldError } from "#core/errors/restricted-field.error";

// shortcut: a regex, not an ICU parser; a plural branch written `{word}` reads as a field and is refused (the safe side).
const ARGUMENT = /\{\s*([A-Za-z_][\w.]*)\s*[,}]/g;

/**
 * Refuses a content-free template that reads a restricted field.
 *
 * @throws RestrictedFieldError naming the first field outside the record's kind and link.
 * @example
 * assertContentFree(template); // before saving an override of the content-free variant
 */
export function assertContentFree(template: NotificationTemplate): void {
  if (template.variant !== TemplateVariant.ContentFree) return;
  const allowed: readonly string[] = CONTENT_FREE_FIELDS;
  for (const [part, text] of Object.entries(template.content))
    for (const [, field] of text.matchAll(ARGUMENT))
      if (field !== undefined && !allowed.includes(field))
        throw RestrictedFieldError.create({
          key: template.key,
          channel: template.channel,
          part,
          field,
        });
}
