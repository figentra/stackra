/**
 * Stackra file contract:
 * Purpose: `renderEmailTemplate`, a studio email template rendered for one recipient by the node renderer: the HTML
 *          part and its plain-text part.
 * Boundary: email-safe blocks only: the document is checked as `ExperienceKind.EmailTemplate`, so a block that does
 *           not declare that kind is refused. It does not send: the host hands the result to the mail driver or the
 *           notifications service. Throws as `renderServerHtml` does.
 * Runtime: isomorphic (node on the server)
 * Governing contract: ADR 0270 (decisions 6, 7 and 12).
 */
import { ExperienceKind } from "#contracts/enums/experience-kind.enum";
import { htmlToText } from "#server/functions/html-to-text.function";
import { renderServerHtml } from "#server/functions/render-server-html.function";
import type { RenderedEmail } from "#server/types/rendered-email.type";
import type { ServerRenderOptions } from "#server/types/server-render-options.type";

/**
 * The email body of `document`.
 *
 * @example
 * const { html, text } = renderEmailTemplate(template.root, { locale, direction, blocks: MAIL_BLOCKS, data: { order }, title: subject });
 * await mailer.send({ to, subject, html, text });
 */
export function renderEmailTemplate(
  document: unknown,
  options: ServerRenderOptions,
): RenderedEmail {
  const html = renderServerHtml(document, ExperienceKind.EmailTemplate, options);
  return { html, text: htmlToText(html) };
}
