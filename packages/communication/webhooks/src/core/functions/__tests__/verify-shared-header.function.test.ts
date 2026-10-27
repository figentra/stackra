/**
 * Stackra file contract:
 * Purpose: unit tests of `verifySharedHeader` (the `shared_header` scheme): a Tabby-shaped delivery whose registered
 *          header holds one of the secrets verifies; a different, empty or missing value, and a recipe with no header,
 *          answer false.
 * Boundary: test only; the fixture is shaped after Tabby's public webhook documentation (the merchant registers a
 *           header name and value): certification pending (owner decision D3). Web Crypto runs for real.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0308 (rule 15); STA-1357.
 */
import { describe, expect, it } from "@stackra/testing";

import { verifySharedHeader } from "#core/functions/verify-shared-header.function";

const SECRET = "test-tabby-shared-value";
const RECIPE = { header: "x-webhook-auth" } as const;

describe(verifySharedHeader, () => {
  it("verifies the header the merchant registered", async () => {
    await expect(
      verifySharedHeader({ headers: { "x-webhook-auth": SECRET } }, RECIPE, ["rotated", SECRET]),
    ).resolves.toBe(true);
  });

  it("refuses a different, empty or missing value and a recipe with no header", async () => {
    await expect(
      verifySharedHeader({ headers: { "x-webhook-auth": `${SECRET}-` } }, RECIPE, [SECRET]),
    ).resolves.toBe(false);
    await expect(
      verifySharedHeader({ headers: { "x-webhook-auth": "" } }, RECIPE, [SECRET]),
    ).resolves.toBe(false);
    await expect(verifySharedHeader({ headers: {} }, RECIPE, [SECRET])).resolves.toBe(false);
    await expect(
      verifySharedHeader({ headers: { "x-webhook-auth": SECRET } }, {}, [SECRET]),
    ).resolves.toBe(false);
  });
});
