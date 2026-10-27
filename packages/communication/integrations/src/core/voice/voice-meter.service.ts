/**
 * Stackra file contract:
 * Purpose: `VoiceMeter`, which writes the voice channel's usage: one `usage.recorded` event on `voice.minutes` per
 *          finished, connected call and one on `speech.seconds` per speech stream, through the outbox.
 * Boundary: a service over the `EventOutbox` and the `Clock`. It writes the existing `usage.recorded` event of
 *           `@stackra/actions` (`sum` meters, exact units), so the usage service aggregates voice like any other
 *           meter; prices and rounding are rate-card data. A call that never connected, or a stream with no audio,
 *           writes nothing. The outbox write joins the caller's unit of work when there is one.
 * Runtime: isomorphic
 * Governing contract: ADR 0376 (decision 7); R3-SO-11; RV-51; ADR 0216 (decisions 1, 2 and 4).
 */
import { UsageRecorded } from "@stackra/actions";
import { type Clock, MeterKind } from "@stackra/contracts";
import { Service } from "@stackra/container";
import type { EventOutbox } from "@stackra/events/contracts";

import type { ProviderCall } from "#contracts/types/provider-call.type";
import { VOICE_METERS } from "#core/voice/voice-meters.constant";
import type { VoiceUsage } from "#core/voice/voice-usage.type";

/** Crockford base32: no I, L, O or U (the outbox refuses an event id without `evt_`). */
const ALPHABET = "0123456789abcdefghjkmnpqrstvwxyz";

/**
 * Meters calls and speech.
 *
 * @example
 * await meter.call(await voice.lookup(ref), { reference: ref, scopeId });
 */
export class VoiceMeter extends Service {
  /** Where usage events go. */
  private readonly outbox: EventOutbox;

  /** When they happened. */
  private readonly clock: Clock;

  /**
   * @param outbox - the host's event outbox.
   * @param clock - the container's clock.
   */
  constructor(outbox: EventOutbox, clock: Clock) {
    super();
    this.outbox = outbox;
    this.clock = clock;
  }

  /** Meters `call`'s connected minutes; nothing while it has no duration or lasted none. */
  async call(call: ProviderCall, usage: VoiceUsage): Promise<void> {
    const seconds = call.durationSeconds ?? 0;
    if (seconds > 0) await this.write(VOICE_METERS.voice, seconds / 60, usage);
  }

  /** Meters `seconds` of speech audio; nothing for none. */
  async speech(seconds: number, usage: VoiceUsage): Promise<void> {
    if (seconds > 0) await this.write(VOICE_METERS.speech, seconds, usage);
  }

  /** Writes one `usage.recorded` event. */
  private async write(
    meter: { readonly name: string; readonly key: string },
    value: number,
    usage: VoiceUsage,
  ): Promise<void> {
    const event = UsageRecorded.create({
      meter: meter.name,
      kind: MeterKind.Sum,
      value,
      key: meter.key,
      callId: usage.reference,
      ...(usage.scopeId === undefined ? {} : { scopeId: usage.scopeId }),
    });
    const bytes = globalThis.crypto.getRandomValues(new Uint8Array(26));
    await this.outbox.write([
      {
        event,
        meta: {
          // 256 is a multiple of 32, so `% 32` keeps every character equally likely.
          id: `evt_${Array.from(bytes, (byte) => ALPHABET[byte % 32]).join("")}`,
          occurredAt: this.clock.now(),
          ...(usage.scopeId === undefined ? {} : { scopeId: usage.scopeId }),
          ...(usage.actor === undefined ? {} : { actor: usage.actor }),
          correlationId: usage.reference,
        },
      },
    ]);
  }
}
