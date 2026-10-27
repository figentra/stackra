/**
 * Stackra file contract:
 * Purpose: unit tests of `RtpAudioDeviceDriver`: capture yields the agreed payload type only and ends on abort or
 *          close; play sends 160-byte frames as RTP to the far end with increasing sequence and timestamp and the
 *          marker on the first; a format other than the call's is refused; close closes the socket.
 * Boundary: test only; the socket is an in-test fake.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); RFC 3550; ADR 0376 (decision 7).
 */
import { describe, expect, it } from "@stackra/testing";

import { AudioEncoding } from "#contracts/voice/audio-encoding.enum";
import { RtpAudioDeviceDriver } from "#node/sip/rtp-audio-device.driver";
import { rtpPacket } from "#node/sip/rtp-packet.function";
import { rtpPayload } from "#node/sip/rtp-payload.function";
import type { UdpPeer } from "#node/sip/udp-peer.type";
import type { UdpSocket } from "#node/sip/udp-socket.type";

const FAR = { address: "192.0.2.4", port: 30000 };

class FakeSocket implements UdpSocket {
  readonly sent: { data: Uint8Array; port: number; address: string }[] = [];

  closed = false;

  private listener: ((data: Uint8Array, from: UdpPeer) => void) | undefined;

  send(data: Uint8Array, port: number, address: string): void {
    this.sent.push({ data, port, address });
  }

  on(_event: "message", listener: (data: Uint8Array, from: UdpPeer) => void): this {
    this.listener = listener;
    return this;
  }

  deliver(data: Uint8Array): void {
    this.listener?.(data, FAR);
  }

  address(): UdpPeer {
    return { address: "0.0.0.0", port: 40000 };
  }

  close(): void {
    this.closed = true;
  }
}

const view = (packet: Uint8Array): DataView => new DataView(packet.buffer, packet.byteOffset);

const header = { sequence: 1, timestamp: 0, ssrc: 1 };

async function* chunks(...parts: Uint8Array[]): AsyncGenerator<Uint8Array> {
  yield* parts;
}

describe("RtpAudioDeviceDriver", () => {
  it("captures the agreed payload type until aborted", async () => {
    const socket = new FakeSocket();
    const device = new RtpAudioDeviceDriver(socket, FAR, AudioEncoding.Alaw);
    const stop = new AbortController();
    const heard: Uint8Array[] = [];
    const done = (async () => {
      for await (const chunk of device.capture(device.format, stop.signal)) heard.push(chunk);
    })();
    await Promise.resolve();
    socket.deliver(rtpPacket({ ...header, payloadType: 0 }, Uint8Array.of(9)));
    socket.deliver(rtpPacket({ ...header, payloadType: 8 }, Uint8Array.of(1, 2)));
    await new Promise((resolve) => setTimeout(resolve, 0));
    stop.abort();
    await done;
    expect(heard).toEqual([Uint8Array.of(1, 2)]);
  });

  it("plays audio as paced 20 ms packets", async () => {
    const socket = new FakeSocket();
    const device = new RtpAudioDeviceDriver(socket, FAR, AudioEncoding.Mulaw);
    await device.play(chunks(new Uint8Array(100), new Uint8Array(250)), device.format);
    expect(socket.sent.map((sent) => [sent.address, sent.port])).toEqual([
      [FAR.address, FAR.port],
      [FAR.address, FAR.port],
      [FAR.address, FAR.port],
    ]);
    const packets = socket.sent.map((sent) => sent.data);
    expect(packets.map((packet) => rtpPayload(packet)?.payload.byteLength)).toEqual([160, 160, 30]);
    expect(packets.map((packet) => rtpPayload(packet)?.payloadType)).toEqual([0, 0, 0]);
    expect(packets.map((packet) => (packet[1] ?? 0) >> 7)).toEqual([1, 0, 0]);
    const [first, second] = packets.map(view);
    expect(((second?.getUint16(2) ?? 0) - (first?.getUint16(2) ?? 0) + 0x10000) % 0x10000).toBe(1);
    expect(((second?.getUint32(4) ?? 0) - (first?.getUint32(4) ?? 0) + 2 ** 32) % 2 ** 32).toBe(
      160,
    );
  });

  it("refuses another format and closes its socket", async () => {
    const socket = new FakeSocket();
    const device = new RtpAudioDeviceDriver(socket, FAR, AudioEncoding.Alaw);
    await expect(
      device.play(chunks(), { encoding: AudioEncoding.Linear16, sampleRate: 16000, channels: 1 }),
    ).rejects.toThrow(RangeError);
    const capture = device.capture(device.format)[Symbol.asyncIterator]();
    const next = capture.next();
    device.close();
    await expect(next).resolves.toMatchObject({ done: true });
    expect(socket.closed).toBe(true);
  });

  it("refuses linear16 as a call codec", () => {
    expect(() => new RtpAudioDeviceDriver(new FakeSocket(), FAR, AudioEncoding.Linear16)).toThrow(
      RangeError,
    );
  });
});
