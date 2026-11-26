/**
 * Stackra file contract:
 * Purpose: unit tests of `HttpDevicePairingDriver` against a fake hub that keeps the protocol: `begin` posts the install
 *          id and a fresh pairing secret in the body with no bearer token and decodes the code; `check` polls the
 *          state with no secret in the URL and, once paired, picks the token up once with the secret in the body,
 *          keeps it in `secrets` (where the credential driver reads it) without returning it and drops the secret;
 *          `forget` drops both. The negatives: a status answer never yields a credential (even one that carries a
 *          token), a pickup before the credential is ready reads as pending, and a pickup with a wrong or spent
 *          secret is refused; a malformed answer throws.
 * Boundary: test only; the global `fetch` is stubbed and restored, the storage is @stackra/storage's memory driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0361 (decision 7); ADR 0235 (decision 1, as amended).
 */
import { buildConfig } from "@stackra/config";
import { isRefusal } from "@stackra/errors";
import { MemoryStorageDriver } from "@stackra/storage";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";
import { ZodError } from "zod";

import { DevicesConfig } from "#config/devices.config";
import { DevicePairing } from "#contracts/ports/device-pairing.port";
import { DEVICE_STORAGE_KEYS } from "#core/constants/device-storage-keys.constant";
import { HttpDevicePairingDriver } from "#core/drivers/http-device-pairing.driver";
import { StoredDeviceCredentialDriver } from "#core/drivers/stored-device-credential.driver";
import { StoredDeviceIdentityDriver } from "#core/drivers/stored-device-identity.driver";
import { DeviceHubRefusedError } from "#core/errors/device-hub-refused.error";

/** The driver over a hub at `https://hub.test`, its credential and identity over `storage`. */
function driver(storage: MemoryStorageDriver): HttpDevicePairingDriver {
  return new HttpDevicePairingDriver(
    buildConfig(DevicesConfig, { values: { hubUrl: "https://hub.test", attempts: 1 } }),
    new StoredDeviceCredentialDriver(storage),
    new StoredDeviceIdentityDriver(storage),
    storage,
  );
}

/** SHA-256 hex, as the hub stores the secret. */
const sha = async (value: string) =>
  Array.from(
    new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))),
    (byte) => byte.toString(16).padStart(2, "0"),
  ).join("");

/** A request the fake hub saw, its body read once. */
interface Seen {
  readonly method: string;
  readonly url: URL;
  readonly authorization: string | null;
  readonly idempotencyKey: string | null;
  readonly body: Record<string, unknown> | null;
}

/**
 * A fake hub that keeps the pairing protocol: it stores the secret's hash only, answers the status without a
 * credential (or, with `leak`, with a token a bad hub might send), refuses a pickup before `claim()`, until `issue()`,
 * with a wrong secret, or a second time.
 */
function fakeHub(options: { leak?: boolean } = {}) {
  const seen: Seen[] = [];
  let secretHash: string | null = null;
  let claimed = false;
  let issued = false;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (request: Request) => {
      const url = new URL(request.url);
      const text = await request.text();
      const body = text === "" ? null : (JSON.parse(text) as Record<string, unknown>);
      seen.push({
        method: request.method,
        url,
        authorization: request.headers.get("authorization"),
        idempotencyKey: request.headers.get("idempotency-key"),
        body,
      });
      if (request.method === "POST" && url.pathname === "/device-pairings") {
        secretHash = await sha(String(body?.["secret"]));
        return Response.json({
          pairingId: "pr_1",
          code: "K7Q4M2XR",
          expiresAt: "2026-10-25T10:10:00Z",
        });
      }
      if (request.method === "GET" && url.pathname === "/device-pairings/pr_1")
        return Response.json({
          state: claimed ? "paired" : "pending",
          deviceId: claimed ? "dev_1" : null,
          ...(options.leak ? { token: "leaked-token" } : {}),
        });
      if (request.method === "POST" && url.pathname === "/device-pairings/pr_1/pickup") {
        if (secretHash === null || (await sha(String(body?.["secret"]))) !== secretHash)
          return Response.json({ code: "pairing_not_found" }, { status: 404 });
        if (!claimed || !issued)
          return Response.json({ code: "pairing_not_ready" }, { status: 409 });
        secretHash = null; // burnt: a replay reads like a wrong secret
        return Response.json({ deviceId: "dev_1", token: "device-token" });
      }
      return new Response(null, { status: 404 });
    }),
  );
  return {
    seen,
    claim: () => {
      claimed = true;
    },
    issue: () => {
      issued = true;
    },
  };
}

const PAIRING = {
  pairingId: "pr_1",
  code: "K7Q4M2XR",
  expiresAt: new Date("2026-10-25T10:10:00Z"),
};

/** The token the credential driver reads from `storage`. */
const tokenIn = (storage: MemoryStorageDriver) => new StoredDeviceCredentialDriver(storage).token();

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("HttpDevicePairingDriver", () => {
  it("is a DevicePairing", () => {
    expect(driver(new MemoryStorageDriver())).toBeInstanceOf(DevicePairing);
  });

  it("posts the install id and a fresh secret in the body, unauthenticated, and decodes the code", async () => {
    const storage = new MemoryStorageDriver();
    const hub = fakeHub();
    const pairing = await driver(storage).begin();
    expect(pairing).toEqual(PAIRING);
    const [request] = hub.seen;
    expect(request?.method).toBe("POST");
    expect(request?.url.href).toBe("https://hub.test/device-pairings");
    expect(request?.authorization).toBeNull();
    const secret = request?.body?.["secret"];
    expect(secret).toMatch(/^[0-9a-f]{64}$/);
    expect(request?.body).toEqual({
      deviceId: await new StoredDeviceIdentityDriver(storage).id(),
      secret,
    });
    expect(storage.secrets.get(DEVICE_STORAGE_KEYS.pairingSecret)).toBe(secret);

    await driver(storage).begin();
    expect(hub.seen[1]?.body?.["secret"]).not.toBe(secret);
  });

  it("polls without the secret, picks the token up once paired and never returns it", async () => {
    const storage = new MemoryStorageDriver();
    const hub = fakeHub();
    await driver(storage).begin();
    const secret = hub.seen[0]?.body?.["secret"] as string;

    expect(await driver(storage).check(PAIRING)).toEqual({ state: "pending", deviceId: null });
    hub.claim();
    hub.issue();
    const status = await driver(storage).check(PAIRING);

    expect(status).toEqual({ state: "paired", deviceId: "dev_1" });
    expect(JSON.stringify(status)).not.toContain("device-token");
    expect(await tokenIn(storage)).toBe("device-token");
    expect(storage.secrets.get(DEVICE_STORAGE_KEYS.pairingSecret)).toBeUndefined();
    const id = await new StoredDeviceIdentityDriver(storage).id();
    const polls = hub.seen.filter((request) => request.method === "GET");
    for (const poll of polls) {
      expect(poll.url.pathname).toBe("/device-pairings/pr_1");
      expect(poll.url.search).toBe(`?deviceId=${encodeURIComponent(id)}`);
      expect(poll.url.href).not.toContain(secret);
    }
    const pickups = hub.seen.filter((request) => request.url.pathname.endsWith("/pickup"));
    expect(pickups).toHaveLength(1);
    expect(pickups[0]?.method).toBe("POST");
    expect(pickups[0]?.url.search).toBe("");
    // the hub must never keep the answer that carries the token, so the pickup sends no Idempotency-Key
    expect(pickups[0]?.idempotencyKey).toBeNull();
    expect(hub.seen[0]?.idempotencyKey).not.toBeNull();
    expect(pickups[0]?.body).toEqual({ secret });

    // a later check finds no secret kept and asks for no second pickup
    expect(await driver(storage).check(PAIRING)).toEqual({ state: "paired", deviceId: "dev_1" });
    expect(hub.seen.filter((request) => request.url.pathname.endsWith("/pickup"))).toHaveLength(1);

    await driver(storage).forget();
    expect(await tokenIn(storage)).toBeUndefined();
  });

  it("never takes a credential from the status, even one that carries a token", async () => {
    const storage = new MemoryStorageDriver();
    const hub = fakeHub({ leak: true });
    await driver(storage).begin();
    hub.claim(); // paired, with a token on the status, but nothing issued for the pickup yet

    const status = await driver(storage).check(PAIRING);

    expect(status).toEqual({ state: "pending", deviceId: null });
    expect(await tokenIn(storage)).toBeUndefined();
  });

  it("reads a pickup before the credential is ready as pending and keeps the secret", async () => {
    const storage = new MemoryStorageDriver();
    const hub = fakeHub();
    await driver(storage).begin();
    hub.claim();

    expect(await driver(storage).check(PAIRING)).toEqual({ state: "pending", deviceId: null });
    expect(await tokenIn(storage)).toBeUndefined();
    expect(storage.secrets.get(DEVICE_STORAGE_KEYS.pairingSecret)).toBeDefined();

    hub.issue();
    expect(await driver(storage).check(PAIRING)).toEqual({ state: "paired", deviceId: "dev_1" });
    expect(await tokenIn(storage)).toBe("device-token");
  });

  it("is refused a pickup with a wrong secret", async () => {
    const storage = new MemoryStorageDriver();
    const hub = fakeHub();
    await driver(storage).begin();
    hub.claim();
    hub.issue();
    storage.secrets.set(DEVICE_STORAGE_KEYS.pairingSecret, "0".repeat(64));

    const failure = await driver(storage)
      .check(PAIRING)
      .catch((error: unknown) => error);

    expect(isRefusal(failure, DeviceHubRefusedError)).toBe(true);
    expect((failure as DeviceHubRefusedError).details).toEqual({ status: 404 });
    expect(await tokenIn(storage)).toBeUndefined();
  });

  it("is refused a second pickup with the same secret", async () => {
    const storage = new MemoryStorageDriver();
    const hub = fakeHub();
    await driver(storage).begin();
    const secret = hub.seen[0]?.body?.["secret"] as string;
    hub.claim();
    hub.issue();
    await driver(storage).check(PAIRING);

    // a copy of the spent secret (another install, or a replay) gets nothing
    const replay = new MemoryStorageDriver();
    replay.secrets.set(DEVICE_STORAGE_KEYS.pairingSecret, secret);
    const failure = await driver(replay)
      .check(PAIRING)
      .catch((error: unknown) => error);

    expect(isRefusal(failure, DeviceHubRefusedError)).toBe(true);
    expect((failure as DeviceHubRefusedError).details).toEqual({ status: 404 });
    expect(await tokenIn(replay)).toBeUndefined();
  });

  it("throws on a malformed answer", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ state: "paired", deviceId: null })),
    );
    await expect(driver(new MemoryStorageDriver()).check(PAIRING)).rejects.toBeInstanceOf(ZodError);
  });
});
