/**
 * Stackra file contract:
 * Purpose: `PackEnvironment`, the deploy environment the market-packs configuration runs in (`STACKRA_ENVIRONMENT`):
 *          the interim `bundled` source refuses `production` unless the host opts in, so the set is closed and a
 *          misspelt name fails config instead of running as not-production.
 * Boundary: an `Enum.of` value plus the type of the same name; the environments @stackra/database's
 *           `commandEnvironment` knows.
 * Runtime: isomorphic
 * Governing contract: ADR 0386 (as amended 2026-11-09); ADR 0294 (decision 16: Enum); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/** The deploy environments. */
export const PackEnvironment = Enum.of({
  /** A developer's machine. */
  Dev: "dev",
  /** A pull request's preview deployment. */
  Preview: "preview",
  /** A test run. */
  Test: "test",
  /** The release candidate. */
  Staging: "staging",
  /** Tenants' data; the bundled source refuses it unless allowed. */
  Production: "production",
});

/** One of the codes above. */
export type PackEnvironment = Enum.Value<typeof PackEnvironment>;
