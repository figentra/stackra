/**
 * Stackra file contract:
 * Purpose: `rtpPayload`, the payload type and audio of one received RTP packet, past its contributing sources, header
 *          extension and padding.
 * Boundary: a pure function; anything that is not RTP version 2 or is cut short is `undefined` and dropped.
 * Runtime: node
 * Governing contract: RFC 3550 (section 5.1); ADR 0376 (decision 7: the SIP driver).
 */

/**
 * The payload of `packet`.
 *
 * @example
 * const got = rtpPayload(datagram);
 * if (got?.payloadType === 8) queue.push(got.payload);
 */
export function rtpPayload(
  packet: Uint8Array,
): { readonly payloadType: number; readonly payload: Uint8Array } | undefined {
  if (packet.byteLength < 12 || packet[0] === undefined || packet[0] >> 6 !== 2) return undefined;
  const view = new DataView(packet.buffer, packet.byteOffset, packet.byteLength);
  const first = view.getUint8(0);
  let start = 12 + (first & 0x0f) * 4;
  if ((first & 0x10) !== 0) {
    if (packet.byteLength < start + 4) return undefined;
    start += 4 + view.getUint16(start + 2) * 4;
  }
  const padding = (first & 0x20) !== 0 ? view.getUint8(packet.byteLength - 1) : 0;
  const end = packet.byteLength - padding;
  if (end < start) return undefined;
  return { payloadType: view.getUint8(1) & 0x7f, payload: packet.subarray(start, end) };
}
