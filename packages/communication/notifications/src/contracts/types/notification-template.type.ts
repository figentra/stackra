/**
 * Stackra file contract:
 * Purpose: `NotificationTemplate`, one template a notification may render on one channel: its key, channel, locale and
 *          variant, the scope node that overrides it (none for the code default), and its content (ICU messages for
 *          SMS, push and WhatsApp; a document reference for mail).
 * Boundary: a type only; studio documents and lang files supply them through `TemplateOverrides`. Content is data that
 *           references registered code only (ADR 0154), never markup that runs.
 * Runtime: isomorphic
 * Governing contract: ADR 0223 (decision 3: code defaults, tenant overrides, console edits along the scope chain);
 *                     ADR 0294 note on ADR 0223.
 */
import type { NotificationChannel } from "#contracts/enums/notification-channel.enum";
import type { TemplateVariant } from "#contracts/enums/template-variant.enum";

/** A template candidate. */
export interface NotificationTemplate {
  /** The notification's key (`orders.order_receipt`). */
  readonly key: string;

  /** The channel it renders on. */
  readonly channel: NotificationChannel;

  /** Its BCP 47 locale. */
  readonly locale: string;

  /** Full or content-free. */
  readonly variant: TemplateVariant;

  /** The scope node that overrides it; undefined for the code default. */
  readonly scope?: string;

  /** The content: message keys or texts by part (`subject`, `body`, `title`), or a document reference. */
  readonly content: Readonly<Record<string, string>>;
}
