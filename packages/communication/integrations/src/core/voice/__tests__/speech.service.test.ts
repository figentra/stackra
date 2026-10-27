/**
 * Stackra file contract:
 * Purpose: unit tests of `SpeechService`: the provider comes from the tenant's data region (the platform Connection of
 *          the region map's first provider, the tenant's own one first), `zeroRetention` skips a provider that keeps
 *          audio, no provider refuses; `listen` and `speak` stream through and meter the stream's seconds once, also
 *          when the consumer stops early; `listenOn` and `sayOn` run over an `AudioDevice`.
 * Boundary: test only; the store, the region map and the meter are in-test stand-ins, the Connections are
 *           constructed as `hydrateConnection` does, so their field initialisers (`retainsAudio`) run.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0376 (decisions 2 and 7); R3-SO-11.
 */
import { describe, expect, it } from "@stackra/testing";

import { AudioEncoding } from "#contracts/voice/audio-encoding.enum";
import { RegionMapSource } from "#contracts/voice/region-map-source.port";
import type { Speech } from "#contracts/voice/speech.type";
import type { SpeechRequest } from "#contracts/voice/speech-request.type";
import type { Transcript } from "#contracts/voice/transcript.type";
import { Connection } from "#core/bases/connection.base";
import { NoProviderError } from "#core/errors/no-provider.error";
import type { ConnectionStore } from "#core/ports/connection-store.port";
import type { ConnectionClass } from "#core/types/connection-class.type";
import { ConnectedAccount } from "#core/values/connected-account.value";
import { MemoryAudioDeviceDriver } from "#core/voice/memory-audio-device.driver";
import { SpeechService } from "#core/voice/speech.service";
import type { VoiceMeter } from "#core/voice/voice-meter.service";
import type { VoiceUsage } from "#core/voice/voice-usage.type";

/** A speech Connection that echoes byte counts and synthesises one 2-byte chunk per character. */
abstract class EchoSpeech extends Connection implements Speech {
  abstract readonly label: string;

  abstract readonly retainsAudio: boolean;

  async check(): Promise<ConnectedAccount> {
    return ConnectedAccount.create({ id: this.label });
  }

  async disconnect(): Promise<void> {}

  async *listen(
    audio: AsyncIterable<Uint8Array>,
    request: SpeechRequest,
  ): AsyncGenerator<Transcript> {
    for await (const chunk of audio)
      yield {
        text: `${this.label}:${chunk.byteLength}`,
        final: false,
        language: request.speech.language,
      };
    yield { text: this.label, final: true, language: request.speech.language };
  }

  async *speak(text: string): AsyncGenerator<Uint8Array> {
    for (const _ of text) yield new Uint8Array(2);
  }
}
class AlphaSpeech extends EchoSpeech {
  label = "alpha";

  retainsAudio = true;
}
class BetaSpeech extends EchoSpeech {
  label = "beta";

  retainsAudio = false;
}

const make = <C extends EchoSpeech>(Type: new () => C, label: string): C =>
  Object.assign(new Type(), { label });

const DRIVERS = { alpha: AlphaSpeech, beta: BetaSpeech } as const;

/** One region `xx-1` listing alpha then beta, each with a platform Connection. */
class Regions extends RegionMapSource {
  private readonly code: string | undefined;

  /**
   * @param code - the region; `null` for none (an `undefined` argument would take the default).
   */
  constructor(code: string | null = "xx-1") {
    super();
    this.code = code ?? undefined;
  }

  region(): string | undefined {
    return this.code;
  }

  async providers(capability: string, region: string): Promise<unknown> {
    return capability === "speech" && region === "xx-1" ? ["alpha", "beta"] : undefined;
  }

  async platformConnection(
    _capability: string,
    _region: string,
    provider: string,
  ): Promise<string | undefined> {
    return `conn_${provider}`;
  }
}

function storeWith(own: [ConnectionClass, Connection][] = []): ConnectionStore {
  const platform = new Map<string, Connection>([
    ["conn_alpha", make(AlphaSpeech, "alpha-platform")],
    ["conn_beta", make(BetaSpeech, "beta-platform")],
  ]);
  const mine = new Map(own);
  return {
    async find(type: ConnectionClass) {
      return mine.get(type) ?? null;
    },
    async byId(_type: ConnectionClass, id: string) {
      const found = platform.get(id);
      if (found === undefined) throw new Error(`no ${id}`);
      return found;
    },
  } as unknown as ConnectionStore;
}

function recordingMeter(): { meter: VoiceMeter; metered: [number, VoiceUsage][] } {
  const metered: [number, VoiceUsage][] = [];
  const meter = {
    async speech(seconds: number, usage: VoiceUsage) {
      metered.push([seconds, usage]);
    },
  } as unknown as VoiceMeter;
  return { meter, metered };
}

const request: SpeechRequest = {
  speech: { language: "ar-SA" },
  format: { encoding: AudioEncoding.Linear16, sampleRate: 4, channels: 1 },
};
const usage: VoiceUsage = { reference: "lane_1", scopeId: "org_1" };

async function* chunks(...sizes: number[]): AsyncGenerator<Uint8Array> {
  for (const size of sizes) yield new Uint8Array(size);
}

describe("SpeechService", () => {
  it("serves from the region's platform Connection, the tenant's own first", async () => {
    const { meter } = recordingMeter();
    const platform = new SpeechService(storeWith(), new Regions(), meter);
    expect(await platform.connection({ drivers: DRIVERS, usage })).toMatchObject({
      label: "alpha-platform",
    });
    const own = new SpeechService(
      storeWith([[BetaSpeech, make(BetaSpeech, "beta-own")]]),
      new Regions(),
      meter,
    );
    expect(await own.connection({ drivers: DRIVERS, usage })).toMatchObject({ label: "beta-own" });
  });

  it("skips a provider that keeps audio when zero retention is asked, and refuses when none fits", async () => {
    const { meter } = recordingMeter();
    const service = new SpeechService(storeWith(), new Regions(), meter);
    expect(
      await service.connection({ drivers: DRIVERS, usage, zeroRetention: true }),
    ).toMatchObject({
      label: "beta-platform",
    });
    await expect(
      service.connection({ drivers: { alpha: AlphaSpeech }, usage, zeroRetention: true }),
    ).rejects.toBeInstanceOf(NoProviderError);
    await expect(
      new SpeechService(storeWith(), new Regions(null), meter).connection({
        drivers: DRIVERS,
        usage,
      }),
    ).rejects.toBeInstanceOf(NoProviderError);
  });

  it("streams recognition and meters the seconds sent", async () => {
    const { meter, metered } = recordingMeter();
    const service = new SpeechService(storeWith(), new Regions(), meter);
    const heard: string[] = [];
    for await (const t of service.listen(chunks(8, 4), request, { drivers: DRIVERS, usage }))
      heard.push(t.text);
    expect(heard).toEqual(["alpha-platform:8", "alpha-platform:4", "alpha-platform"]);
    // 12 bytes of 16-bit mono at 4 samples a second.
    expect(metered).toEqual([[1.5, usage]]);
  });

  it("meters once when the consumer stops early", async () => {
    const { meter, metered } = recordingMeter();
    const service = new SpeechService(storeWith(), new Regions(), meter);
    for await (const _ of service.listen(chunks(8, 8, 8), request, { drivers: DRIVERS, usage }))
      break;
    expect(metered).toEqual([[1, usage]]);
  });

  it("synthesises on a device's speaker and meters the seconds produced", async () => {
    const { meter, metered } = recordingMeter();
    const service = new SpeechService(storeWith(), new Regions(), meter);
    const device = MemoryAudioDeviceDriver.with([new Uint8Array(16)]);
    await service.sayOn(device, "abcd", request, { drivers: DRIVERS, usage });
    expect(device.played).toHaveLength(4);
    const heard: Transcript[] = [];
    for await (const t of service.listenOn(device, request, { drivers: DRIVERS, usage }))
      heard.push(t);
    expect(heard.at(-1)).toEqual({ text: "alpha-platform", final: true, language: "ar-SA" });
    expect(metered).toEqual([
      [1, usage],
      [2, usage],
    ]);
  });
});
