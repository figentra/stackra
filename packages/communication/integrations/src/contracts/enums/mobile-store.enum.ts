/**
 * Stackra file contract:
 * Purpose: `MobileStore`, the app store a store-account Connection publishes to: Apple's App Store (an App Store
 *          Connect API key) or Google Play (a service account).
 * Boundary: an `Enum.of` value plus the type of the same name. A new store is a new member, added with the vendor
 *           connector that needs it; the connectors live in the OS integrations service (R3-8).
 * Runtime: isomorphic
 * Governing contract: app-shells D14; ADR 0355 (decision 1); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/**
 * The app stores.
 *
 * @example
 * if (account.store === MobileStore.GooglePlay) lane = "android";
 */
export const MobileStore = Enum.of({
  /** Apple's App Store and TestFlight, reached with an App Store Connect API key (ES256 JWT). */
  AppStore: "app_store",
  /** Google Play, reached with a service account (RFC 7523 JWT bearer grant). */
  GooglePlay: "google_play",
});

/** One of the codes above. */
export type MobileStore = Enum.Value<typeof MobileStore>;
