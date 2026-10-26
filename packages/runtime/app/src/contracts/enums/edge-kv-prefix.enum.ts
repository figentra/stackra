/**
 * Stackra file contract:
 * Purpose: `EdgeKvPrefix`, the key prefixes of the edge KV copy the Worker reads: `host:<hostname>`,
 *          `boot:<product>:<surface>:<tenant>`, `release:<product>:<surface>`, `canary:<product>:<surface>`,
 *          `wellknown:<hostname>:<file>` and `shell:<surface>:<line>`.
 * Boundary: an `Enum.of` value plus the type of the same name; the prefix without its colon. Who writes which rows
 *           (Runway the platform rows, the edge projector the tenant rows) is the app-shells 5.3 table, not code.
 * Runtime: isomorphic
 * Governing contract: ADR 0437 (not yet landed; app-shells 5.3: the KV copy and who writes it, 16 point 3: shell canary); ADR 0294
 *                     (decision 16).
 */
import { Enum } from "@stackra/contracts";

/** The edge KV key prefixes. */
export const EdgeKvPrefix = Enum.of({
  /** `host:<hostname>`: product, surface, tenant, region, status, realm, canonical host. */
  Host: "host",
  /** `boot:<product>:<surface>:<tenant>`: the startup record without the release. */
  Boot: "boot",
  /** `release:<product>:<surface>`: the current bundle version and URL. */
  Release: "release",
  /** `canary:<product>:<surface>`: the canary tenants and their bundle version. */
  Canary: "canary",
  /** `wellknown:<hostname>:<file>`: the file body. */
  WellKnown: "wellknown",
  /** `shell:<surface>:<line>`: the shell release and its canary list. */
  Shell: "shell",
});

/** One of the prefixes above. */
export type EdgeKvPrefix = Enum.Value<typeof EdgeKvPrefix>;
