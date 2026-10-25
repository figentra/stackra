/**
 * Stackra file contract:
 * Purpose: `DriverRegistry`, the interface gen augments with the driver names it found per port, keyed by the port
 *          key (`<member>.<PortClass>`), so a `DriverName<Port>` config field and runway values are checked.
 * Boundary: empty here on purpose; each member's generated `#stackra/wiring` adds its ports through
 *           `declare module "@stackra/container" { interface DriverRegistry { ... } }`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 4: a driver choice is a config field typed `DriverName<Port>`); ADR 0263
 *                     (decision 9).
 */

/**
 * Port key to driver names, filled by gen.
 *
 * @example
 * declare module "@stackra/container" {
 *   interface DriverRegistry {
 *     "loyalty_kit.LoyaltyLedger": "postgres" | "memory";
 *   }
 * }
 */
// oxlint-disable-next-line typescript/no-empty-interface, typescript/no-empty-object-type -- augmented by gen
export interface DriverRegistry {}
