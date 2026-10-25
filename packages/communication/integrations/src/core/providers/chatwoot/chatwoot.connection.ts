/**
 * Stackra file contract:
 * Purpose: `ChatwootConnection`, one tenant's Chatwoot account and the inbox operations OS messaging needs: API inboxes
 *          (one per channel the tenant routes in), contacts, conversations, messages, assignment and status.
 * Boundary: every call goes through `this.api` with the account user's token (`{accessToken}` filled from this
 *           connection) at the region's host. Personal data (a contact's name, email and phone) is passed through to
 *           Chatwoot and never kept here. Ids travel as strings.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 2, 4 and 13); OS-204, OS-206; ADR 0134 (personal data).
 */
import { Secret } from "@stackra/config";

import { Connection } from "#core/bases/connection.base";
import type { ChatwootIntegration } from "#core/providers/chatwoot/chatwoot.integration";
import { ConnectedAccount } from "#core/values/connected-account.value";

/** A Chatwoot conversation state. */
type ConversationStatus = "open" | "resolved" | "pending" | "snoozed";

/**
 * A tenant's Chatwoot account.
 *
 * @example
 * const inbox = await chatwoot.createInbox("WhatsApp", webhookUrl);
 * const { contactId, sourceId } = await chatwoot.createContact(inbox.id, { identifier: partyId, name });
 * const conversationId = await chatwoot.openConversation(inbox.id, contactId, sourceId);
 */
export class ChatwootConnection extends Connection<ChatwootIntegration> {
  /** The Chatwoot account id. */
  accountId!: string;

  /** The account administrator user's token. */
  @Secret("CHATWOOT_ACCOUNT_TOKEN")
  accessToken!: string;

  /** The account's path prefix. */
  private get base(): string {
    return `/api/v1/accounts/${this.accountId}`;
  }

  async check(): Promise<ConnectedAccount> {
    await this.api.get(`${this.base}/inboxes`);
    return ConnectedAccount.create({ id: this.accountId });
  }

  /** Creates an API-channel inbox whose outgoing messages Chatwoot posts to `webhookUrl`. */
  async createInbox(
    name: string,
    webhookUrl: string,
  ): Promise<{ readonly id: string; readonly identifier: string }> {
    const inbox = await this.api.post<{ readonly id: number; readonly inbox_identifier: string }>(
      `${this.base}/inboxes`,
      { name, channel: { type: "api", webhook_url: webhookUrl } },
    );
    return { id: String(inbox.id), identifier: inbox.inbox_identifier };
  }

  /** Creates a contact in `inboxId`, keyed by our party id as its identifier. */
  async createContact(
    inboxId: string,
    contact: {
      readonly identifier: string;
      readonly name: string;
      readonly email?: string;
      readonly phone?: `+${string}`;
    },
  ): Promise<{ readonly contactId: string; readonly sourceId: string }> {
    const created = await this.api.post<{
      readonly payload: {
        readonly contact: { readonly id: number };
        readonly contact_inbox: { readonly source_id: string };
      };
    }>(`${this.base}/contacts`, {
      inbox_id: Number(inboxId),
      identifier: contact.identifier,
      name: contact.name,
      ...(contact.email === undefined ? {} : { email: contact.email }),
      ...(contact.phone === undefined ? {} : { phone_number: contact.phone }),
    });
    return {
      contactId: String(created.payload.contact.id),
      sourceId: created.payload.contact_inbox.source_id,
    };
  }

  /** Opens a conversation with `contactId` in `inboxId`. */
  async openConversation(inboxId: string, contactId: string, sourceId: string): Promise<string> {
    const conversation = await this.api.post<{ readonly id: number }>(
      `${this.base}/conversations`,
      {
        inbox_id: Number(inboxId),
        contact_id: Number(contactId),
        source_id: sourceId,
      },
    );
    return String(conversation.id);
  }

  /**
   * Adds a message: `incoming` from the contact (a message that arrived on our channel), `outgoing` from the tenant,
   * or a private note.
   */
  async postMessage(
    conversationId: string,
    message: { readonly content: string; readonly direction: "incoming" | "outgoing" | "note" },
  ): Promise<string> {
    const posted = await this.api.post<{ readonly id: number }>(
      `${this.base}/conversations/${conversationId}/messages`,
      {
        content: message.content,
        message_type: message.direction === "incoming" ? "incoming" : "outgoing",
        private: message.direction === "note",
      },
    );
    return String(posted.id);
  }

  /** Assigns the conversation to an agent (`assigneeId`), the handover to a human. */
  async assign(conversationId: string, assigneeId: string): Promise<void> {
    await this.api.post(`${this.base}/conversations/${conversationId}/assignments`, {
      assignee_id: Number(assigneeId),
    });
  }

  /** Sets the conversation's status. */
  async setStatus(conversationId: string, status: ConversationStatus): Promise<void> {
    await this.api.post(`${this.base}/conversations/${conversationId}/toggle_status`, { status });
  }
}
