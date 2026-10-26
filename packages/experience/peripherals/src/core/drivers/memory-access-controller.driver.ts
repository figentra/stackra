/**
 * Stackra file contract:
 * Purpose: `MemoryAccessControllerDriver`, the `AccessController` driver a test or a demo presents credentials to and
 *          counts openings on: the only candidate this package ships for the port, so a lane's exit gate is testable
 *          before a gate controller's driver exists.
 * Boundary: no device is touched. `present(credential)` reaches every listener; `opened` counts the openings;
 *           `isConnected = false` makes the probe and `open` refuse with capability `serial`. The constructor takes
 *           nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0429 (decision 1); ADR 0266 (memory drivers first); ADR 0269 (fakes are real drivers).
 */
import { Driver } from "@stackra/container";
import { Capability } from "@stackra/platform";
import type { CapabilityResult } from "@stackra/platform/contracts";

import { AccessController } from "#contracts/ports/access-controller.port";
import { refuse } from "#core/functions/refuse.function";

/**
 * A gate in memory.
 *
 * @example
 * const gate = new MemoryAccessControllerDriver();
 * gate.present(token);
 * gate.opened; // 1 when the token opened it
 */
export class MemoryAccessControllerDriver extends Driver(AccessController) {
  /** Whether a gate answers. */
  isConnected = true;

  /** How many times the gate has opened. */
  opened = 0;

  /** The credential listeners. */
  private readonly listeners = new Set<(credential: string) => void>();

  /** Answers while connected. */
  async probe(): Promise<CapabilityResult> {
    // A gate controller hangs off a serial or relay line, the nearest capability the platform names.
    if (!this.isConnected) return refuse(Capability.Serial, "unavailable");
    return { ok: true, data: undefined };
  }

  /** Listens for credentials until the returned function stops it. */
  onCredential(listener: (credential: string) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Counts one opening while connected. */
  async open(): Promise<CapabilityResult> {
    if (!this.isConnected) return refuse(Capability.Serial, "unavailable");
    this.opened += 1;
    return { ok: true, data: undefined };
  }

  /** Presents `credential` at the reader, as a scan would. */
  present(credential: string): void {
    for (const listener of this.listeners) listener(credential);
  }
}
