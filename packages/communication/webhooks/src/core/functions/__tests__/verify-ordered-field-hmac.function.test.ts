/**
 * Stackra file contract:
 * Purpose: unit tests of `verifyOrderedFieldHmac` (the `ordered_field_hmac` scheme): a Paymob-shaped transaction
 *          callback signed HMAC-SHA512 over its ordered `obj.*` fields, the hex in `?hmac=`, verifies under any of
 *          several secrets; a changed field, a wrong secret, a non-hex or missing signature and a body that is not
 *          JSON answer false; booleans join as `true`/`false`; an empty secret is a configuration error.
 * Boundary: test only; the field list and payload shape follow Paymob's public HMAC documentation and every signature
 *           is made here (no captured delivery, no vendor value quoted): certification pending (owner decision D3).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0308 (rule 15); STA-1357.
 */
import type { WebhookSchemeRecipe } from "@stackra/integrations";
import { describe, expect, it } from "@stackra/testing";

import { verifyOrderedFieldHmac } from "#core/functions/verify-ordered-field-hmac.function";

const SECRET = "test-paymob-hmac-secret";

const RECIPE: WebhookSchemeRecipe = {
  query: "hmac",
  algorithm: "SHA-512",
  fields: [
    "obj.amount_cents",
    "obj.created_at",
    "obj.currency",
    "obj.error_occured",
    "obj.has_parent_transaction",
    "obj.id",
    "obj.integration_id",
    "obj.is_3d_secure",
    "obj.is_auth",
    "obj.is_capture",
    "obj.is_refunded",
    "obj.is_standalone_payment",
    "obj.is_voided",
    "obj.order.id",
    "obj.owner",
    "obj.pending",
    "obj.source_data.pan",
    "obj.source_data.sub_type",
    "obj.source_data.type",
    "obj.success",
  ],
};

const OBJ = {
  amount_cents: 10_000,
  created_at: "2026-10-27T09:00:00.000000",
  currency: "EGP",
  error_occured: false,
  has_parent_transaction: false,
  id: 100_001,
  integration_id: 4001,
  is_3d_secure: true,
  is_auth: false,
  is_capture: false,
  is_refunded: false,
  is_standalone_payment: true,
  is_voided: false,
  order: { id: 200_001 },
  owner: 300_001,
  pending: false,
  source_data: { pan: "2346", sub_type: "MasterCard", type: "card" },
  success: true,
};
const BODY = JSON.stringify({ type: "TRANSACTION", obj: OBJ });
const SIGNED =
  "100002026-10-27T09:00:00.000000EGPfalsefalse1000014001truefalsefalsefalsetruefalse200001300001false2346MasterCardcardtrue";

/** The hex HMAC-SHA512 of `text` under `secret`. */
async function hmacHex(secret: string, text: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(text)));
  return Array.from(mac, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

describe(verifyOrderedFieldHmac, () => {
  it("verifies the HMAC over the ordered fields, under any of several secrets", async () => {
    const request = { headers: {}, query: { hmac: await hmacHex(SECRET, SIGNED) }, body: BODY };
    await expect(verifyOrderedFieldHmac(request, RECIPE, [SECRET])).resolves.toBe(true);
    await expect(verifyOrderedFieldHmac(request, RECIPE, ["older", SECRET])).resolves.toBe(true);
  });

  it("refuses a changed field, a wrong secret, a bad signature and a body that is not JSON", async () => {
    const hmac = await hmacHex(SECRET, SIGNED);
    const changed = JSON.stringify({ type: "TRANSACTION", obj: { ...OBJ, amount_cents: 1 } });
    await expect(
      verifyOrderedFieldHmac({ headers: {}, query: { hmac }, body: changed }, RECIPE, [SECRET]),
    ).resolves.toBe(false);
    await expect(
      verifyOrderedFieldHmac({ headers: {}, query: { hmac }, body: BODY }, RECIPE, ["other"]),
    ).resolves.toBe(false);
    await expect(
      verifyOrderedFieldHmac({ headers: {}, query: { hmac: "zz" }, body: BODY }, RECIPE, [SECRET]),
    ).resolves.toBe(false);
    await expect(
      verifyOrderedFieldHmac({ headers: {}, body: BODY }, RECIPE, [SECRET]),
    ).resolves.toBe(false);
    await expect(
      verifyOrderedFieldHmac({ headers: {}, query: { hmac }, body: "not json" }, RECIPE, [SECRET]),
    ).resolves.toBe(false);
  });

  it("refuses an empty secret as a configuration error", async () => {
    const request = { headers: {}, query: { hmac: await hmacHex(SECRET, SIGNED) }, body: BODY };
    await expect(verifyOrderedFieldHmac(request, RECIPE, [""])).rejects.toThrow(TypeError);
  });
});
