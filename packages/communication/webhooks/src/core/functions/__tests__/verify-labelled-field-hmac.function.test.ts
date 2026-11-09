/**
 * Stackra file contract:
 * Purpose: unit tests of `verifyLabelledFieldHmac` (the `labelled_field_hmac` scheme): a known HMAC-SHA256 vector over
 *          `label + value` pairs, the amount at the currency's decimals, verifies under any of several secrets; a
 *          tampered value, a wrong secret, a non-hex or missing signature and a missing field answer false; a 3-decimal
 *          currency signs three decimals (and JPY none); a recipe header named in another case still reads the
 *          lowercase header; an empty secret is a configuration error.
 * Boundary: test only; every signature is made here or fixed below from this file's own secret (no captured delivery).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0308 (rule 15); ADR 0220 (decision 2).
 */
import type { WebhookSchemeRecipe } from "@stackra/integrations";
import { describe, expect, it } from "@stackra/testing";

import { verifyLabelledFieldHmac } from "#core/functions/verify-labelled-field-hmac.function";

const SECRET = "sk_test_labelled_field_secret";

/** The signed fields and the amount's decimals, without the carrier. */
const SIGNED_FIELDS = {
  algorithm: "SHA-256",
  labelledFields: [
    { label: "amount", path: "amount" },
    { label: "currency", path: "currency" },
    { label: "id", path: "order.id" },
    { label: "status", path: "status" },
  ],
  currencyDecimals: { path: "amount", currencyPath: "currency" },
} as const satisfies WebhookSchemeRecipe;

const RECIPE: WebhookSchemeRecipe = { ...SIGNED_FIELDS, header: "x-signature" };

const PAYLOAD = { amount: 100, currency: "SAR", order: { id: "ord_1" }, status: "paid" };

/** HMAC-SHA256 under `SECRET` of `amount100.00currencySARidord_1statuspaid`, computed outside this test. */
const KNOWN_HMAC = "d49fd2606db60f62fba394bd4b2ae5faa6d1702d7c91c82f43616884028cedde";

/** The hex HMAC-SHA256 of `text` under `secret`. */
async function hmacHex(secret: string, text: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(text)));
  return Array.from(mac, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** A request carrying `payload` with `signature` in the `x-signature` header. */
const requestOf = (payload: unknown, signature: string) => ({
  headers: { "x-signature": signature },
  body: JSON.stringify(payload),
});

describe(verifyLabelledFieldHmac, () => {
  it("verifies the known vector, under any of several secrets", async () => {
    await expect(hmacHex(SECRET, "amount100.00currencySARidord_1statuspaid")).resolves.toBe(
      KNOWN_HMAC,
    );
    const request = requestOf(PAYLOAD, KNOWN_HMAC);
    await expect(verifyLabelledFieldHmac(request, RECIPE, [SECRET])).resolves.toBe(true);
    await expect(verifyLabelledFieldHmac(request, RECIPE, ["older", SECRET])).resolves.toBe(true);
    await expect(
      verifyLabelledFieldHmac({ ...request, body: JSON.stringify(PAYLOAD) }, RECIPE, ["other"]),
    ).resolves.toBe(false);
  });

  it("refuses a tampered value, a bad or missing signature and a body that is not JSON", async () => {
    const tampered = { ...PAYLOAD, amount: 101 };
    await expect(
      verifyLabelledFieldHmac(requestOf(tampered, KNOWN_HMAC), RECIPE, [SECRET]),
    ).resolves.toBe(false);
    await expect(verifyLabelledFieldHmac(requestOf(PAYLOAD, "zz"), RECIPE, [SECRET])).resolves.toBe(
      false,
    );
    await expect(
      verifyLabelledFieldHmac({ headers: {}, body: JSON.stringify(PAYLOAD) }, RECIPE, [SECRET]),
    ).resolves.toBe(false);
    await expect(
      verifyLabelledFieldHmac({ ...requestOf(PAYLOAD, KNOWN_HMAC), body: "not json" }, RECIPE, [
        SECRET,
      ]),
    ).resolves.toBe(false);
  });

  it("writes the amount with a 3-decimal currency's three decimals, and JPY's none", async () => {
    const kwd = { ...PAYLOAD, amount: 12.5, currency: "KWD" };
    const three = await hmacHex(SECRET, "amount12.500currencyKWDidord_1statuspaid");
    const two = await hmacHex(SECRET, "amount12.50currencyKWDidord_1statuspaid");
    await expect(verifyLabelledFieldHmac(requestOf(kwd, three), RECIPE, [SECRET])).resolves.toBe(
      true,
    );
    await expect(verifyLabelledFieldHmac(requestOf(kwd, two), RECIPE, [SECRET])).resolves.toBe(
      false,
    );
    const jpy = { ...PAYLOAD, amount: 1500, currency: "JPY" };
    const none = await hmacHex(SECRET, "amount1500currencyJPYidord_1statuspaid");
    await expect(verifyLabelledFieldHmac(requestOf(jpy, none), RECIPE, [SECRET])).resolves.toBe(
      true,
    );
    // More fraction digits than the currency holds signs nothing.
    const over = { ...PAYLOAD, amount: 12.505 };
    const signed = await hmacHex(SECRET, "amount12.505currencySARidord_1statuspaid");
    await expect(verifyLabelledFieldHmac(requestOf(over, signed), RECIPE, [SECRET])).resolves.toBe(
      false,
    );
  });

  it("refuses a body missing a signed field", async () => {
    const missing = { amount: 100, currency: "SAR", order: { id: "ord_1" } };
    const signed = await hmacHex(SECRET, "amount100.00currencySARidord_1status");
    await expect(
      verifyLabelledFieldHmac(requestOf(missing, signed), RECIPE, [SECRET]),
    ).resolves.toBe(false);
    await expect(
      verifyLabelledFieldHmac(requestOf(missing, KNOWN_HMAC), RECIPE, [SECRET]),
    ).resolves.toBe(false);
  });

  it("reads the lowercase header when the recipe names it in another case", async () => {
    const recipe = { ...RECIPE, header: "X-Signature" };
    await expect(
      verifyLabelledFieldHmac(requestOf(PAYLOAD, KNOWN_HMAC), recipe, [SECRET]),
    ).resolves.toBe(true);
    await expect(
      verifyLabelledFieldHmac(requestOf(PAYLOAD, KNOWN_HMAC.toUpperCase()), recipe, [SECRET]),
    ).resolves.toBe(true);
  });

  it("reads the signature from a query parameter, and refuses an empty secret", async () => {
    const recipe: WebhookSchemeRecipe = { ...SIGNED_FIELDS, query: "signature" };
    const request = {
      headers: {},
      query: { signature: KNOWN_HMAC },
      body: JSON.stringify(PAYLOAD),
    };
    await expect(verifyLabelledFieldHmac(request, recipe, [SECRET])).resolves.toBe(true);
    await expect(verifyLabelledFieldHmac(request, recipe, [""])).rejects.toThrow(TypeError);
  });
});
