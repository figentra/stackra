/**
 * Stackra file contract:
 * Purpose: the `ChatTransport` port: posts one rendered message to a chat app's channel and returns the provider's id
 *          for it.
 * Boundary: an abstract class that is its own token. Provider drivers (Slack, Teams, Telegram) live with their
 *           Integration and connection (ADR 0308), selected by config; this package ships the port and a test double
 *           in `./testing` only. A driver deduplicates on the idempotency key, so a retried delivery job never posts
 *           twice.
 * Runtime: isomorphic
 * Governing contract: ADR 0223 (decision 1); ADR 0294 (decisions 15, 16 and 17); ADR 0305 (rule 8); ADR 0266.
 */
import { Port } from "@stackra/contracts";

import type { OutboundChatMessage } from "#contracts/types/outbound-chat-message.type";

/**
 * Posts chat messages.
 *
 * @example
 * export class SlackChatTransportDriver extends Driver(ChatTransport) {
 *   post(message: OutboundChatMessage, idempotencyKey: string): Promise<string> { ... }
 * }
 */
export abstract class ChatTransport extends Port {
  /**
   * Posts `message` once per `idempotencyKey`; a repeated key returns the first post's id and posts nothing.
   *
   * @returns the provider's id of the posted message.
   */
  abstract post(message: OutboundChatMessage, idempotencyKey: string): Promise<string>;
}
