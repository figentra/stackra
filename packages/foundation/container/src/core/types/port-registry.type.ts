/**
 * Stackra file contract:
 * Purpose: `PortRegistry`, the interface gen augments with the class of each port it registered drivers for, keyed by
 *          the port key (`<member>.<PortClass>`), so `DriverName<Port>` finds a port's names by its class without a
 *          hand-written brand on the port.
 * Boundary: empty here on purpose; each member's generated `#stackra/wiring` adds its ports through
 *           `declare module "@stackra/container" { interface PortRegistry { ... } }`, beside `DriverRegistry`. The
 *           augmentation targets this module, never a port's own module, because a re-exported name does not merge.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4 and 26); ADR 0263 (decision 9); STA-1810.
 */

/**
 * Port key to port class, filled by gen.
 *
 * @example
 * declare module "@stackra/container" {
 *   interface PortRegistry {
 *     "loyalty_kit.LoyaltyLedger": typeof LoyaltyLedger;
 *   }
 * }
 */
// oxlint-disable-next-line typescript/no-empty-interface, typescript/no-empty-object-type -- augmented by gen
export interface PortRegistry {}
