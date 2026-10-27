/**
 * Stackra file contract:
 * Purpose: unit tests of `verifyBodyToken` (the `body_token` scheme): a Moyasar-shaped payload whose `secret_token`
 *          equals one of the secrets verifies; a wrong, missing or non-string token and a body that is not JSON answer
 *          false; a token in a header also verifies when the recipe names one.
 * Boundary: test only; the fixture is shaped after Moyasar's public webhook documentation (no captured delivery, no
 *           vendor value quoted): certification pending (owner decision D3). Web Crypto runs for real.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0308 (rule 15); STA-1357.
 */
import type { WebhookSchemeRecipe } from "@stackra/integrations";
import { describe, expect, it } from "@stackra/testing";

import { verifyBodyToken } from "#core/functions/verify-body-token.function";

const SECRET = "test-moyasar-secret-token";
const RECIPE: WebhookSchemeRecipe = { path: "secret_token" };

/** A Moyasar-shaped `payment_paid` delivery carrying `token`. */
const bodyWith = (token: unknown) =>
  JSON.stringify({
    id: "evt_0001",
    type: "payment_paid",
    created_at: "2026-10-27T09:00:00.000Z",
    secret_token: token,
    account_name: null,
    live: false,
    data: { id: "pay_0001", status: "paid", amount: 10_000, currency: "SAR" },
  });

describe(verifyBodyToken, () => {
  it("verifies a body whose token equals one of the secrets", async () => {
    const request = { headers: {}, body: bodyWith(SECRET) };
    await expect(verifyBodyToken(request, RECIPE, [SECRET])).resolves.toBe(true);
    await expect(verifyBodyToken(request, RECIPE, ["older-token", SECRET])).resolves.toBe(true);
  });

  it("refuses a wrong, missing or non-string token and a body that is not JSON", async () => {
    await expect(
      verifyBodyToken({ headers: {}, body: bodyWith(`${SECRET}x`) }, RECIPE, [SECRET]),
    ).resolves.toBe(false);
    await expect(
      verifyBodyToken({ headers: {}, body: bodyWith(undefined) }, RECIPE, [SECRET]),
    ).resolves.toBe(false);
    await expect(
      verifyBodyToken({ headers: {}, body: bodyWith(12_345) }, RECIPE, [SECRET]),
    ).resolves.toBe(false);
    await expect(
      verifyBodyToken({ headers: {}, body: "not json" }, RECIPE, [SECRET]),
    ).resolves.toBe(false);
  });

  it("reads the token from a header when the recipe names one", async () => {
    const request = { headers: { "x-webhook-token": SECRET }, body: "{}" };
    await expect(verifyBodyToken(request, { header: "x-webhook-token" }, [SECRET])).resolves.toBe(
      true,
    );
  });
});
