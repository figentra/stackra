/**
 * Stackra file contract:
 * Purpose: `StoreEnvironment`, the environment the action stores run in (`STACKRA_ENVIRONMENT`): only `dev` and `test`
 *          may keep Idempotency-Keys and token buckets in process memory. The set is closed, so a misspelt name fails
 *          config instead of running as `dev`.
 * Boundary: an `Enum.of` value plus the type of the same name; the environments @stackra/database's
 *           `commandEnvironment` and @stackra/market-packs' `PackEnvironment` know.
 * Runtime: isomorphic
 * Governing contract: ADR 0266 (decision 2: memory first, a production driver before production); ADR 0294 (decision
 *                     16: Enum); ADR 0231 (snake_case codes); STA-2798.
 */
import { Enum } from "@stackra/contracts";

/** The environments a deployment of the action stores runs in. */
export const StoreEnvironment = Enum.of({
  /** A developer's machine; the memory stores are allowed. */
  Dev: "dev",
  /** A pull request's preview deployment. */
  Preview: "preview",
  /** A test run; the memory stores are allowed. */
  Test: "test",
  /** The release candidate. */
  Staging: "staging",
  /** Tenants' data. */
  Production: "production",
});

/** One of the codes above. */
export type StoreEnvironment = Enum.Value<typeof StoreEnvironment>;
