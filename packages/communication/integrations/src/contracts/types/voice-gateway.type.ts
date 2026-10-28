/**
 * Stackra file contract:
 * Purpose: `VoiceGateway`, the telephony provider port per Market: what a voice provider's Connection implements to
 *          place a call, steer a live one (redirect to new instructions, hand over to a human), record it, hang it up,
 *          read it, answer its webhook with instructions, and parse its webhooks.
 * Boundary: an interface a Connection implements, not a container port: the tenant's Connection, or the Market's
 *           platform default, chooses the provider per call (ADR 0356), resolved with `ProviderResolver` under the
 *           `voice` capability. Speech in and out (Arabic dialects) is the provider's, driven by `listen` and `say`
 *           steps with data-chosen language and voice.
 * Runtime: isomorphic
 * Governing contract: ADR 0356 (decision 2); ADR 0223 (decision 1); PUT-216; ADR 0355 (decision 1: channel role).
 */
import type { CallEvent } from "#contracts/types/call-event.type";
import type { CallInstruction } from "#contracts/types/call-instruction.type";
import type { OutboundCall } from "#contracts/types/outbound-call.type";
import type { ProviderCall } from "#contracts/types/provider-call.type";

/**
 * A telephony account.
 *
 * @example
 * const voice = await resolver.resolve<VoiceGateway>("voice", VOICE_CONNECTIONS);
 * const placed = await voice.call(request);
 */
export interface VoiceGateway {
  /** Places the outbound `call`. */
  call: (call: OutboundCall) => Promise<ProviderCall>;

  /** The call `providerRef` as it is now. */
  lookup: (providerRef: string) => Promise<ProviderCall>;

  /** Replaces what the live call `providerRef` does with `instructions` (a handover is a `handover` step). */
  redirect: (providerRef: string, instructions: readonly CallInstruction[]) => Promise<void>;

  /** Starts recording the live call `providerRef`. */
  record: (providerRef: string) => Promise<void>;

  /** Ends the call `providerRef`. */
  hangUp: (providerRef: string) => Promise<ProviderCall>;

  /** The provider's answer document for `instructions`, returned from our instructions webhook. */
  answer: (instructions: readonly CallInstruction[]) => {
    readonly contentType: string;
    readonly body: string;
  };

  /** The provider's webhook parameters as a `CallEvent`, after `@stackra/webhooks` verified them. */
  event: (params: Readonly<Record<string, string>>) => CallEvent;
}
