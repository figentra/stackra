/**
 * Stackra file contract:
 * Purpose: the `AccessController` port: an entry or exit gate (a lane's exit barrier, a turnstile, a school gate). It
 *          reports each credential presented at its reader (a scanned QR code, a card) to a listener, and opens the
 *          gate once, each open as a `CapabilityResult` that refuses with capability `serial` when no gate answers.
 *          Config `peripherals.accessController` picks the driver (`memory`).
 * Boundary: an abstract class that is its own token, keyed `peripherals.AccessController`. It decides nothing: whether a
 *           credential opens the gate is the caller's (`ExitGateService` for signed receipt tokens, the rule sets a
 *           product configures). A gate's own relay or controller SDK is a driver with its ADR under 0253 decision 3.
 * Runtime: isomorphic
 * Governing contract: ADR 0429 (decisions 1 and 2); ADR 0253 (decision 3); ADR 0250 (decision 3).
 */
import { Port } from "@stackra/contracts";
import type { CapabilityResult } from "@stackra/platform/contracts";

/**
 * A gate with a credential reader.
 *
 * @example
 * const stop = gate.onCredential(async (credential) => { if (await allowed(credential)) await gate.open(); });
 */
export abstract class AccessController extends Port {
  /** Type-only port key, so `DriverName<AccessController>` narrows to this port's drivers. */
  declare readonly "~key": "peripherals.AccessController";

  /** Whether the gate answers now. */
  abstract probe(): Promise<CapabilityResult>;

  /** Calls `listener` with each credential presented, as the reader sent it; the returned function stops it. */
  abstract onCredential(listener: (credential: string) => void): () => void;

  /** Opens the gate for one passage. */
  abstract open(): Promise<CapabilityResult>;
}
