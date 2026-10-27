/**
 * Stackra file contract:
 * Purpose: unit tests of `verifyKeyedFieldDigest` (the `keyed_field_digest` scheme): a Fawry-shaped V2 notification
 *          whose `messageSignature` is the SHA-256 hex of its ordered fields (amounts with two decimals) followed by
 *          the secure key verifies; a changed amount, a wrong key, a non-hex or missing signature, a field that is an
 *          object and a recipe with no algorithm answer false.
 * Boundary: test only; the field list and payload shape follow Fawry's public server notification documentation and
 *           every digest is made here (no captured delivery, no vendor value quoted): certification pending (owner
 *           decision D3).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0308 (rule 15); STA-1357.
 */
import type { WebhookSchemeRecipe } from "@stackra/integrations";
import { describe, expect, it } from "@stackra/testing";

import { verifyKeyedFieldDigest } from "#core/functions/verify-keyed-field-digest.function";

const SECURE_KEY = "test-fawry-secure-key";

const RECIPE: WebhookSchemeRecipe = {
  path: "messageSignature",
  algorithm: "SHA-256",
  fields: [
    "fawryRefNumber",
    "merchantRefNumber",
    "paymentAmount",
    "orderAmount",
    "orderStatus",
    "paymentMethod",
    "paymentRefNumber",
  ],
  decimals: { paymentAmount: 2, orderAmount: 2 },
};

const FIELDS = {
  requestId: "req-0001",
  fawryRefNumber: "9990001",
  merchantRefNumber: "ord-0001",
  paymentAmount: 100,
  orderAmount: 100,
  orderStatus: "PAID",
  paymentMethod: "PayAtFawry",
  paymentRefNumber: "pay-0001",
};
const SIGNED = "9990001ord-0001100.00100.00PAIDPayAtFawrypay-0001";

/** The SHA-256 hex of `text`. */
async function sha256Hex(text: string): Promise<string> {
  const digest = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)),
  );
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** A notification body with `fields` and `signature`. */
const bodyOf = (fields: object, signature: unknown) =>
  JSON.stringify({ ...fields, messageSignature: signature });

describe(verifyKeyedFieldDigest, () => {
  it("verifies the keyed digest of the ordered fields, amounts with two decimals", async () => {
    const signature = await sha256Hex(`${SIGNED}${SECURE_KEY}`);
    const request = { headers: {}, body: bodyOf(FIELDS, signature) };
    await expect(verifyKeyedFieldDigest(request, RECIPE, [SECURE_KEY])).resolves.toBe(true);
    await expect(verifyKeyedFieldDigest(request, RECIPE, ["older", SECURE_KEY])).resolves.toBe(
      true,
    );
  });

  it("refuses a changed amount, a wrong key, a bad signature, an object field and no algorithm", async () => {
    const signature = await sha256Hex(`${SIGNED}${SECURE_KEY}`);
    const changed = { headers: {}, body: bodyOf({ ...FIELDS, paymentAmount: 100.01 }, signature) };
    await expect(verifyKeyedFieldDigest(changed, RECIPE, [SECURE_KEY])).resolves.toBe(false);
    const good = { headers: {}, body: bodyOf(FIELDS, signature) };
    await expect(verifyKeyedFieldDigest(good, RECIPE, ["other"])).resolves.toBe(false);
    await expect(
      verifyKeyedFieldDigest({ headers: {}, body: bodyOf(FIELDS, "nothex") }, RECIPE, [SECURE_KEY]),
    ).resolves.toBe(false);
    await expect(
      verifyKeyedFieldDigest({ headers: {}, body: bodyOf(FIELDS, undefined) }, RECIPE, [
        SECURE_KEY,
      ]),
    ).resolves.toBe(false);
    const nested = {
      headers: {},
      body: bodyOf({ ...FIELDS, orderStatus: { code: 1 } }, signature),
    };
    await expect(verifyKeyedFieldDigest(nested, RECIPE, [SECURE_KEY])).resolves.toBe(false);
    const { algorithm: _algorithm, ...noAlgorithm } = RECIPE;
    await expect(verifyKeyedFieldDigest(good, noAlgorithm, [SECURE_KEY])).resolves.toBe(false);
  });
});
