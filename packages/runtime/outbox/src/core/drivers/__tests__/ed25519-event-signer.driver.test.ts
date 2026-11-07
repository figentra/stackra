/**
 * Stackra file contract:
 * Purpose: unit tests of `Ed25519EventSignerDriver`: it is an `EventSigner`; it signs `<id>.<timestamp>.<body>` with the
 *          key read by its secret name, names the current (first) key id in `v1a,<key id>,<base64>` and the timestamp
 *          in Unix seconds; it reads the secret once; a missing or malformed secret fails naming the secret, never a
 *          value, and a later bound secret is read again.
 * Boundary: test only; a fresh key pair and a map secret store.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0511 (decision 16); ADR 0173.
 */
import { describe, expect, it } from "@stackra/testing";

import { EventSigner } from "#contracts/index";
import { relayConfig, relayKeyPair, secretsOf } from "#core/__tests__/fixtures/relay-key.fixture";
import { Ed25519EventSignerDriver } from "#core/drivers/ed25519-event-signer.driver";
import { bytesOfBase64 } from "#core/functions/bytes-of-base64.function";

const NOON = new Date(Date.UTC(2026, 10, 6, 12));

const NAME = "STACKRA_EVENTS_SIGNING_KEY";

describe(Ed25519EventSignerDriver, () => {
  it("signs id, timestamp and body with the current key, named by its id", async () => {
    const current = await relayKeyPair("pay-dev-2026-11");
    const next = await relayKeyPair("pay-dev-2027-01");
    const config = relayConfig({ signingKey: NAME, keys: [current.key, next.key] });
    const secrets = secretsOf({ [NAME]: current.secret });
    const signer = new Ed25519EventSignerDriver(secrets, config);
    expect(signer).toBeInstanceOf(EventSigner);
    const headers = await signer.sign("dlv_1", NOON, '{"a":1}');
    expect(headers["webhook-id"]).toBe("dlv_1");
    expect(headers["webhook-timestamp"]).toBe(String(NOON.getTime() / 1000));
    const [scheme, keyId, signature = ""] = headers["webhook-signature"].split(",");
    expect([scheme, keyId]).toEqual(["v1a", "pay-dev-2026-11"]);
    const publicKey = await crypto.subtle.importKey(
      "raw",
      bytesOfBase64(current.key.publicKey) ?? new Uint8Array(),
      "Ed25519",
      false,
      ["verify"],
    );
    const content = new TextEncoder().encode(`dlv_1.${headers["webhook-timestamp"]}.{"a":1}`);
    await expect(
      crypto.subtle.verify(
        "Ed25519",
        publicKey,
        bytesOfBase64(signature) ?? new Uint8Array(),
        content,
      ),
    ).resolves.toBe(true);
    await signer.sign("dlv_2", NOON, "{}");
    expect(secrets.reads).toBe(1);
  });

  it("fails naming the secret, never its value, and reads a secret bound later", async () => {
    const pair = await relayKeyPair("pay-dev-2026-11");
    const config = relayConfig({ signingKey: NAME, keys: [pair.key] });
    const values: Record<string, string> = {};
    const signer = new Ed25519EventSignerDriver(secretsOf(values), config);
    await expect(signer.sign("dlv_1", NOON, "{}")).rejects.toThrow(`${NAME} is not bound`);
    values[NAME] = "not*base64";
    await expect(signer.sign("dlv_1", NOON, "{}")).rejects.toThrow(
      `${NAME} is not a base64url PKCS#8 Ed25519 key`,
    );
    values[NAME] = "AAAA";
    const failure = await signer.sign("dlv_1", NOON, "{}").catch((error: unknown) => error);
    expect(String(failure)).toContain(NAME);
    expect(String(failure)).not.toContain("AAAA");
    values[NAME] = pair.secret;
    await expect(signer.sign("dlv_1", NOON, "{}")).resolves.toMatchObject({
      "webhook-id": "dlv_1",
    });
  });

  it("refuses to sign without a key id", async () => {
    const signer = new Ed25519EventSignerDriver(secretsOf({}), relayConfig({ signingKey: NAME }));
    await expect(signer.sign("dlv_1", NOON, "{}")).rejects.toThrow("no signing key id");
  });
});
