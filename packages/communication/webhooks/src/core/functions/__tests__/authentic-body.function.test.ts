/**
 * Stackra file contract:
 * Purpose: unit tests of `authenticBody`: it picks the verifier by `webhooks.scheme` and answers the text to parse:
 *          the raw body for Standard Webhooks and the shared-header and body-token schemes, the plaintext for
 *          `aes_gcm_body`, and `undefined` when the check fails or an `hmac` scheme has no recipe.
 * Boundary: test only; each verifier's own cases are in its test file. Web Crypto runs for real.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0308 (rule 15); STA-1357.
 */
import type { IntegrationWebhooks } from "@stackra/integrations";
import { describe, expect, it } from "@stackra/testing";

import { SignatureScheme } from "#core/enums/signature-scheme.enum";
import { authenticBody } from "#core/functions/authentic-body.function";
import { signWebhook } from "#core/functions/sign-webhook.function";

const SECRET = "test-dispatch-secret";
const NOW = new Date("2026-10-27T09:00:00Z");
const BODY = '{"type":"payment.paid","secret_token":"test-dispatch-secret"}';

/** The bytes of a hex text. */
const bytes = (hex: string) =>
  new Uint8Array(hex.match(/../g)?.map((pair) => Number.parseInt(pair, 16)) ?? []);
/** The hex of `data`. */
const toHex = (data: Uint8Array) =>
  Array.from(data, (byte) => byte.toString(16).padStart(2, "0")).join("");

/** The `webhooks` option of `scheme` with `extra` fields. */
const webhooksOf = (scheme: SignatureScheme, extra: Partial<IntegrationWebhooks> = {}) => ({
  scheme,
  secret: "{webhookSecret}",
  eventType: { path: "type" },
  ...extra,
});

describe(authenticBody, () => {
  it("answers the raw body of a Standard Webhooks delivery that verifies", async () => {
    const headers = {
      ...(await signWebhook({ id: "msg_1", timestamp: NOW, body: BODY }, [SECRET])),
    };
    const webhooks = webhooksOf(SignatureScheme.StandardWebhooks);
    await expect(authenticBody({ headers, body: BODY }, webhooks, [SECRET], NOW)).resolves.toBe(
      BODY,
    );
    await expect(
      authenticBody({ headers, body: BODY }, webhooks, ["other"], NOW),
    ).resolves.toBeUndefined();
  });

  it("routes the shared-header and body-token schemes to their verifiers", async () => {
    const shared = webhooksOf(SignatureScheme.SharedHeader, { recipe: { header: "x-auth" } });
    await expect(
      authenticBody({ headers: { "x-auth": SECRET }, body: BODY }, shared, [SECRET], NOW),
    ).resolves.toBe(BODY);
    await expect(
      authenticBody({ headers: {}, body: BODY }, shared, [SECRET], NOW),
    ).resolves.toBeUndefined();
    const token = webhooksOf(SignatureScheme.BodyToken, { recipe: { path: "secret_token" } });
    await expect(authenticBody({ headers: {}, body: BODY }, token, [SECRET], NOW)).resolves.toBe(
      BODY,
    );
  });

  it("answers the plaintext of an AES-GCM body", async () => {
    const key = "000102030405060708090a0b0c0d0e0f";
    const iv = "000000000000000000000001";
    const imported = await crypto.subtle.importKey("raw", bytes(key), { name: "AES-GCM" }, false, [
      "encrypt",
    ]);
    const sealed = new Uint8Array(
      await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: bytes(iv) },
        imported,
        new TextEncoder().encode(BODY),
      ),
    );
    const webhooks = webhooksOf(SignatureScheme.AesGcmBody, {
      recipe: { ivHeader: "x-iv", tagHeader: "x-tag" },
    });
    const request = {
      headers: { "x-iv": iv, "x-tag": toHex(sealed.slice(-16)) },
      body: toHex(sealed.slice(0, -16)),
    };
    await expect(authenticBody(request, webhooks, [key], NOW)).resolves.toBe(BODY);
  });

  it("answers undefined for an hmac scheme with no recipe", async () => {
    await expect(
      authenticBody({ headers: {}, body: BODY }, webhooksOf(SignatureScheme.Hmac), [SECRET], NOW),
    ).resolves.toBeUndefined();
  });
});
