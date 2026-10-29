/**
 * Stackra file contract:
 * Purpose: `ScaleProtocol`, one entry of the scale protocol pack (`NativeScaleConfig.protocols`): the makers and
 *          models known to speak it, the transports they come on, the line terminator, and the commands its driver
 *          sends (one reading, the stream on and off, the tare query), each empty where the protocol has none.
 * Boundary: a type only; the entries are configuration (`SCALE_PROTOCOLS` are the defaults), so a host fixes a
 *           model's terminator or command set without code. The driver still parses the protocol's answer grammar,
 *           which is code. `makers` is documentation for setup screens and the report, never matched at run time.
 * Runtime: isomorphic
 * Governing contract: ADR 0478 (decision 5); ADR 0253 (decision 4: presets are profiles).
 */
import type { ScaleTransport } from "#core/enums/scale-transport.enum";

/** A scale protocol's settings. */
export interface ScaleProtocol {
  /** Makers and model families known to speak it (`Mettler Toledo Ariva-S`), for setup screens. */
  readonly makers: readonly string[];

  /** The transports those models come on. */
  readonly transports: readonly ScaleTransport[];

  /** What ends each line the scale sends and each command sent to it (`\r\n`). */
  readonly terminator: string;

  /** The command that answers one reading now (`SI`), or empty when the scale only streams. */
  readonly request: string;

  /** The command that starts a reading on every change (`SIR`), or empty when the scale always streams. */
  readonly streamStart: string;

  /** The command that stops the stream (`@`), or empty. */
  readonly streamStop: string;

  /** The command that answers the tare in use (`TA`), or empty when the protocol cannot tell. */
  readonly tareQuery: string;
}
