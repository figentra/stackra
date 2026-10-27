/**
 * Stackra file contract:
 * Purpose: `SipTrunkOptions`, the configuration of one carrier SIP trunk: where the carrier's border controller is, the
 *          address it reaches us on, registration, codecs, number format, ring time and the webhook URLs of incoming
 *          calls.
 * Boundary: a type only. Every value is deployment data of the carrier's platform Connection (the voice provider per
 *           pack is pack data, X2-30); nothing names a carrier. Credentials are secret names, never values. UDP only.
 * Runtime: node
 * Governing contract: ADR 0376 (decisions 7 and 9); RFC 3261; RV-51 (licensed Saudi carrier).
 */
import type { Url } from "@stackra/contracts";

import type { AudioEncoding } from "#contracts/voice/audio-encoding.enum";

/** One SIP trunk. */
export interface SipTrunkOptions {
  /** The carrier's SIP host (its border controller), a name or an address. */
  readonly host: string;

  /** Its SIP port; 5060 when left out. */
  readonly port?: number;

  /** The SIP domain in URIs; `host` when left out. */
  readonly domain?: string;

  /** Our address as the carrier sees it (public or on the private link), written into Via, Contact and SDP. */
  readonly publicAddress: string;

  /** The local signalling port; 5060 when left out. */
  readonly localPort?: number;

  /** Register with the carrier for `expiresSeconds` and refresh at half of it; left out for an IP-authenticated trunk. */
  readonly register?: { readonly expiresSeconds: number };

  /** Secret name of the digest user name; `SIP_TRUNK_USERNAME` when left out. */
  readonly usernameSecret?: string;

  /** Secret name of the digest password; `SIP_TRUNK_PASSWORD` when left out. */
  readonly passwordSecret?: string;

  /** The G.711 codecs offered, in order of preference (A-law first on most non-US trunks). */
  readonly codecs: readonly AudioEncoding[];

  /** Whether dialled numbers keep their leading `+` (`+9665…`) or are sent as digits (`9665…`). */
  readonly keepPlus: boolean;

  /** Seconds an outbound call rings when the call does not say. */
  readonly ringSeconds: number;

  /** Where an incoming call asks for its instructions and reports its status; left out, incoming calls are refused. */
  readonly inbound?: { readonly instructionsUrl: Url; readonly statusUrl?: Url };
}
