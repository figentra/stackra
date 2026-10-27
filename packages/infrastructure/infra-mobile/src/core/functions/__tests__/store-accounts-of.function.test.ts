/**
 * Stackra file contract:
 * Purpose: unit tests of `storeAccountsOf`: a merge-started app publishes under the platform accounts its runway
 *          names; a scope's connected account replaces the platform's for its store only; a store the app targets with
 *          neither is refused with its runway path; a platform the app does not target gets no account.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0439 (decisions 7 and 8), app-shells D14.
 */
import { MobileStore } from "@stackra/integrations/contracts";
import type { MobileApp } from "@stackra/runway/node";
import { describe, expect, it } from "@stackra/testing";

import { MobileInfraInvalidError } from "#core/errors/mobile-infra-invalid.error";
import { storeAccountsOf } from "#core/functions/store-accounts-of.function";

const APP: MobileApp = {
  template: "os/mobile@3",
  identity: {
    ios: { bundleId: "com.figentra.commerce.shopper" },
    android: { package: "com.figentra.commerce.shopper" },
  },
  stores: { apple: { account: "figentra" }, google: { account: "figentra" } },
};

describe("storeAccountsOf", () => {
  it("publishes a merge-started app under the platform accounts", () => {
    expect(storeAccountsOf(APP)).toEqual([
      { store: "app_store", owner: "platform", account: "figentra" },
      { store: "google_play", owner: "platform", account: "figentra" },
    ]);
  });

  it("takes a scope's connected account for its store only", () => {
    expect(
      storeAccountsOf(APP, [{ store: MobileStore.GooglePlay, connection: "conn_play" }]),
    ).toEqual([
      { store: "app_store", owner: "platform", account: "figentra" },
      { store: "google_play", owner: "scope", connection: "conn_play" },
    ]);
  });

  it("refuses a targeted store with no account, and skips an untargeted one", () => {
    const iosOnly: MobileApp = {
      template: "os/mobile@3",
      identity: { ios: { bundleId: "a.b.c" } },
    };
    try {
      storeAccountsOf(iosOnly);
      throw new Error("expected a refusal");
    } catch (error) {
      expect(error).toBeInstanceOf(MobileInfraInvalidError);
      expect((error as MobileInfraInvalidError).issues.map((issue) => issue.path)).toEqual([
        "stores.apple.account",
      ]);
    }
    expect(
      storeAccountsOf(iosOnly, [{ store: MobileStore.AppStore, connection: "conn_asc" }]),
    ).toEqual([{ store: "app_store", owner: "scope", connection: "conn_asc" }]);
  });
});
