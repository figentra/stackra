/**
 * Stackra file contract:
 * Purpose: unit tests of `VoicePack`: dialects from `speech.dialects`; the tenant's voice when the pack offers its
 *          language, else the pack's first dialect; the consent rule, `explicit` when missing or unknown; the plan;
 *          the consent texts by exact tag, then base language.
 * Boundary: test only; the pack source is an in-test stand-in over hand-made resolved packs of the made-up Markets
 *           `xa` and `xb`, read through the real `valueOf`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; PUT-216; RV-51; ADR 0370.
 */
import { Clock } from "@stackra/contracts";
import type { ResolvedPack } from "@stackra/market-packs";
import { describe, expect, it } from "@stackra/testing";

import { RecordingConsent } from "#contracts/enums/recording-consent.enum";
import { ProviderPackSource } from "#core/ports/provider-pack-source.port";
import { VoicePack } from "#core/voice/voice-pack.service";

class FixedClock extends Clock {
  now(): Date {
    return new Date("2026-10-27T12:00:00Z");
  }
}

const pack = (market: string, entries: readonly { key: string; value: unknown }[]): ResolvedPack =>
  ({
    market,
    layers: [
      { market, version: "1.0.0", entries: entries.map((e) => ({ ...e, from: "2026-01-01" })) },
    ],
  }) as unknown as ResolvedPack;

const PACKS: Record<string, ResolvedPack> = {
  xa: pack("xa", [
    { key: "speech.dialects", value: ["ar-SA", "en-US", 3, ""] },
    { key: "messaging.call_recording_consent", value: "notice" },
    { key: "messaging.call_recording_notice", value: { ar: "N-ar", "en-US": "N-en" } },
    { key: "messaging.call_recording_ask", value: { "ar-SA": "Q-sa" } },
  ]),
  xb: pack("xb", [{ key: "messaging.call_recording_consent", value: "maybe" }]),
};

class Packs extends ProviderPackSource {
  async resolve(market: string): Promise<ResolvedPack> {
    return PACKS[market] ?? pack(market, []);
  }

  async platformConnection(): Promise<string | undefined> {
    return undefined;
  }
}

describe("VoicePack", () => {
  const voice = new VoicePack(new Packs(), new FixedClock());

  it("reads the dialects and picks the voice", async () => {
    expect(await voice.dialects("xa")).toEqual(["ar-SA", "en-US"]);
    expect(await voice.voice("xa", { language: "en-US", voice: "v1" })).toEqual({
      language: "en-US",
      voice: "v1",
    });
    expect(await voice.voice("xa", { language: "fr-FR", voice: "v2" })).toEqual({
      language: "ar-SA",
    });
    expect(await voice.voice("xa")).toEqual({ language: "ar-SA" });
    expect(await voice.voice("xc")).toBeUndefined();
  });

  it("reads the consent rule, strictest when missing or unknown", async () => {
    expect(await voice.consent("xa")).toBe(RecordingConsent.Notice);
    expect(await voice.consent("xb")).toBe(RecordingConsent.Explicit);
    expect(await voice.consent("xc")).toBe(RecordingConsent.Explicit);
    expect(await voice.plan("xa", true)).toEqual({ record: true, notice: true, ask: false });
    expect(await voice.plan("xc", true)).toEqual({ record: false, notice: false, ask: true });
    expect((await voice.plan("xc", true, true)).record).toBe(true);
  });

  it("reads the consent text by exact tag, then base language", async () => {
    expect(await voice.consentText("xa", "ar-SA")).toEqual({ notice: "N-ar", ask: "Q-sa" });
    expect(await voice.consentText("xa", "en-US")).toEqual({ notice: "N-en" });
    expect(await voice.consentText("xb", "ar-SA")).toEqual({});
  });
});
