/**
 * Stackra file contract:
 * Purpose: `VoicePack`, the voice channel's reading of a Market's pack: the dialects it speaks (`speech.dialects`), the
 *          `SpeechVoice` a call or lane uses (the tenant's choice when the pack offers it, else the pack's first
 *          dialect), the call-recording consent rule (`messaging.call_recording_consent`), the notice and question a
 *          caller hears (`messaging.call_recording_notice` and `messaging.call_recording_ask`, text per language), and
 *          the resulting `recordingPlan`.
 * Boundary: a service over `ProviderPackSource` and the `Clock`, reading with `valueOf` on today's UTC date; it names
 *           no Market, dialect or wording. A pack without a consent rule gives `explicit`, the strictest rule, so a
 *           missing legal floor never records silently. Text is pack data per BCP 47 tag; the exact tag wins, then
 *           its base language (`ar` for `ar-SA`).
 * Runtime: isomorphic
 * Governing contract: PUT-216 (consent from the pack); RV-51 (recording consent per pack); OS-428 (dialects in the
 *                     pack); owner principle 2026-10-25 (legal floors are pack data); ADR 0370; ADR 0376 (decision 9).
 */
import { Enum } from "@stackra/contracts";
import type { Clock } from "@stackra/contracts";
import { Service } from "@stackra/container";
import { valueOf } from "@stackra/market-packs";
import type { ResolvedPack } from "@stackra/market-packs";

import { RecordingConsent } from "#contracts/enums/recording-consent.enum";
import type { SpeechVoice } from "#contracts/types/speech-voice.type";
import { recordingPlan } from "#core/functions/recording-plan.function";
import type { ProviderPackSource } from "#core/ports/provider-pack-source.port";

/** The pack keys this service reads. */
const KEYS = Object.freeze({
  dialects: "speech.dialects",
  consent: "messaging.call_recording_consent",
  notice: "messaging.call_recording_notice",
  ask: "messaging.call_recording_ask",
});

/**
 * Voice data of a Market's pack.
 *
 * @example
 * const speech = await voicePack.voice("sa", { language: "ar-SA", voice: tenantVoice });
 * const plan = await voicePack.plan("sa", tenantRecords);
 */
export class VoicePack extends Service {
  /** The packs. */
  private readonly packs: ProviderPackSource;

  /** Today's date. */
  private readonly clock: Clock;

  /**
   * @param packs - the host's pack source.
   * @param clock - the container's clock.
   */
  constructor(packs: ProviderPackSource, clock: Clock) {
    super();
    this.packs = packs;
    this.clock = clock;
  }

  /** The BCP 47 dialects `market` speaks, preferred first; empty when its pack lists none. */
  async dialects(market: string): Promise<readonly string[]> {
    const listed = await this.read(market, KEYS.dialects);
    return Array.isArray(listed)
      ? listed.filter((tag): tag is string => typeof tag === "string" && tag !== "")
      : [];
  }

  /**
   * How `market`'s calls speak: `preferred` when its language is one the pack lists, else the pack's first dialect
   * (without a voice, since a voice name belongs to its language); undefined when the pack lists none.
   */
  async voice(market: string, preferred?: SpeechVoice): Promise<SpeechVoice | undefined> {
    const dialects = await this.dialects(market);
    if (preferred !== undefined && dialects.includes(preferred.language)) return preferred;
    const first = dialects[0];
    return first === undefined ? undefined : { language: first };
  }

  /** `market`'s call-recording consent rule; `explicit` when the pack has none or an unknown one. */
  async consent(market: string): Promise<RecordingConsent> {
    const rule = await this.read(market, KEYS.consent);
    return typeof rule === "string" && (Enum.values(RecordingConsent) as string[]).includes(rule)
      ? (rule as RecordingConsent)
      : RecordingConsent.Explicit;
  }

  /** Whether a call in `market` records and what the caller hears first (see `recordingPlan`). */
  async plan(
    market: string,
    wanted: boolean,
    consented?: boolean,
  ): Promise<{ readonly record: boolean; readonly notice: boolean; readonly ask: boolean }> {
    return recordingPlan({
      rule: await this.consent(market),
      wanted,
      ...(consented === undefined ? {} : { consented }),
    });
  }

  /** The recording notice and consent question of `market` in `language`; a part the pack lacks is undefined. */
  async consentText(
    market: string,
    language: string,
  ): Promise<{ readonly notice?: string; readonly ask?: string }> {
    const resolved = await this.packs.resolve(market);
    const notice = textIn(this.value(resolved, KEYS.notice), language);
    const ask = textIn(this.value(resolved, KEYS.ask), language);
    return {
      ...(notice === undefined ? {} : { notice }),
      ...(ask === undefined ? {} : { ask }),
    };
  }

  /** The value of `key` in `market`'s pack today. */
  private async read(market: string, key: string): Promise<unknown> {
    return this.value(await this.packs.resolve(market), key);
  }

  /** The value of `key` in `resolved` today. */
  private value(resolved: ResolvedPack, key: string): unknown {
    return valueOf(resolved, key, this.clock.now().toISOString().slice(0, 10))?.value;
  }
}

/** The text of `language` in a per-language record: the exact tag, then its base language. */
function textIn(texts: unknown, language: string): string | undefined {
  if (typeof texts !== "object" || texts === null || Array.isArray(texts)) return undefined;
  for (const tag of [language, language.split("-")[0] ?? language]) {
    const text: unknown = Object.hasOwn(texts, tag) ? Reflect.get(texts, tag) : undefined;
    if (typeof text === "string" && text !== "") return text;
  }
  return undefined;
}
