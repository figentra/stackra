/**
 * Stackra file contract:
 * Purpose: `EdgeSettings`: the parsed vars of `stackra-edge`.
 * Boundary: types only; `readSettings` builds it.
 * Runtime: worker
 * Governing contract: ADR 0437 (decisions 2 and 4); ADR 0206 (decision 8).
 */
import type { CspConfig } from "@stackra/csp";

import type { HostEntry } from "#src/interfaces/host-entry.interface";

/** The parsed vars of `stackra-edge`. */
export interface EdgeSettings {
  /** The origin requests are forwarded to, `scheme://host[:port]`. */
  readonly origin: string;
  /** Hostname (lower case) to what it means. */
  readonly hosts: Readonly<Record<string, HostEntry>>;
  /** The token issuer, exactly as tokens carry it in `iss`. */
  readonly issuer: string;
  /** The audience a token must name. */
  readonly audience: string;
  /** How long the issuer's key set is cached, in seconds. */
  readonly keysSeconds: number;
  /** Clock skew allowed on `exp` and `nbf`, in seconds. */
  readonly leewaySeconds: number;
  /** The policy of each surface, keyed `<product>.<surface>`, each validated by `CspConfig`'s schema. */
  readonly csp: Readonly<Record<string, CspConfig>>;
  /** The policy of a surface `csp` does not list, and of the edge's own 404: the package baseline. */
  readonly baselineCsp: CspConfig;
  /** How long a resolver's answer for one path is kept, in seconds. */
  readonly frameAncestorsSeconds: number;
}
