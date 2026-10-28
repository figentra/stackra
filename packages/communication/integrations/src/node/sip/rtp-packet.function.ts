/**
 * Stackra file contract:
 * Purpose: `rtpPacket`, one RTP packet (RFC 3550 section 5.1) around a frame of audio: version 2, no padding,
 *          extension or contributing sources.
 * Boundary: a pure function; sequence and timestamp wrap at 16 and 32 bits.
 * Runtime: node
 * Governing contract: RFC 3550 (section 5.1); ADR 0376 (decision 7: the SIP driver).
 */
import type { RtpHeader } from "#node/sip/rtp-header.type";

/**
 * The packet carrying `payload`.
 *
 * @example
 * socket.send(rtpPacket({ payloadType: 8, sequence, timestamp, ssrc }, frame), far.port, far.address);
 */
export function rtpPacket(header: RtpHeader, payload: Uint8Array): Uint8Array {
  const packet = new Uint8Array(12 + payload.byteLength);
  const view = new DataView(packet.buffer);
  view.setUint8(0, 0x80);
  view.setUint8(1, (header.marker === true ? 0x80 : 0) | (header.payloadType & 0x7f));
  view.setUint16(2, header.sequence & 0xff_ff);
  view.setUint32(4, header.timestamp >>> 0);
  view.setUint32(8, header.ssrc >>> 0);
  packet.set(payload, 12);
  return packet;
}
