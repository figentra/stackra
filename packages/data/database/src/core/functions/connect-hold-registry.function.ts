/**
 * Stackra file contract:
 * Purpose: `connectHoldRegistry`, which names the `HoldRegistry` every delete, purge and retention path consults; the
 *          runtime calls it once at boot with the bound driver, the testing module on every compile.
 * Boundary: replaces the previous registry whole; `undefined` disconnects, and then nothing is held.
 * Runtime: node
 * Governing contract: ADR 0134 (2026-10-24 amendment); the `connectVisibilityFilter` precedent (ADR 0333 decision 4).
 */
import { HOLD_HOST } from "#core/constants/hold-host.constant";
import type { HoldRegistry } from "#contracts/ports/hold-registry.port";

/**
 * Connects the disposal paths to the compliance service's holds.
 *
 * @param registry - the bound `HoldRegistry` driver, or `undefined` to disconnect.
 * @example
 * connectHoldRegistry(container.has(HoldRegistry) ? container.get(HoldRegistry) : undefined);
 */
export function connectHoldRegistry(registry: HoldRegistry | undefined): void {
  HOLD_HOST.registry = registry;
}
