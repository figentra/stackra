/**
 * Stackra file contract:
 * Purpose: `CLOUDFLARE_IPV4_RANGES`, the address ranges Cloudflare's proxy connects from; a public workload's load
 *          balancer admits HTTPS only from them, so it is reached through Cloudflare alone (owner answer Q5).
 * Boundary: data only. shortcut: a pinned copy of https://www.cloudflare.com/ips-v4; refresh it when Cloudflare
 *           announces a change, or read it from the Cloudflare API at deploy time once a second user needs it.
 * Runtime: node
 * Governing contract: ADR 0493 (decision 2, owner answer Q5).
 */

/** Cloudflare's IPv4 ranges. */
export const CLOUDFLARE_IPV4_RANGES = Object.freeze([
  "173.245.48.0/20",
  "103.21.244.0/22",
  "103.22.200.0/22",
  "103.31.4.0/22",
  "141.101.64.0/18",
  "108.162.192.0/18",
  "190.93.240.0/20",
  "188.114.96.0/20",
  "197.234.240.0/22",
  "198.41.128.0/17",
  "162.158.0.0/15",
  "104.16.0.0/13",
  "104.24.0.0/14",
  "172.64.0.0/13",
  "131.0.72.0/22",
] as const);
