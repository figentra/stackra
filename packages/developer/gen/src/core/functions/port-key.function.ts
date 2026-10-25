/**
 * Stackra file contract:
 * Purpose: `portKey`, the key of a port: the key of the member that declares it and the port's class name
 *          (`loyalty_kit.LoyaltyLedger`). The `DriverRegistry` augmentation and `useDrivers` in tests key on it.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: the DriverName registry is keyed by port key).
 */

/**
 * The key of a port.
 *
 * @example
 * portKey("loyalty_kit", "LoyaltyLedger"); // "loyalty_kit.LoyaltyLedger"
 */
export function portKey(member: string, port: string): string {
  return `${member}.${port}`;
}
