/**
 * Stackra file contract:
 * Purpose: unit tests of `clientRuntimes`: web, PWA and desktop render on `browser`, iOS and Android on `native`,
 *          browser first; a member that is not an app renders on none.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0249; ADR 0295 (decisions 7 and 8).
 */
import { describe, expect, it } from "@stackra/testing";

import { clientRuntimes } from "#core/functions/client-runtimes.function";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";
import { WEB_APP_IR } from "#core/__tests__/fixtures/web-app-ir.fixture";

describe("clientRuntimes", () => {
  it("maps an app's targets to its runtimes, browser first", () => {
    expect(clientRuntimes({ ...WEB_APP_IR, targets: ["android", "web"] })).toEqual([
      "browser",
      "native",
    ]);
    expect(clientRuntimes({ ...WEB_APP_IR, targets: ["desktop", "pwa"] })).toEqual(["browser"]);
    expect(clientRuntimes({ ...WEB_APP_IR, targets: ["ios"] })).toEqual(["native"]);
  });

  it("gives a member that is not an app no runtime", () => {
    expect(clientRuntimes(COMMERCE_IR)).toEqual([]);
  });
});
