/**
 * Stackra file contract:
 * Purpose: `DEV_TUNNEL_SETTINGS`, what `stackra dev --tunnel` runs: the environment variable that carries the developer
 *          machine's tunnel token, the variable `cloudflared` reads it from, and the `cloudflared` command.
 * Boundary: data only; names, never a value.
 * Runtime: node
 * Governing contract: ADR 0290 (decisions 4 and 5).
 */

/** How the dev tunnel is started. */
export const DEV_TUNNEL_SETTINGS = Object.freeze({
  /** The token's name in Infisical `/agents`, one per developer machine (the tunnel `figentra-<dev>`). */
  tokenVariable: "CLOUDFLARE_TUNNEL_TOKEN",
  /** The variable `cloudflared tunnel run` reads its token from, so the token never appears on its command line. */
  cloudflaredTokenVariable: "TUNNEL_TOKEN",
  /** The program and its arguments; the tunnel's ingress is held remotely in Cloudflare, so it takes no config file. */
  command: "cloudflared",
  args: Object.freeze(["tunnel", "--no-autoupdate", "run"]),
} as const);
