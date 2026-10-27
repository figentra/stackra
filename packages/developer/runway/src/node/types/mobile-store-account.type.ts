/**
 * Stackra file contract:
 * Purpose: `MobileStoreAccount`, the account one store publishes a mobile build under: the platform's own account by
 *          its runway name (managed, `mobile.<app>.stores.<apple|google>.account`), or a scope's connected store
 *          account by its Connection id (bring your own, an App Store Connect API key or a Google Play service
 *          account).
 * Boundary: type only; `storeAccountsOf` in @stackra/infra-mobile resolves it and `runMobileJob` takes it. The store
 *           codes are those of `MobileStore` in `@stackra/integrations/contracts`. Ids only, never a key: the submit
 *           step reads the key through the Connection's credential reference on the CI runner.
 * Runtime: node
 * Governing contract: ADR 0439 (decisions 7 and 8), app-shells D3 and D14; ADR 0173 (no secret value in git).
 */

/** One store's publishing account. */
export type MobileStoreAccount =
  | {
      /** `app_store` or `google_play`. */
      readonly store: "app_store" | "google_play";
      /** Published under the platform's account (managed). */
      readonly owner: "platform";
      /** The account's runway name, `figentra`. */
      readonly account: string;
    }
  | {
      readonly store: "app_store" | "google_play";
      /** Published under the scope's own account (bring your own). */
      readonly owner: "scope";
      /** The id of the scope's store-account Connection. */
      readonly connection: string;
    };
