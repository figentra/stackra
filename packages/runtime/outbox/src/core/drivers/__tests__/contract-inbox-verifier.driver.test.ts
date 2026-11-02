/**
 * Stackra file contract:
 * Purpose: tests of the cross-app signature pair: `Ed25519EventSignerDriver` signs a delivery and
 *          `ContractInboxVerifierDriver` verifies it against the keys a pinned producer lists, naming that producer;
 *          the refusal table (missing headers, stale or future, unknown key, another environment's key, a tampered
 *          body, another producer's key under the same id) and a rotation; the signer refuses without a key.
 * Boundary: test only; real Web Crypto Ed25519 keys made per run, no network.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0511 (decisions 11, 16 and 18).
 */
import { afterEach, describe, expect, it } from "@stackra/testing";

import type { CrossAppConfig } from "#config/cross-app.config";
import { PRODUCER_KEYS } from "#core/constants/producer-keys.constant";
import { ContractInboxVerifierDriver } from "#core/drivers/contract-inbox-verifier.driver";
import { Ed25519EventSignerDriver } from "#core/drivers/ed25519-event-signer.driver";
import { CrossAppKeyMissingError } from "#core/errors/cross-app-key-missing.error";
import { encodeBase64 } from "#core/functions/encode-base64.function";
import { registerProducerKeys } from "#core/functions/register-producer-keys.function";

const NOON = new Date(Date.UTC(2026, 10, 2, 12));

const BODY = '{"id":"evt_1","type":"payments.payment.captured.v1"}';

/** base64url text of `bytes`, unpadded. */
function url(bytes: ArrayBuffer): string {
  return encodeBase64(new Uint8Array(bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

/** A fresh Ed25519 pair: the private key as base64url PKCS #8, the public key as base64url raw bytes. */
async function keyPair(): Promise<{ privateKey: string; publicKey: string }> {
  const pair = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, [
    "sign",
    "verify",
  ])) as CryptoKeyPair;
  return {
    privateKey: url(await crypto.subtle.exportKey("pkcs8", pair.privateKey)),
    publicKey: url(await crypto.subtle.exportKey("raw", pair.publicKey)),
  };
}

/** A signer with `privateKey` under `keyId`. */
function signerOf(privateKey: string, keyId: string): Ed25519EventSignerDriver {
  return new Ed25519EventSignerDriver({ signingKey: privateKey, keyId } as CrossAppConfig);
}

/** A verifier running in `environment`. */
function verifierIn(environment = "dev"): ContractInboxVerifierDriver {
  return new ContractInboxVerifierDriver({ environment } as CrossAppConfig);
}

afterEach(() => {
  PRODUCER_KEYS.clear();
});

describe(ContractInboxVerifierDriver, () => {
  // @covers sta-1910:FR-002 @covers sta-1910:FR-013 @covers sta-1910:FR-017 @covers sta-1910:AC-007
  it("verifies a delivery signed with a key the pinned contract lists, naming that contract's producer", async () => {
    const pay = await keyPair();
    registerProducerKeys({ payments: { dev: [{ id: "pay-dev-1", publicKey: pay.publicKey }] } });
    const headers = await signerOf(pay.privateKey, "pay-dev-1").sign("dlv_1", NOON, BODY);
    expect(headers["webhook-signature"]).toMatch(/^v1a,pay-dev-1,/);
    await expect(verifierIn().verify(new Headers(headers), BODY, NOON)).resolves.toEqual({
      verified: true,
      producer: "payments",
      keyId: "pay-dev-1",
    });
  });

  // @covers sta-1910:FR-005 @covers sta-1910:FR-006 @covers sta-1910:AC-003 @covers sta-1910:AC-008 @covers sta-1910:SC-002
  it("refuses missing headers, a stale or future time, an unknown or foreign key and a tampered body", async () => {
    const pay = await keyPair();
    const other = await keyPair();
    registerProducerKeys({
      payments: {
        dev: [{ id: "pay-dev-1", publicKey: pay.publicKey }],
        staging: [{ id: "pay-stg-1", publicKey: pay.publicKey }],
      },
      invoicing: { dev: [{ id: "shared-id", publicKey: other.publicKey }] },
    });
    const signed = new Headers(
      await signerOf(pay.privateKey, "pay-dev-1").sign("dlv_1", NOON, BODY),
    );
    const verifier = verifierIn();
    const without = new Headers(signed);
    without.delete("webhook-signature");
    await expect(verifier.verify(without, BODY, NOON)).resolves.toEqual({
      verified: false,
      reason: "missing_headers",
    });
    await expect(
      verifier.verify(signed, BODY, new Date(NOON.getTime() + 6 * 60_000)),
    ).resolves.toEqual({
      verified: false,
      reason: "stale",
    });
    await expect(
      verifier.verify(signed, BODY, new Date(NOON.getTime() - 6 * 60_000)),
    ).resolves.toEqual({
      verified: false,
      reason: "stale",
    });
    await expect(verifier.verify(signed, `${BODY} `, NOON)).resolves.toEqual({
      verified: false,
      reason: "bad_signature",
    });
    const staging = new Headers(
      await signerOf(pay.privateKey, "pay-stg-1").sign("dlv_1", NOON, BODY),
    );
    await expect(verifier.verify(staging, BODY, NOON)).resolves.toEqual({
      verified: false,
      reason: "unknown_key",
    });
    const unlisted = new Headers(
      await signerOf((await keyPair()).privateKey, "nobody-1").sign("dlv_1", NOON, BODY),
    );
    await expect(verifier.verify(unlisted, BODY, NOON)).resolves.toEqual({
      verified: false,
      reason: "unknown_key",
    });
    const impostor = new Headers(
      await signerOf(pay.privateKey, "shared-id").sign("dlv_1", NOON, BODY),
    );
    await expect(verifier.verify(impostor, BODY, NOON)).resolves.toEqual({
      verified: false,
      reason: "bad_signature",
    });
  });

  // @covers sta-1910:FR-019
  it("accepts either key a rotation lists", async () => {
    const current = await keyPair();
    const next = await keyPair();
    registerProducerKeys({
      payments: {
        dev: [
          { id: "pay-dev-1", publicKey: current.publicKey },
          { id: "pay-dev-2", publicKey: next.publicKey },
        ],
      },
    });
    const verifier = verifierIn();
    for (const [key, id] of [
      [current, "pay-dev-1"],
      [next, "pay-dev-2"],
    ] as const) {
      const headers = new Headers(await signerOf(key.privateKey, id).sign("dlv_1", NOON, BODY));
      await expect(verifier.verify(headers, BODY, NOON)).resolves.toMatchObject({
        verified: true,
        keyId: id,
      });
    }
  });

  it("counts a malformed signature value as unverified, never as an error", async () => {
    const pay = await keyPair();
    registerProducerKeys({ payments: { dev: [{ id: "pay-dev-1", publicKey: pay.publicKey }] } });
    const headers = new Headers({
      "webhook-id": "dlv_1",
      "webhook-timestamp": String(NOON.getTime() / 1000),
      "webhook-signature": "v1a,pay-dev-1,AAAA v1,whatever",
    });
    await expect(verifierIn().verify(headers, BODY, NOON)).resolves.toEqual({
      verified: false,
      reason: "bad_signature",
    });
  });
});

describe(Ed25519EventSignerDriver, () => {
  it("refuses to sign without a key or a key id", async () => {
    await expect(signerOf("", "pay-dev-1").sign("dlv_1", NOON, BODY)).rejects.toBeInstanceOf(
      CrossAppKeyMissingError,
    );
    const pay = await keyPair();
    await expect(signerOf(pay.privateKey, "").sign("dlv_1", NOON, BODY)).rejects.toBeInstanceOf(
      CrossAppKeyMissingError,
    );
  });
});
