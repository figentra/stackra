/**
 * Stackra file contract:
 * Purpose: `parseDocumentTemplate`, checks a print template from the studio, a seed pack or code and fills its
 *          defaults.
 * Boundary: the trust boundary of template data. The first schema issue becomes `InvalidDocumentTemplateError` with
 *           its path; the template's text never enters the error.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 1); ADR 0270 (decision 1).
 */
import { DOCUMENT_TEMPLATE_SCHEMA } from "#core/constants/document-template-schema.constant";
import { InvalidDocumentTemplateError } from "#core/errors/invalid-document-template.error";
import type { ParsedDocumentTemplate } from "#core/types/parsed-document-template.type";

/**
 * The checked template.
 *
 * @throws InvalidDocumentTemplateError when `template` breaks the schema.
 *
 * @example
 * const template = parseDocumentTemplate(await studio.published("commerce:print:receipt"));
 */
export function parseDocumentTemplate(template: unknown): ParsedDocumentTemplate {
  const parsed = DOCUMENT_TEMPLATE_SCHEMA.safeParse(template);
  if (parsed.success) return parsed.data;
  const issue = parsed.error.issues[0];
  throw InvalidDocumentTemplateError.create({
    path: issue?.path.join(".") ?? "",
    problem: issue?.message ?? "invalid template",
  });
}
