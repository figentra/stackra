/**
 * Stackra file contract:
 * Purpose: `HostProbe`, one resolved address of one host and whether a TLS handshake on port 443 succeeded.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: STA-1952 spec FR-016.
 */

/** One address probe. */
export type HostProbe = {
  /** The host name. */
  readonly host: string;

  /** One address the system resolver gave for it; empty when the name did not resolve. */
  readonly address: string;

  /** Whether the handshake finished within the timeout. */
  readonly ok: boolean;
};
