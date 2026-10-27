/**
 * Stackra file contract:
 * Purpose: `RtpAudioDeviceDriver`, a SIP call's media leg as an `AudioDevice`: `capture` yields the caller's G.711
 *          audio from incoming RTP, `play` sends audio as 20 ms RTP packets paced in real time, so `SpeechService`'s
 *          `listenOn` and `sayOn` run a call like a lane microphone.
 * Boundary: the driver named `rtp`, one per call, made by `SipVoiceGateway` once the codec and far address are agreed;
 *           it owns the call's RTP socket and closes it in `close`. Audio is passed through and never stored or
 *           logged. Only the agreed codec at 8000 Hz mono is taken; audio arriving while nothing captures is dropped.
 *           No jitter buffer, RTCP or symmetric-RTP latching.
 * Runtime: node
 * Governing contract: RFC 3550; RFC 3551; ADR 0376 (decision 7: the device-audio driver, the SIP driver).
 */
import { Driver } from "@stackra/container";

import { AudioDevice } from "#contracts/voice/audio-device.port";
import type { AudioEncoding } from "#contracts/voice/audio-encoding.enum";
import type { AudioFormat } from "#contracts/voice/audio-format.type";
import { RTP_PAYLOAD_TYPES } from "#node/sip/rtp-payload-types.constant";
import { rtpPacket } from "#node/sip/rtp-packet.function";
import { rtpPayload } from "#node/sip/rtp-payload.function";
import type { UdpPeer } from "#node/sip/udp-peer.type";
import type { UdpSocket } from "#node/sip/udp-socket.type";

/** Samples (and bytes, at one byte per G.711 sample) in a 20 ms packet at 8000 Hz. */
const FRAME = 160;

/** Milliseconds per packet. */
const PACKET_MS = 20;

/**
 * A call's audio over RTP.
 *
 * @example
 * const device = new RtpAudioDeviceDriver(socket, far, AudioEncoding.Alaw);
 * await speech.sayOn(device, greeting, { speech: voice, format: device.format }, session);
 */
export class RtpAudioDeviceDriver extends Driver(AudioDevice) {
  /** The format both directions carry. */
  readonly format: AudioFormat;

  private readonly socket: UdpSocket;

  private readonly far: UdpPeer;

  private readonly payloadType: number;

  private readonly ssrc = globalThis.crypto.getRandomValues(new Uint32Array(1))[0] ?? 1;

  private sequence = globalThis.crypto.getRandomValues(new Uint16Array(1))[0] ?? 0;

  private timestamp = globalThis.crypto.getRandomValues(new Uint32Array(1))[0] ?? 0;

  /** The running capture's sink, or none. */
  private sink: ((payload: Uint8Array | undefined) => void) | undefined;

  private closed = false;

  /**
   * @param socket - the call's bound RTP socket.
   * @param far - where the far end takes RTP (its SDP).
   * @param encoding - the agreed G.711 codec.
   * @throws RangeError when `encoding` has no RTP payload type.
   */
  constructor(socket: UdpSocket, far: UdpPeer, encoding: AudioEncoding) {
    super();
    const codec = RTP_PAYLOAD_TYPES[encoding];
    if (codec === undefined) throw new RangeError(`${encoding} is not carried over RTP here`);
    this.socket = socket;
    this.far = far;
    this.payloadType = codec.type;
    this.format = { encoding, sampleRate: 8000, channels: 1 };
    socket.on("message", (data) => {
      const got = rtpPayload(data);
      if (got?.payloadType === this.payloadType) this.sink?.(got.payload);
    });
  }

  /**
   * Yields the caller's audio until `signal` aborts or the call ends.
   *
   * @yields Each packet's payload.
   * @throws RangeError when `format` is not the call's.
   */
  async *capture(format: AudioFormat, signal?: AbortSignal): AsyncGenerator<Uint8Array> {
    this.check(format);
    const queue: (Uint8Array | undefined)[] = [];
    let wake: (() => void) | undefined;
    const push = (payload: Uint8Array | undefined): void => {
      queue.push(payload);
      wake?.();
    };
    const stop = (): void => push(undefined);
    this.sink = push;
    signal?.addEventListener("abort", stop, { once: true });
    try {
      if (signal?.aborted === true) return;
      // An abort or `close` queues `undefined`, which ends the loop.
      while (!this.closed) {
        if (queue.length === 0) await new Promise<void>((resolve) => (wake = resolve));
        wake = undefined;
        const payload = queue.shift();
        if (payload === undefined) return;
        yield payload;
      }
    } finally {
      signal?.removeEventListener("abort", stop);
      if (this.sink === push) this.sink = undefined;
    }
  }

  /**
   * Sends `audio` in 20 ms packets at real-time pace; resolves after the last.
   *
   * @throws RangeError when `format` is not the call's.
   */
  async play(audio: AsyncIterable<Uint8Array>, format: AudioFormat): Promise<void> {
    this.check(format);
    const started = Date.now();
    let sent = 0;
    let rest = new Uint8Array(0);
    const send = async (frame: Uint8Array): Promise<void> => {
      const due = started + sent * PACKET_MS - Date.now();
      if (due > 0) await new Promise((resolve) => setTimeout(resolve, due));
      if (this.closed) return;
      const header = {
        payloadType: this.payloadType,
        sequence: this.sequence,
        timestamp: this.timestamp,
        ssrc: this.ssrc,
        marker: sent === 0,
      };
      this.socket.send(rtpPacket(header, frame), this.far.port, this.far.address);
      this.sequence = (this.sequence + 1) & 0xffff;
      this.timestamp = (this.timestamp + FRAME) >>> 0;
      sent += 1;
    };
    for await (const chunk of audio) {
      const joined = new Uint8Array(rest.byteLength + chunk.byteLength);
      joined.set(rest);
      joined.set(chunk, rest.byteLength);
      let at = 0;
      for (; at + FRAME <= joined.byteLength && !this.closed; at += FRAME)
        await send(joined.subarray(at, at + FRAME));
      rest = joined.slice(at);
      if (this.closed) return;
    }
    if (rest.byteLength > 0) await send(rest);
  }

  /** Ends any capture and closes the RTP socket. */
  close(): void {
    if (this.closed) return;
    this.closed = true;
    this.sink?.(undefined);
    this.socket.close();
  }

  /** Refuses a format other than the call's. */
  private check(format: AudioFormat): void {
    if (
      format.encoding !== this.format.encoding ||
      format.sampleRate !== this.format.sampleRate ||
      format.channels !== this.format.channels
    )
      throw new RangeError("the call carries only its agreed codec at 8000 Hz mono");
  }
}
