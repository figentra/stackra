/**
 * Stackra file contract:
 * Purpose: the `EdgeSigningKeys` port: the HMAC secrets the API accepts on the signed edge headers right now, newest
 *          first. Two are active during a rotation (the Worker signs with the newer, the API accepts both, the older
 *          is retired on the next rotation), so the secret rotates without a cut-over.
 * Boundary: an abstract class that is its own token, keyed `app.EdgeSigningKeys`. Which provider answers is
 *           configuration: the shipped `memory` driver for tests and local runs, a host's secret-store driver bound by
 *           wiring or an override in production. Secrets are never logged or returned past the guard.
 * Runtime: isomorphic
 * Governing contract: ADR 0437 (decision 4: two signing keys); ADR 0294 (decisions 4 and 16); ADR 0263.
 */
import { Port } from "@stackra/contracts";

/**
 * The active edge signing secrets.
 *
 * @example
 * const [newest] = await keys.active();
 */
export abstract class EdgeSigningKeys extends Port {
  /** Type-only port key, so `DriverName<EdgeSigningKeys>` narrows to this port's drivers. */
  declare readonly "~key": "app.EdgeSigningKeys";

  /** The secrets a signature may be made with, newest first; empty refuses every signed request. */
  abstract active(): Promise<readonly string[]>;
}
