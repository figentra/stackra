/**
 * Stackra file contract:
 * Purpose: `OutboundChatMessage`, one rendered message as a `ChatTransport` driver posts it: the provider's channel
 *          and the text.
 * Boundary: a type only. The channel is the provider's own id of a channel, conversation or chat (Slack `C0123`,
 *           Teams, Telegram), read from the connection that owns it; the text is already formatted in the channel's
 *           language. Rich layouts are a provider concern of its driver.
 * Runtime: isomorphic
 * Governing contract: ADR 0223 (decision 1: chat apps); ADR 0266 (the transport is a port); ADR 0308 (connections).
 */

/**
 * A chat message ready to post.
 *
 * @example
 * const message: OutboundChatMessage = { channel: "C0123ABCD", text };
 * const providerId = await chat.post(message, delivery.commandKey);
 */
export interface OutboundChatMessage {
  /** The provider's id of the channel or conversation to post in. */
  readonly channel: string;

  /** The text, already formatted. */
  readonly text: string;
}
