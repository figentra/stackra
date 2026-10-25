/**
 * Stackra file contract:
 * Purpose: `ProviderChoice`, one provider a Market offers for a capability: its provider code and the platform
 *          Connection that serves a tenant with none of its own.
 * Boundary: a type only; market-pack data, read through `ProviderDefaults`.
 * Runtime: isomorphic
 * Governing contract: ADR 0356 (decisions 3 and 5).
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

  /** The platform Connection's id. */
  readonly connectionId: string;
}
