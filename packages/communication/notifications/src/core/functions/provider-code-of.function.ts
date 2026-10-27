/**
 * Stackra file contract:
 * Purpose: `providerCodeOf`, the provider code a resolved Connection serves under: the key of the host's driver map
 *          whose class built it.
 * Boundary: pure; internal to the connection transports, for the `provider` of a `DeliveryRecorded`. A Connection
 *           whose class is not in the map answers its class name.
 * Runtime: isomorphic
 * Governing contract: ADR 0356 (decision 2); stackra-207 (STA-1360).
 */
import type { ProviderDrivers } from "@stackra/integrations";

/**
 * The code of `connection`'s provider in `drivers`.
 *
 * @example
 * providerCodeOf({ twilio: TwilioConnection }, connection); // "twilio"
 */
export function providerCodeOf<T>(drivers: ProviderDrivers<T>, connection: object): string {
  return (
    Object.keys(drivers).find((code) => drivers[code] === connection.constructor) ??
    connection.constructor.name
  );
}
