/**
 * Stackra file contract:
 * Purpose: `SipCallHost`, what the host gives the SIP trunk driver to run calls: the speech service and meter, each
 *          call's speech session, the post to its own call webhooks, and (for tests) the UDP socket opener.
 * Boundary: a type only. `post` is the host's: it signs or routes the request to its own webhook handler, which answers
 *           with `SipVoiceGateway#answer`; the driver never chooses where a call's instructions come from.
 * Runtime: node
 * Governing contract: ADR 0376 (decision 7); R3-SO-11 (meters).
 */
import type { Url } from "@stackra/contracts";

import type { SpeechService } from "#core/voice/speech.service";
import type { SpeechSession } from "#core/voice/speech-session.type";
import type { VoiceMeter } from "#core/voice/voice-meter.service";
import type { UdpSocket } from "#node/sip/udp-socket.type";

/** The host side of the SIP trunk driver. */
export interface SipCallHost {
  /** Speaks and listens on a call. */
  readonly speech: SpeechService;

  /** Meters each answered call's minutes when it ends. */
  readonly meter: VoiceMeter;

  /** The speech session (drivers, who pays) of the call `reference` (ours outbound, the Call-ID inbound). */
  session(reference: string): SpeechSession;

  /** Posts `params` to the host's own call webhook `url` and resolves to its answer body. */
  post(url: Url, params: Readonly<Record<string, string>>): Promise<string>;

  /** Opens a UDP socket bound to `port` (0 for any); node:dgram when left out. */
  openUdp?(port: number): Promise<UdpSocket>;
}
