/**
 * Stackra file contract:
 * Purpose: `DevTunnel`, a running `cloudflared` for `stackra dev --tunnel`: what the dev command holds to stop it.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0290 (decision 4).
 */

/** A started dev tunnel. */
export type DevTunnel = {
  /** Stops `cloudflared` if it is still running; safe to call twice. */
  readonly stop: () => void;
};
