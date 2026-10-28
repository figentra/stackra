/**
 * Stackra file contract:
 * Purpose: `ExperienceKind`, the kinds of L2 document a block may be placed in: a page, a mobile screen, a form, an
 *          email template, a print document, a theme section and a dashboard (a panel `Document`'s two kinds are its
 *          `page` and `dashboard`, so there is one document-kind vocabulary).
 * Boundary: an enum (`Enum.of`) in the leaf entry, so the builder, the server-side validator and a renderer read it
 *           without a runtime. A block declares the kinds it fits (`Block({ kinds })`); `validateDocument` and the
 *           builder refuse a block outside the document's kind (email-safe blocks only in an email template).
 * Runtime: isomorphic
 * Governing contract: ADR 0270 (decisions 6, 7 and 13: document kinds, email-safe blocks, multi-step forms); ADR 0110
 *                     (L2 documents); ADR 0294 (decision 16: Enum);
 *                     STA-1383 (Dashboard added: one document-kind vocabulary).
 */
import { Enum } from "@stackra/contracts";

/**
 * A document kind.
 *
 * @example
 * export class OrderLinesBlock extends Block({ category, icon, kinds: [ExperienceKind.PrintDocument] }) {}
 */
export const ExperienceKind = Enum.of({
  /** A web page on the canvas. */
  Page: "page",
  /** A mobile screen on the canvas. */
  Screen: "screen",
  /** A form: a field list with its logic and steps. */
  Form: "form",
  /** An email or notification template: email-safe blocks only, rendered by the node renderer. */
  EmailTemplate: "email_template",
  /** A print document: a receipt, an invoice layout, a packing slip or a label. */
  PrintDocument: "print_document",
  /** One section of a theme: a header, a footer, a product card. */
  ThemeSection: "theme_section",
  /** Widget tiles on the 12-column grid, under one range picker (a panel `Document`). */
  Dashboard: "dashboard",
});

/** One of the codes above. */
export type ExperienceKind = Enum.Value<typeof ExperienceKind>;
