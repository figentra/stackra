/**
 * Stackra file contract:
 * Purpose: `StoreAccountConnector`, what a store-account Connection implements: a merchant's own App Store Connect API
 *          key or Google Play service account, which Runway publishes a white-label app under (D14, bring your own).
 *          It names its store and finds an app the account can publish, so the console can check a connection before a
 *          release.
 * Boundary: an interface a provider Connection implements under `IntegrationCategory.AppStores`, not a container port.
 *           The Integration and Connection classes are vendor connectors in the OS integrations service (R3-8, os-50);
 *           they authenticate with the existing machinery: App Store Connect as `AuthType.Jwt` (ES256, `kid` the key
 *           id, `iss` the issuer id, `aud` `appstoreconnect-v1`, at most 20 minutes), Google Play as
 *           `AuthType.OAuth2JwtBearer` (the `androidpublisher` scope). The upload runs on the CI runner, which reads the
 *           key through the connection's `CredentialRef`; the key never passes through this interface. With no store
 *           account connected, Runway publishes under Figentra's account (managed), which is no Connection at all.
 * Runtime: isomorphic
 * Governing contract: app-shells D14; R3-7; R3-8; ADR 0355 (decision 1); ADR 0356 (decision 2); ADR 0308 (rules 6, 12).
 */
import type { MobileStore } from "#contracts/enums/mobile-store.enum";
import type { StoreApp } from "#contracts/types/store-app.type";

/**
 * A merchant's store account.
 *
 * @example
 * export class AppStoreConnectConnection extends Connection<AppStoreConnectIntegration> implements StoreAccountConnector { … }
 */
export interface StoreAccountConnector {
  /** The store this account publishes to. */
  readonly store: MobileStore;

  /**
   * The app with bundle id or package name `appId` on this account.
   *
   * @returns null when the account has no such app or its key may not see it.
   * @throws ConnectionCheckFailedError when the store refuses the key itself.
   */
  findApp(appId: string): Promise<StoreApp | null>;
}
