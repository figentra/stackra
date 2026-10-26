/**
 * Stackra file contract:
 * Purpose: unit tests of `DevicePushTransportDriver`: an Expo push returns its ticket id; `DeviceNotRegistered` revokes
 *          the token; a Web Push goes encrypted with a VAPID header to the endpoint and a 410 revokes the subscription;
 *          a non-https endpoint is refused; a logged key sends nothing; Expo receipts revoke gone devices.
 * Boundary: test only; the Expo client is `fakeIntegrationApi` over a test Integration, `fetch` is stubbed, the VAPID
 *           keys are generated here.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; RFC 8030; RFC 8292.
 */
import { SecretStore } from "@stackra/config/contracts";
import { Clock } from "@stackra/contracts";
import { AuthType, Integration, IntegrationCategory, IntegrationRole } from "@stackra/integrations";
import { fakeIntegrationApi } from "@stackra/integrations/testing";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { PushTokenStore } from "#contracts/ports/push-token-store.port";
import { SendLog } from "#contracts/ports/send-log.port";
import type { PushTarget } from "#contracts/types/push-target.type";
import { DevicePushTransportDriver } from "#core/drivers/device-push-transport.driver";
import { base64url } from "#core/functions/base64url.function";

/** A stand-in for the host's Expo Integration (the vendor one lives in the OS integrations service). */
class ExpoIntegration extends Integration({
  provider: "expo",
  category: IntegrationCategory.Messaging,
  roles: [IntegrationRole.Channel],
  levels: [],
  auth: { type: AuthType.None },
  baseUrl: "https://exp.host",
}) {}

class Tokens extends PushTokenStore {
  readonly revoked: PushTarget[] = [];
  async revoke(target: PushTarget): Promise<void> {
    this.revoked.push(target);
  }
}

class Log extends SendLog {
  readonly sent = new Map<string, string>();
  async get(key: string): Promise<string | undefined> {
    return this.sent.get(key);
  }
  async record(key: string, providerId: string): Promise<void> {
    this.sent.set(key, providerId);
  }
}

class FixedClock extends Clock {
  now(): Date {
    return new Date("2026-10-25T10:00:00Z");
  }
}

/** A VAPID key pair and a browser subscription, generated. */
async function keys() {
  const vapid = (await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, [
    "sign",
  ])) as CryptoKeyPair;
  const browser = (await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, [
    "deriveBits",
  ])) as CryptoKeyPair;
  const secrets: Record<string, string> = {
    WEB_PUSH_VAPID_PUBLIC_KEY: base64url(await crypto.subtle.exportKey("raw", vapid.publicKey)),
    WEB_PUSH_VAPID_PRIVATE_KEY: (await crypto.subtle.exportKey("jwk", vapid.privateKey)).d ?? "",
    WEB_PUSH_VAPID_SUBJECT: "mailto:push@platform.example",
  };
  return {
    secrets: new (class extends SecretStore {
      get(name: string) {
        return secrets[name];
      }
    })(),
    p256dh: base64url(await crypto.subtle.exportKey("raw", browser.publicKey)),
    auth: base64url(crypto.getRandomValues(new Uint8Array(16))),
  };
}

/** The driver with an Expo client answering `ticket`. */
async function driverWith(ticket: unknown) {
  const expo = new ExpoIntegration();
  Object.defineProperty(expo, "api", {
    value: fakeIntegrationApi(ExpoIntegration, (r) =>
      r
        .post("/--/api/v2/push/send")
        .returns(() => ({ data: [ticket] }))
        .post("/--/api/v2/push/getReceipts")
        .returns(() => ({
          data: {
            t1: { status: "ok" },
            t2: { status: "error", details: { error: "DeviceNotRegistered" } },
          },
        })),
    ),
  });
  const tokens = new Tokens();
  const log = new Log();
  const { secrets, p256dh, auth } = await keys();
  return {
    driver: new DevicePushTransportDriver(expo, secrets, tokens, log, new FixedClock()),
    tokens,
    log,
    p256dh,
    auth,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("DevicePushTransportDriver", () => {
  it("sends an Expo push and revokes a gone device", async () => {
    const ok = await driverWith({ status: "ok", id: "ticket-1" });
    const push = {
      target: { kind: "expo", token: "ExponentPushToken[x]" },
      title: "T",
      body: "B",
      ttlSeconds: 60,
    } as const;
    await expect(ok.driver.send(push, "k1")).resolves.toEqual({
      status: "sent",
      providerId: "ticket-1",
    });
    await expect(ok.driver.send(push, "k1")).resolves.toEqual({
      status: "sent",
      providerId: "ticket-1",
    });
    const gone = await driverWith({ status: "error", details: { error: "DeviceNotRegistered" } });
    await expect(gone.driver.send(push, "k2")).resolves.toEqual({ status: "revoked" });
    expect(gone.tokens.revoked).toEqual([push.target]);
  });

  it("sends an encrypted Web Push with VAPID and revokes on 410", async () => {
    const { driver, tokens, p256dh, auth } = await driverWith({});
    const fetchMock = vi.fn(
      async () =>
        new Response(null, { status: 201, headers: { location: "https://push.example/m/1" } }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const target = { kind: "web", endpoint: "https://push.example/sub/1", p256dh, auth } as const;
    await expect(
      driver.send({ target, title: "T", body: "B", ttlSeconds: 60 }, "w1"),
    ).resolves.toEqual({
      status: "sent",
      providerId: "https://push.example/m/1",
    });
    const init = (fetchMock.mock.calls[0] as unknown as [URL, RequestInit])[1];
    const headers = new Headers(init.headers);
    expect(headers.get("content-encoding")).toBe("aes128gcm");
    expect(headers.get("authorization")).toMatch(/^vapid t=.+, k=.+$/);
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 410 }));
    await expect(
      driver.send({ target, title: "T", body: "B", ttlSeconds: 60 }, "w2"),
    ).resolves.toEqual({ status: "revoked" });
    expect(tokens.revoked).toEqual([target]);
    await expect(
      driver.send(
        {
          target: { ...target, endpoint: "http://push.example/x" },
          title: "T",
          body: "B",
          ttlSeconds: 60,
        },
        "w3",
      ),
    ).rejects.toThrow(TypeError);
  });

  it("revokes devices that receipts report gone", async () => {
    const { driver, tokens } = await driverWith({});
    await expect(
      driver.receipts(["t1", "t2"], new Map([["t2", "ExponentPushToken[y]"]])),
    ).resolves.toEqual(["t2"]);
    expect(tokens.revoked).toEqual([{ kind: "expo", token: "ExponentPushToken[y]" }]);
  });
});
