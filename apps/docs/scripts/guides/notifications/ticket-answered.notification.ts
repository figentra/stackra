/**
 * Stackra file contract:
 * Purpose: `TicketAnsweredNotification`, the example notification of the "Notifications" guide: when an agent answers
 *          a ticket, the customer who opened it hears about it by mail, in the `activity` category they may mute.
 * Boundary: who hears it (`recipients`), what every channel renders (`data`) and the mail's subject (`mail`); the body
 *           is the `.mail.tsx` component of the same stem, and the provider is the tenant's, never named here. Gen
 *           derives the key `support.ticket_answered`, the trigger `TicketAnswered` and the channels from the methods.
 * Runtime: node
 * Governing contract: ADR 0086; ADR 0223 as amended by ADR 0294 (a notification beside its model); STA-2852.
 */
import {
  type MailMessage,
  Notification,
  NotificationCategory,
  Recipient,
} from "@stackra/notifications";

import { I18n } from "./i18n";
import type { TicketAnsweredData } from "./ticket-answered-data.type";
import type { TicketAnswered } from "./ticket-answered.event";
import type { TicketService } from "./ticket.service";

/** Tells a customer their ticket was answered. */
export class TicketAnsweredNotification extends Notification({
  category: NotificationCategory.Activity, // the customer may mute it
}) {
  /** Reads the ticket the mail shows. */
  private readonly tickets: TicketService;

  /**
   * @param tickets - reads the ticket the mail shows.
   */
  constructor(tickets: TicketService) {
    super();
    this.tickets = tickets;
  }

  /** The customer who opened the ticket. */
  recipients(event: TicketAnswered): Recipient[] {
    return [Recipient.principal(event.customerId)];
  }

  /** Read once per event, after the recipients are known. */
  async data(event: TicketAnswered): Promise<TicketAnsweredData> {
    const ticket = await this.tickets.get(event.ticketId);
    return { ticketId: ticket.id, subject: ticket.subject };
  }

  /** The mail channel: its subject, in the recipient's language. */
  mail(data: TicketAnsweredData, mail: MailMessage): MailMessage {
    return mail.subject(I18n.support.ticket_answered.mail.subject, { subject: data.subject });
  }
}
