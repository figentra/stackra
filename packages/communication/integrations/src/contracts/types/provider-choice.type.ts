/**
 * Stackra file contract:
 * Purpose: `ProviderChoice`, one provider a Market offers for a capability: its provider code and the platform
 *          Connection that serves a tenant with none of its own, when the platform runs one.
 * Boundary: a type only; market-pack data, read through `ProviderDefaults`. A provider the Market offers with no
 *           platform Connection yet (a bring-your-own-only provider) carries none: a tenant's own Connection of it
 *           still serves, and nothing managed does.
 * Runtime: isomorphic
 * Governing contract: ADR 0356 (decisions 3 and 5); ADR 0422 (decision 3).
 */

/**
 * One provider of a Market.
 *
 * @example
 * const choice: ProviderChoice = { provider: "unifonic", connectionId: "conn_01j…" };
 */
export interface ProviderChoice {
  /** The Integration's provider code. */
  readonly provider: string;

  /** The platform Connection's id; absent when the platform runs none for this provider in the Market. */
  readonly connectionId?: string;
}
