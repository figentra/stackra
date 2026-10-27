/**
 * Stackra file contract:
 * Purpose: `edgeKvKey(kind, ...parts)`, one key of the edge Worker's KV copy in the shape ADR 0437 decision 6 fixes:
 *          `host:<hostname>`, `boot:<product>:<surface>:<scope>`, `shell:<surface>:<line>`,
 *          `release:<product>:<surface>`, `canary:<product>:<surface>` and `wellknown:<hostname>:<file>`, so Runway,
 *          the edge projector and the Worker never spell a key by hand.
 * Boundary: pure; builds the key, never reads or writes KV. A part may not be empty or hold `:`.
 * Runtime: isomorphic
 * Governing contract: ADR 0437 (decision 6), ADR 0296 (Runway writes platform rows).
 */
import { CloudflareConfigInvalidError } from "#core/errors/cloudflare-config-invalid.error";
import type { EdgeKvKeyParts } from "#core/types/edge-kv-key-parts.type";

/**
 * The KV key of `kind` over `parts`.
 *
 * @throws CloudflareConfigInvalidError when a part is empty or holds `:`.
 * @example
 * edgeKvKey("host", "shop.acme.example"); // "host:shop.acme.example"
 * edgeKvKey("wellknown", "shop.acme.example", "assetlinks.json"); // "wellknown:shop.acme.example:assetlinks.json"
 */
export function edgeKvKey<K extends keyof EdgeKvKeyParts>(
  kind: K,
  ...parts: EdgeKvKeyParts[K]
): string {
  const values: readonly string[] = parts;
  const bad = values.findIndex((part) => part.length === 0 || part.includes(":"));
  if (bad !== -1)
    throw new CloudflareConfigInvalidError("edge KV key", [
      {
        path: `${kind}.${bad}`,
        message: `A key part is empty or holds ":" (${JSON.stringify(values[bad])})`,
      },
    ]);
  return [kind, ...values].join(":");
}
