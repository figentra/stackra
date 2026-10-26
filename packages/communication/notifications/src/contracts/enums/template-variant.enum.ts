/**
 * Stackra file contract:
 * Purpose: `TemplateVariant`, the two forms of a notification template: the full one, and a content-free one that says
 *          only that something happened, for a record of a restricted data class (a privileged matter, a clinical or
 *          a child's record).
 * Boundary: an `Enum.of` value plus the type of the same name. Which records are restricted is the data class of the
 *           record (IAM), passed in by the caller; `resolveTemplate` never falls back from content-free to full.
 * Runtime: isomorphic
 * Governing contract: row "content-free templates for restricted records" of the package needs (2026-10-25); JUR-70;
 *                     CAP-restricted-data-class; ADR 0231.
 */
import { Enum } from "@stackra/contracts";

/** The variants a notification template is written in. */
export const TemplateVariant = Enum.of({
  /** The template with the record's content. */
  Full: "full",
  /** "You have an update; sign in to read it": no content of the record. */
  ContentFree: "content_free",
});

/** One of the codes above. */
export type TemplateVariant = Enum.Value<typeof TemplateVariant>;
