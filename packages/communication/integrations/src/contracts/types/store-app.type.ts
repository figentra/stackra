/**
 * Stackra file contract:
 * Purpose: `StoreApp`, one app a store account can publish: its bundle id or package name, the store's own id of it
 *          and its listed name.
 * Boundary: a type only; what `StoreAccountConnector#findApp` answers. No credential or reviewer data.
 * Runtime: isomorphic
 * Governing contract: app-shells D14; ADR 0355 (decision 1).
 */
import type { MobileStore } from "#contracts/enums/mobile-store.enum";

/** An app on a store account. */
export interface StoreApp {
  /** The store it is on. */
  readonly store: MobileStore;

  /** The bundle id (App Store) or package name (Google Play), `com.figentra.commerce.staff`. */
  readonly appId: string;

  /** The store's own id: Apple's numeric app id, or the package name again on Google Play. */
  readonly storeId: string;

  /** The app's name on the store. */
  readonly name: string;
}
