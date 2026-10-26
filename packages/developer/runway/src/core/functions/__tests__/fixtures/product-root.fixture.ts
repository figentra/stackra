/**
 * Stackra file contract:
 * Purpose: test fixture: the root runway of a product edition (`mezzora` of `commerce`) with the console, landing,
 *          ops and till surfaces, one staff mobile app linking its console host, and a production environment on the
 *          `example.com` zone in the `ksa` region; plus the app-link signing facts its app needs.
 * Boundary: test only; built through `parseRunway`, so it is a valid root runway. Every value is test data.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0441 (decision 3), ADR 0436, ADR 0439.
 */
import { parseRunway } from "#core/functions/parse-runway.function";
import type { AppLinkSigning } from "#core/types/app-link-signing.type";
import type { RootRunway } from "#core/types/root-runway.type";

/** The staff app's entry, as written in the runway. */
export const STAFF_APP = {
  template: "os/mobile@3",
  packages: ["@mezzora/mobile-ui"],
  assets: "assets/mobile/staff",
  store: "assets/store/staff",
  identity: {
    name: { en: "Mezzora Staff", ar: "Mezzora Staff" },
    ios: { bundleId: "com.example.mezzora.staff", team: "example" },
    android: { package: "com.example.mezzora.staff" },
    scheme: "mezzora-staff",
    links: ["console.mezzora.example.com"],
  },
  capabilities: ["scanner", "push", "printer"],
  stores: { apple: { account: "example" }, google: { account: "example" } },
  eas: { project: "00000000-0000-0000-0000-000000000000", channel: "production" },
};

/** The root runway. */
export const PRODUCT_ROOT: RootRunway = parseRunway("root", {
  version: 3,
  project: "mezzora",
  product: { key: "mezzora", edition: { of: "commerce", version: "^1.0.0" } },
  surfaces: {
    console: {
      shell: "os/console@3",
      packages: ["@mezzora/console-ui"],
      host: "console.mezzora",
    },
    landing: { shell: "os/landing@1", content: "assets/landing", host: "mezzora" },
    ops: { contributes: "@mezzora/ops-ui" },
    till: { shell: "commerce/till@1", packages: ["@mezzora/till-ui"], host: "till.mezzora" },
  },
  mobile: { staff: STAFF_APP },
  environments: {
    production: { domains: { zone: "example.com" }, regions: ["ksa"] },
  },
});

/** The signing facts of the staff app. */
export const SIGNING: AppLinkSigning = {
  appleTeamIds: { example: "TEAM123456" },
  androidFingerprints: { "com.example.mezzora.staff": ["AA:BB"] },
};
