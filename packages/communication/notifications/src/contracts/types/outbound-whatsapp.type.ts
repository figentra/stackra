/**
 * Stackra file contract:
 * Purpose: `OutboundWhatsApp`, one WhatsApp message as a `WhatsAppTransport` driver sends it: an approved template with
 *          its language and body parameters (any time), or free text (inside the 24-hour customer service window).
 * Boundary: a type only. The template name and its parameters come from the template library (studio data, OS-189),
 *           never code; the number is read at send time and never stored by the caller.
 * Runtime: isomorphic
 * Governing contract: ADR 0223 (decision 1: WhatsApp Cloud API); ADR 0355 (decision 4); OS-188, OS-189; ADR 0134.
 */

/**
 * A WhatsApp message ready to send.
 *
 * @example
 * const message: OutboundWhatsApp = { to, template: { name: "booking_reminder", language: "ar", parameters: [time] } };
 */
export type OutboundWhatsApp =
  | {
      /** The recipient's number, E.164. */
      readonly to: `+${string}`;
      /** An approved template. */
      readonly template: {
        readonly name: string;
        /** The template's language code as approved (`ar`, `en_US`). */
        readonly language: string;
        /** The body's `{{1}}`, `{{2}}`… values, in order. */
        readonly parameters: readonly string[];
      };
    }
  | {
      /** The recipient's number, E.164. */
      readonly to: `+${string}`;
      /** Free text, only inside the customer service window. */
      readonly text: string;
    };
