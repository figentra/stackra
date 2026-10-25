/**
 * Stackra file contract:
 * Purpose: `SentryTarget`, where a Sentry envelope goes: the project's envelope endpoint, the public key that
 *          authenticates it and the DSN the envelope header names.
 * Boundary: a type only, built by `sentryTarget` from the DSN secret; held in memory by the driver, never logged.
 * Runtime: isomorphic
 * Governing contract: ADR 0184 (decision 6); ADR 0173 (nobody reads a value).
 */

/** A parsed Sentry DSN. */
export interface SentryTarget {
  /** `https://o1.ingest.sentry.io/api/42/envelope/`. */
  readonly endpoint: string;

  /** The DSN's public key. */
  readonly key: string;

  /** The DSN as it was given, for the envelope header. */
  readonly dsn: string;
}
