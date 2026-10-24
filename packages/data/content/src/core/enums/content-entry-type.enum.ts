/**
 * Stackra file contract:
 * Purpose: `ContentEntryType`, the built-in content types every Stackra content service serves: a loader or a block asks
 *          for the entries of one type (`ContentEntryType.Faq`), never by a string type name.
 * Boundary: an `Enum.of` value plus the type of the same name; the code is the wire value of a list query's `type` and
 *           the stored type of an entry. A type a scope defines at runtime is data (ADR 0226), never a case here.
 *           Submissions, products, courses, orders and bookings are domain models, not content (ADR 0116 CT4).
 * Runtime: isomorphic
 * Governing contract: ADR 0116 (decision CT4); ADR 0226 (decision 1); ADR 0294 (decision 16); ADR 0231 (snake_case).
 */
import { Enum } from "@stackra/contracts";

/** The built-in content types, in the order of ADR 0116 CT4. */
export const ContentEntryType = Enum.of({
  /** A page of a site. */
  Page: "page",
  /** A post: a dated article. */
  Post: "post",
  /** The definition of a form; its submissions are a domain model. */
  FormDefinition: "form_definition",
  /** An ordered set of images. */
  Gallery: "gallery",
  /** An article of a help centre. */
  HelpArticle: "help_article",
  /** A question and its answer. */
  Faq: "faq",
  /** A notice shown to users for a while. */
  Announcement: "announcement",
  /** An entry of a product's changelog. */
  Changelog: "changelog",
  /** A legal document; its acceptance feeds consent. */
  LegalDocument: "legal_document",
  /** A customer's quote. */
  Testimonial: "testimonial",
  /** A member of the team page. */
  TeamMember: "team_member",
  /** An open position. */
  JobPosting: "job_posting",
  /** A block reused across documents. */
  ReusableBlock: "reusable_block",
  /** A menu served to `@stackra/navigation`. */
  NavigationMenu: "navigation_menu",
  /** A redirect from an old path. */
  Redirect: "redirect",
  /** A short link to a longer URL. */
  ShortLink: "short_link",
});

/** One of the codes above. */
export type ContentEntryType = Enum.Value<typeof ContentEntryType>;
