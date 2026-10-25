/**
 * Stackra file contract:
 * Purpose: unit tests of `HttpDevicePairingDriver`: `begin` posts the install id with no bearer token and decodes the
 *          code; `check` answers the state and, once paired, keeps the token in `secrets` (where the credential driver
 *          reads it) without returning it; `forget` drops it; a malformed answer throws.
 * Boundary: test only; the global `fetch` is stubbed and restored, the storage is @stackra/storage's memory driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0361 (decision 7); ADR 0235 (decision 1, as amended).
 */
import { buildConfig } from "@stackra/config";
import { MemoryStorageDriver } from "@stackra/storage";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";
import { ZodError } from "zod";

import { DevicesConfig } from "#config/devices.config";
import { DevicePairing } from "#contracts/ports/device-pairing.port";
import { HttpDevicePairingDriver } from "#core/drivers/http-device-pairing.driver";
import { StoredDeviceCredentialDriver } from "#core/drivers/stored-device-credential.driver";
import { StoredDeviceIdentityDriver } from "#core/drivers/stored-device-identity.driver";

/** The driver over a hub at `https://hub.test`, its credential and identity over `storage`. */
function driver(storage: MemoryStorageDriver): HttpDevicePairingDriver {
  return new HttpDevicePairingDriver(
    buildConfig(DevicesConfig, { values: { hubUrl: "https://hub.test", attempts: 1 } }),
    new StoredDeviceCredentialDriver(storage),
    new StoredDeviceIdentityDriver(storage),
    storage,
  );
}

/** Stubs the global fetch with `answer` and returns the requests it saw. */
function stubFetch(answer: () => Response): Request[] {
  const seen: Request[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (request: Request) => {
      seen.push(request);
      return answer();
    }),
  );
  return seen;
}

const PAIRING = {
  pairingId: "pr_1",
  code: "K7Q4M2XR",
  expiresAt: new Date("2026-10-25T10:10:00Z"),
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("HttpDevicePairingDriver", () => {
  it("is a DevicePairing", () => {
    expect(driver(new MemoryStorageDriver())).toBeInstanceOf(DevicePairing);
  });

  it("posts the install id unauthenticated and decodes the code", async () => {
    const storage = new MemoryStorageDriver();
    const seen = stubFetch(() =>
      Response.json({ pairingId: "pr_1", code: "K7Q4M2XR", expiresAt: "2026-10-25T10:10:00Z" }),
    );
    const pairing = await driver(storage).begin();
    expect(pairing).toEqual(PAIRING);
    const [request] = seen;
    expect(request?.method).toBe("POST");
    expect(request?.url).toBe("https://hub.test/device-pairings");
    expect(request?.headers.get("authorization")).toBeNull();
    expect(await request?.json()).toEqual({
      deviceId: await new StoredDeviceIdentityDriver(storage).id(),
    });
  });

  it("keeps the token once paired and never returns it", async () => {
    const storage = new MemoryStorageDriver();
    stubFetch(() => Response.json({ state: "pending", deviceId: null, token: null }));
    expect(await driver(storage).check(PAIRING)).toEqual({ state: "pending", deviceId: null });
    expect(await new StoredDeviceCredentialDriver(storage).token()).toBeUndefined();

    const seen = stubFetch(() =>
      Response.json({ state: "paired", deviceId: "dev_1", token: "device-token" }),
    );
    const status = await driver(storage).check(PAIRING);
    expect(status).toEqual({ state: "paired", deviceId: "dev_1" });
    expect(seen[0]?.url).toBe("https://hub.test/device-pairings/pr_1");
    expect(await new StoredDeviceCredentialDriver(storage).token()).toBe("device-token");

    await driver(storage).forget();
    expect(await new StoredDeviceCredentialDriver(storage).token()).toBeUndefined();
  });

  it("throws on a malformed answer", async () => {
    stubFetch(() => Response.json({ state: "paired", deviceId: "dev_1", token: null }));
    await expect(driver(new MemoryStorageDriver()).check(PAIRING)).rejects.toBeInstanceOf(ZodError);
  });
});
