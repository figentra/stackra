/**
 * Stackra file contract:
 * Purpose: unit tests of `emitPrefixes`: every public id prefix of the member's models and its hosted packages'
 *          models, sorted, each with the model key that mints it; no file when no model has a public id.
 * Boundary: test only; runs on the billing IR fixture and the manifest `buildManifest` derives from it.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0135 (rule 2); ADR 0294 (decision 20).
 */
import { describe, expect, it } from "@stackra/testing";

import { buildManifest } from "#core/functions/build-manifest.function";
import { emitPrefixes } from "#core/functions/emit-prefixes.function";
import { BILLING_IR } from "#core/__tests__/fixtures/billing-ir.fixture";
import { WEB_APP_IR } from "#core/__tests__/fixtures/web-app-ir.fixture";

describe("emitPrefixes", () => {
  it("lists each prefix with the model that mints it, hosted ones included", () => {
    expect(emitPrefixes(buildManifest(BILLING_IR).manifest)).toContain(
      [
        "export const PUBLIC_ID_PREFIXES = {",
        '  cus: "crm.customer",',
        '  inv: "billing.invoice",',
        '  seg: "segments.segment",',
        "} as const;",
      ].join("\n"),
    );
  });

  it("writes nothing when no model has a public id", () => {
    expect(emitPrefixes(buildManifest(WEB_APP_IR).manifest)).toBeUndefined();
  });
});
