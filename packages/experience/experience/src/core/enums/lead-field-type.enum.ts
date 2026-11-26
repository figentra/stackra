/**
 * Stackra file contract:
 * Purpose: `LeadFieldType`, the kind of one lead form field: a line of text, an email, a phone number or a message.
 * Boundary: an `Enum.of` value plus the type of the same name; codes are snake_case and never shown as words.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); ADR 0231 (snake_case codes); STA-2041.
 */
import { Enum } from "@stackra/contracts";

/** The kind of a lead form field. */
export const LeadFieldType = Enum.of({
  /** One line of text (a name, a company). */
  Text: "text",
  /** An email address. */
  Email: "email",
  /** A phone number. */
  Phone: "phone",
  /** Several lines (the request itself). */
  Message: "textarea",
});

/** One of the codes above. */
export type LeadFieldType = Enum.Value<typeof LeadFieldType>;
