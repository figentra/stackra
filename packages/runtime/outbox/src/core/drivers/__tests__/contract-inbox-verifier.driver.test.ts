/**
 * Stackra file contract:
 * Purpose: the verification table of `ContractInboxVerifierDriver`, each request signed by the real `Ed25519EventSignerDriver`: a
 *          good signature verifies as the key's producer service; unsigned, malformed, wrong signature, stale, future,
 *          unknown key, a key of another environment, another producer's key under this producer's key id and a
 *          tampered body are refused with their reason; a rotated next key and a raw byte body verify; a key of
 *          another pinned producer verifies as that producer, whatever the body claims.
 * Boundary: test only; fresh key pairs, a map secret store and a fixed clock.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0511 (decisions 16 and 18; AC-003, AC-007, AC-008).
 */
import type { Clock } from "@stackra/contracts";
import { beforeAll, describe, expect, it } from "@stackra/testing";

import { InboxVerifier } from "#contracts/index";
import type { ProducerKeys, RelayKey, SignedHeaders } from "#contracts/index";
import {
  inboxConfig,
  relayConfig,
  relayKeyPair,
  secretsOf,
} from "#core/__tests__/fixtures/relay-key.fixture";
import type { RelayKeyPair } from "#core/__tests__/fixtures/relay-key.fixture";
import { ContractInboxVerifierDriver } from "#core/drivers/contract-inbox-verifier.driver";
import { Ed25519EventSignerDriver } from "#core/drivers/ed25519-event-signer.driver";

const NOON = new Date(Date.UTC(2026, 10, 6, 12));

const clock = { now: () => new Date(NOON) } as Clock;

const BODY = '{"id":"evt_1","producer":"pay"}';

let pay: RelayKeyPair;
let payNext: RelayKeyPair;
let billing: RelayKeyPair;
let stranger: RelayKeyPair;
let keys: ProducerKeys;

beforeAll(async () => {
  pay = await relayKeyPair("pay-dev-1");
  payNext = await relayKeyPair("pay-dev-2");
  billing = await relayKeyPair("billing-dev-1");
  stranger = await relayKeyPair("stranger-dev-1");
  const prod = await relayKeyPair("pay-prod-1");
  keys = {
    pay: { dev: [pay.key, payNext.key], prod: [prod.key] },
    billing: { dev: [billing.key] },
  };
});

/** Headers signed with `pair`'s private key under `key`'s id, at `at`. */
async function signed(
  pair: RelayKeyPair,
  at: Date = NOON,
  body: string = BODY,
  key: RelayKey = pair.key,
): Promise<SignedHeaders> {
  const signer = new Ed25519EventSignerDriver(
    secretsOf({ KEY: pair.secret }),
    relayConfig({ signingKey: "KEY", keys: [key] }),
  );
  return signer.sign("dlv_1", at, body);
}

/** The verdict of the dev verifier on `headers` and `body`. */
function verify(
  headers: Readonly<Record<string, string | undefined>>,
  body: string | Uint8Array = BODY,
) {
  return new ContractInboxVerifierDriver(inboxConfig(keys), clock).verify(headers, body);
}

describe(ContractInboxVerifierDriver, () => {
  it("is an InboxVerifier", () => {
    expect(new ContractInboxVerifierDriver(inboxConfig({}), clock)).toBeInstanceOf(InboxVerifier);
  });

  it("verifies a good signature as the key's producer service", async () => {
    await expect(verify(await signed(pay))).resolves.toEqual({
      verified: true,
      sender: { service: "pay", keyId: "pay-dev-1" },
    });
  });

  it("accepts the rotated next key and a raw byte body", async () => {
    await expect(
      verify(await signed(payNext), new TextEncoder().encode(BODY)),
    ).resolves.toMatchObject({ verified: true, sender: { service: "pay", keyId: "pay-dev-2" } });
  });

  it("verifies another pinned producer's key as that producer, whatever the body claims", async () => {
    await expect(verify(await signed(billing))).resolves.toMatchObject({
      sender: { service: "billing" },
    });
  });

  it("passes when one of several signatures verifies", async () => {
    const good = await signed(pay);
    const bad = await signed(stranger, NOON, BODY, pay.key);
    await expect(
      verify({
        ...good,
        "webhook-signature": `${bad["webhook-signature"]} ${good["webhook-signature"]}`,
      }),
    ).resolves.toMatchObject({ verified: true });
  });

  it.each([
    ["missing_headers", {}],
    ["missing_headers", { "webhook-id": "dlv_1", "webhook-timestamp": "1" }],
    [
      "malformed_headers",
      { "webhook-id": "dlv_1", "webhook-timestamp": "1", "webhook-signature": "v1,abc" },
    ],
    [
      "malformed_headers",
      { "webhook-id": "dlv 1", "webhook-timestamp": "1", "webhook-signature": "v1a,k,AAAA" },
    ],
    [
      "malformed_headers",
      { "webhook-id": "dlv_1", "webhook-timestamp": "soon", "webhook-signature": "v1a,k,AAAA" },
    ],
  ])("refuses %s headers", async (reason, headers) => {
    await expect(verify(headers)).resolves.toEqual({ verified: false, reason });
  });

  it("refuses a stale and a future timestamp", async () => {
    await expect(verify(await signed(pay, new Date(NOON.getTime() - 301_000)))).resolves.toEqual({
      verified: false,
      reason: "stale",
    });
    await expect(verify(await signed(pay, new Date(NOON.getTime() + 301_000)))).resolves.toEqual({
      verified: false,
      reason: "future",
    });
    await expect(
      verify(await signed(pay, new Date(NOON.getTime() - 299_000))),
    ).resolves.toMatchObject({ verified: true });
  });

  it("refuses a key no pinned producer lists, and a key of another environment", async () => {
    await expect(verify(await signed(stranger))).resolves.toEqual({
      verified: false,
      reason: "unknown_key",
    });
    const prodVerifier = new ContractInboxVerifierDriver(inboxConfig(keys, "prod"), clock);
    await expect(prodVerifier.verify(await signed(pay), BODY)).resolves.toEqual({
      verified: false,
      reason: "unknown_key",
    });
  });

  it("refuses another key signing under a listed key id, and a tampered body", async () => {
    await expect(verify(await signed(stranger, NOON, BODY, pay.key))).resolves.toEqual({
      verified: false,
      reason: "bad_signature",
    });
    await expect(verify(await signed(pay), BODY.replace("evt_1", "evt_2"))).resolves.toEqual({
      verified: false,
      reason: "bad_signature",
    });
  });
});
