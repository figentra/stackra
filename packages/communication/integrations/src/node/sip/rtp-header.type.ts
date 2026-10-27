/**
 * Stackra file contract:
 * Purpose: `RtpHeader`, the fields of an RTP packet header the SIP trunk driver writes and reads.
 * Boundary: a type only.
 * Runtime: node
 * Governing contract: RFC 3550 (section 5.1).
 */

/** An RTP header. */
export interface RtpHeader {
  /** The payload type (8 for PCMA). */
  readonly payloadType: number;
  /** The packet's sequence number. */
  readonly sequence: number;
  /** The sampling instant of the first sample, in samples. */
  readonly timestamp: number;
  /** The stream's synchronisation source. */
  readonly ssrc: number;
  /** Set on the first packet of a talkspurt. */
  readonly marker?: boolean;
}
