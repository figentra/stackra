/**
 * Stackra file contract:
 * Purpose: `ProviderDrivers<T>`, the connection class of every provider a package drives for one capability, by
 *          provider code: how a provider code from market-pack data or a stored record becomes a driver.
 * Boundary: a type only. The map lists drivers, never which Market uses which (that is `ProviderDefaults`' data). Each
 *           key equals its Integration's `provider`.
 * Runtime: isomorphic
 * Governing contract: ADR 0356 (decision 2); ADR 0355 (decision 1).
 */
import type { Connection } from "#core/bases/connection.base";
import type { ConnectionClass } from "#core/types/connection-class.type";

/**
 * Provider code to connection class.
 *
 * @example
 * const SMS: ProviderDrivers<SmsSender> = { unifonic: UnifonicConnection, taqnyat: TaqnyatConnection };
 */
export type ProviderDrivers<T> = Readonly<Record<string, ConnectionClass<Connection & T>>>;
