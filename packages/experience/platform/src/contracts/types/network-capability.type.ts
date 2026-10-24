/**
 * Stackra file contract:
 * Purpose: `NetworkCapability`, the `network` facet of the platform: whether the app can reach the network now, as a
 *          live value the offline banner and the mutation queue read.
 * Boundary: a type only; reads, no side effects. The driver decides how it knows (browser events, the OS reachability
 *           API).
 * Runtime: isomorphic
 * Governing contract: ADR 0250 (decision 2); ADR 0252 (offline on every client).
 */
import type { ReadonlySignal } from "#contracts/types/readonly-signal.type";

/** The device's online state, as a signal. */
export interface NetworkCapability {
  /** True while the network is reachable; flips when the driver learns otherwise. */
  readonly isOnline: ReadonlySignal<boolean>;
}
