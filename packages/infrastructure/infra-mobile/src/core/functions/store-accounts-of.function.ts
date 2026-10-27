/**
 * Stackra file contract:
 * Purpose: `storeAccountsOf(app, connected?)`, the account each store of a mobile app publishes under: the scope's
 *          connected store account when it has one for that store (bring your own), else the platform account the
 *          root runway names in `mobile.<app>.stores.<apple|google>.account` (managed).
 * Boundary: pure: the runway app and the scope's connections in, one `MobileStoreAccount` per store the app targets
 *           out. Ids only; it never reads a key or calls a store. The white-label mode and Apple guideline checks are
 *           the mobile job's (`runMobileJob`).
 * Runtime: isomorphic
 * Governing contract: ADR 0439 (decisions 7 and 8), app-shells D3 and D14; ADR 0171 (infrastructure facts).
 */
import { MobileStore } from "@stackra/integrations/contracts";
import type { RunwayIssue } from "@stackra/runway";
import type { MobileApp, MobileStoreAccount } from "@stackra/runway/node";

import { MobileInfraInvalidError } from "#core/errors/mobile-infra-invalid.error";
import type { StoreConnection } from "#core/types/store-connection.type";

/**
 * The store accounts of a mobile app.
 *
 * @param app - the root runway's `mobile.<app>`.
 * @param connected - the scope's connected store accounts; none for a merge-started build.
 * @throws MobileInfraInvalidError naming each `stores.<apple|google>.account` a store needs and the runway lacks.
 * @example
 * storeAccountsOf(root.mobile.shopper, [{ store: MobileStore.GooglePlay, connection: "conn_play" }]);
 * // [{ store: "app_store", owner: "platform", account: "figentra" },
 * //  { store: "google_play", owner: "scope", connection: "conn_play" }]
 */
export function storeAccountsOf(
  app: MobileApp,
  connected: readonly StoreConnection[] = [],
): readonly MobileStoreAccount[] {
  const stores = [
    ...(app.identity?.ios === undefined ? [] : [[MobileStore.AppStore, "apple"] as const]),
    ...(app.identity?.android === undefined ? [] : [[MobileStore.GooglePlay, "google"] as const]),
  ];
  const issues: RunwayIssue[] = [];
  const accounts: MobileStoreAccount[] = [];
  for (const [store, key] of stores) {
    const own = connected.find((connection) => connection.store === store);
    const account = app.stores?.[key]?.account;
    if (own !== undefined) accounts.push({ store, owner: "scope", connection: own.connection });
    else if (account !== undefined) accounts.push({ store, owner: "platform", account });
    else
      issues.push({
        path: `stores.${key}.account`,
        message: `Name the platform's ${key} account, or connect the scope's own`,
      });
  }
  if (issues.length > 0) throw new MobileInfraInvalidError("the mobile store accounts", issues);
  return accounts;
}
