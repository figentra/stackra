/**
 * Stackra file contract:
 * Purpose: `TunnelIngressRule`, one ingress rule of a named Cloudflare Tunnel: a dev host and the local origin it
 *          reaches, or the closing catch-all with no host.
 * Boundary: type only; `tunnelIngress` builds the list and `devTunnel` hands it to the tunnel's remote config.
 * Runtime: isomorphic
 * Governing contract: ADR 0290 (decisions 2, 4 and 5).
 */

/** One ingress rule, in the order cloudflared matches them. */
export type TunnelIngressRule = {
  /** `console-akouta.figentra.cloud`; absent on the catch-all. */
  readonly hostname?: string;
  /** `http://localhost:5173`, or `http_status:404` for the catch-all. */
  readonly service: string;
};
