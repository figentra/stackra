/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/integrations, the leaf entry with the
 *          `ConnectionContext`, `ProviderDefaults` and `MarketContext` ports, and the interfaces a provider's
 *          Connection implements (accounting, the commerce connectors, telephony), until `stackra gen` writes the entry
 *          barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The leaf: it imports no other entry of this package (only
 *           `@stackra/contracts`, and the `Money` and `Address` types of `@stackra/money` and `@stackra/validation`).
 *           Each is exported here only, never from `.` (ADR 0294 decision 15). `ConnectionStore` and `ConnectionHost` stay
 *           in `.`, because their signatures use the `Connection` base, `ConnectionRecord` and `OAuthTokens` of `.`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { CallStatus } from "#contracts/enums/call-status.enum";
export { RecordingConsent } from "#contracts/enums/recording-consent.enum";
export { ConnectionContext } from "#contracts/ports/connection-context.port";
export { MarketContext } from "#contracts/ports/market-context.port";
export { ProviderDefaults } from "#contracts/ports/provider-defaults.port";
export type { AccountingProvider } from "#contracts/types/accounting-provider.type";
export type { CallEvent } from "#contracts/types/call-event.type";
export type { CallInstruction } from "#contracts/types/call-instruction.type";
export type { ChannelOrder } from "#contracts/types/channel-order.type";
export type { ChannelOrderLine } from "#contracts/types/channel-order-line.type";
export type { ChannelOrderPage } from "#contracts/types/channel-order-page.type";
export type { CredentialRef } from "#contracts/types/credential-ref.type";
export type { FeedItem } from "#contracts/types/feed-item.type";
export type { Fulfilment } from "#contracts/types/fulfilment.type";
export type { FulfilmentProviderConnector } from "#contracts/types/fulfilment-provider-connector.type";
export type { FulfilmentRequest } from "#contracts/types/fulfilment-request.type";
export type { JournalEntry } from "#contracts/types/journal-entry.type";
export type { JournalLine } from "#contracts/types/journal-line.type";
export type { OutboundCall } from "#contracts/types/outbound-call.type";
export type { PostedJournal } from "#contracts/types/posted-journal.type";
export type { ProductFeedConnector } from "#contracts/types/product-feed-connector.type";
export type { ProviderCall } from "#contracts/types/provider-call.type";
export type { ProviderChoice } from "#contracts/types/provider-choice.type";
export type { SalesChannelConnector } from "#contracts/types/sales-channel-connector.type";
export type { SpeechVoice } from "#contracts/types/speech-voice.type";
export type { VoiceGateway } from "#contracts/types/voice-gateway.type";
