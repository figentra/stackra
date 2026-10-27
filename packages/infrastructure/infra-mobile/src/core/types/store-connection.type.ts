/**
 * Stackra file contract:
 * Purpose: `StoreConnection`, one store account a scope has connected for its white-label app: the store and the id
 *          of the Connection that implements `StoreAccountConnector` (an App Store Connect API key or a Google Play
 *          service account).
 * Boundary: type only; the OS reads the scope's connections and passes them to `storeAccountsOf`. An id, never a key.
 * Runtime: isomorphic
 * Governing contract: ADR 0439 (decision 8), app-shells D14; `StoreAccountConnector` in `@stackra/integrations/contracts`.
 */
import type { MobileStore } from "@stackra/integrations/contracts";

/** A scope's connected store account. */
export type StoreConnection = {
  /** The store it publishes to. */
  readonly store: MobileStore;
  /** The Connection id. */
  readonly connection: string;
};
