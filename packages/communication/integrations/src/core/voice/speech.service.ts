/**
 * Stackra file contract:
 * Purpose: `SpeechService`, the one way to run speech: it picks the speech Connection for the tenant's data region
 *          (the tenant's own Connection of a provider the region map lists, else the region's platform Connection),
 *          streams recognition (`listen`) or synthesis (`speak`) through it, and meters the stream's audio seconds on
 *          `speech.seconds`; `listenOn` and `sayOn` run the same over a local `AudioDevice` (drive-through lane, till,
 *          kiosk).
 * Boundary: a service over the `ConnectionStore`, `RegionMapSource` and `VoiceMeter`. It builds its own
 *           `ProviderResolver` over `RegionMapProviderDefaultsDriver` and `NoMarketContextDriver`, so the provider
 *           comes from `region-map:<region>.providers.speech`, never the market pack, and no region or provider is
 *           named here.
 *           Language and voice are the request's (from `VoicePack#voice`). Seconds are counted from the raw bytes
 *           (`audioSeconds`) and metered once, when the stream ends, is stopped or fails. Audio and text are passed
 *           through and never stored or logged.
 * Runtime: isomorphic
 * Governing contract: ADR 0376 (decisions 1, 2 and 7); R3-SO-11; R3-SO-10 (kiosk audio); RES-240; PUT-216.
 */
import { Service } from "@stackra/container";

import type { AudioDevice } from "#contracts/voice/audio-device.port";
import type { RegionMapSource } from "#contracts/voice/region-map-source.port";
import type { Speech } from "#contracts/voice/speech.type";
import type { SpeechRequest } from "#contracts/voice/speech-request.type";
import type { Transcript } from "#contracts/voice/transcript.type";
import type { Connection } from "#core/bases/connection.base";
import type { ConnectionStore } from "#core/ports/connection-store.port";
import { ProviderResolver } from "#core/services/provider-resolver.service";
import { audioSeconds } from "#core/voice/audio-seconds.function";
import { NoMarketContextDriver } from "#core/voice/no-market-context.driver";
import { RegionMapProviderDefaultsDriver } from "#core/voice/region-map-provider-defaults.driver";
import type { SpeechSession } from "#core/voice/speech-session.type";
import type { VoiceMeter } from "#core/voice/voice-meter.service";

/** The capability key of the region map's speech providers. */
const SPEECH = "speech";

/**
 * Streams speech through the region's provider.
 *
 * @example
 * const request = { speech: await voicePack.voice("sa", tenantVoice), format: LANE_FORMAT };
 * for await (const heard of speech.listenOn(laneDevice, request, session)) if (heard.final) take(heard.text);
 */
export class SpeechService extends Service {
  /** The resolver over the region map. */
  private readonly resolver: ProviderResolver;

  /** The running call's data region. */
  private readonly regions: RegionMapSource;

  /** Where seconds are metered. */
  private readonly meter: VoiceMeter;

  /**
   * @param store - the connection store bound in the host.
   * @param regions - the host's region-map source.
   * @param meter - the voice meter.
   */
  constructor(store: ConnectionStore, regions: RegionMapSource, meter: VoiceMeter) {
    super();
    this.resolver = new ProviderResolver(
      store,
      new RegionMapProviderDefaultsDriver(regions),
      new NoMarketContextDriver(),
    );
    this.regions = regions;
    this.meter = meter;
  }

  /**
   * The speech Connection for the tenant's data region.
   *
   * @throws NoProviderError when the region lists no provider the caller drives, or none keeps nothing when
   *         `zeroRetention` asks for that.
   */
  async connection(session: SpeechSession): Promise<Connection & Speech> {
    return this.resolver.resolve<Speech>(
      SPEECH,
      session.drivers,
      (speech) => session.zeroRetention !== true || !speech.retainsAudio,
      // With no region, only the tenant's own Connections are tried (the resolver's no-Market rule).
      this.regions.region(),
    );
  }

  /**
   * Recognises `audio` and yields its transcripts; meters the seconds sent.
   *
   * @yields Each interim and final transcript, as the provider reports it.
   */
  async *listen(
    audio: AsyncIterable<Uint8Array>,
    request: SpeechRequest,
    session: SpeechSession,
  ): AsyncGenerator<Transcript> {
    const speech = await this.connection(session);
    const counter = { bytes: 0 };
    try {
      yield* speech.listen(counted(audio, counter), request);
    } finally {
      await this.meter.speech(audioSeconds(counter.bytes, request.format), session.usage);
    }
  }

  /**
   * Synthesises `text` and yields its audio; meters the seconds produced.
   *
   * @yields Each raw audio chunk in `request.format`.
   */
  async *speak(
    text: string,
    request: SpeechRequest,
    session: SpeechSession,
  ): AsyncGenerator<Uint8Array> {
    const speech = await this.connection(session);
    const counter = { bytes: 0 };
    try {
      yield* counted(speech.speak(text, request), counter);
    } finally {
      await this.meter.speech(audioSeconds(counter.bytes, request.format), session.usage);
    }
  }

  /**
   * Recognises what `device`'s microphone hears until `request.signal` aborts.
   *
   * @yields Each interim and final transcript.
   */
  listenOn(
    device: AudioDevice,
    request: SpeechRequest,
    session: SpeechSession,
  ): AsyncGenerator<Transcript> {
    return this.listen(device.capture(request.format, request.signal), request, session);
  }

  /** Says `text` on `device`'s speaker; resolves when it has played. */
  async sayOn(
    device: AudioDevice,
    text: string,
    request: SpeechRequest,
    session: SpeechSession,
  ): Promise<void> {
    await device.play(this.speak(text, request, session), request.format);
  }
}

/**
 * Passes `audio` through, adding each chunk's bytes to `counter`.
 *
 * @yields Each chunk unchanged.
 */
async function* counted(
  audio: AsyncIterable<Uint8Array>,
  counter: { bytes: number },
): AsyncGenerator<Uint8Array> {
  for await (const chunk of audio) {
    counter.bytes += chunk.byteLength;
    yield chunk;
  }
}
