/**
 * Stackra file contract:
 * Purpose: unit tests of `DevicePushTransportDriver`: an Expo push returns its ticket id; `DeviceNotRegistered` revokes
 *          the token; a Web Push goes encrypted with a VAPID header to the endpoint and a 410 revokes the subscription;
 *          a non-https endpoint is refused; a logged key sends nothing; Expo receipts revoke gone devices; with an outbox
 *          each sent, revoked or refused push records one `DeliveryRecorded` (stackra-207); an Expo push names its
 *          Android channel when it has one.
 * Boundary: test only; the Expo client is `fakeIntegrationApi` over a test Integration, `fetch` is stubbed, the VAPID
 *           keys are generated here.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; RFC 8030; RFC 8292; stackra-207 (STA-1360).
 */
import { buildConfig } from "@stackra/config";
import { SecretStore } from "@stackra/config/contracts";
import { Clock } from "@stackra/contracts";
import { OutboxFake } from "@stackra/events/testing";
import { AuthType, Integration, IntegrationCategory, IntegrationRole } from "@stackra/integrations";
import { fakeIntegrationApi } from "@stackra/integrations/testing";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";
import { base64url } from "@stackra/support";

import { NotificationsConfig } from "#config/notifications.config";
import { PushTokenStore } from "#contracts/ports/push-token-store.port";
import { SendLog } from "#contracts/ports/send-log.port";
import type { PushTarget } from "#contracts/types/push-target.type";
import { DevicePushTransportDriver } from "#core/drivers/device-push-transport.driver";

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

/** A VAPID key pair and a browser subscription, generated; `subject` is the contact secret, none when undefined. */
async function keys(subject?: string) {
  const vapid = (await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, [
    "sign",
  ])) as CryptoKeyPair;
  const browser = (await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, [
    "deriveBits",
  ])) as CryptoKeyPair;
  const secrets: Record<string, string> = {
    WEB_PUSH_VAPID_PUBLIC_KEY: base64url.encode(
      await crypto.subtle.exportKey("raw", vapid.publicKey),
    ),
    WEB_PUSH_VAPID_PRIVATE_KEY: (await crypto.subtle.exportKey("jwk", vapid.privateKey)).d ?? "",
    ...(subject === undefined ? {} : { WEB_PUSH_VAPID_SUBJECT: subject }),
  };
  return {
    secrets: new (class extends SecretStore {
      get(name: string) {
        return secrets[name];
      }
    })(),
    p256dh: base64url.encode(await crypto.subtle.exportKey("raw", browser.publicKey)),
    auth: base64url.encode(crypto.getRandomValues(new Uint8Array(16))),
  };
}

/** The driver with an Expo client answering `ticket`, and the contact from `config` or the `subject` secret. */
async function driverWith(
  ticket: unknown,
  outbox?: OutboxFake,
  config?: NotificationsConfig,
  subject?: string,
) {
  const expo = new ExpoIntegration();
  const bodies: unknown[] = [];
  Object.defineProperty(expo, "api", {
    value: fakeIntegrationApi(ExpoIntegration, (r) =>
      r
        .post("/--/api/v2/push/send")
        .returns((_params, request) => {
          bodies.push(request.body);
          return { data: [ticket] };
        })
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
  const { secrets, p256dh, auth } = await keys(
    config === undefined ? (subject ?? "mailto:push@platform.example") : subject,
  );
  return {
    driver: new (class extends DevicePushTransportDriver {
      protected override readonly expo = expo;
    })(secrets, tokens, log, new FixedClock(), outbox, config),
    tokens,
    log,
    bodies,
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

  it("names the Android channel of the push's category only when given", async () => {
    const { driver, bodies } = await driverWith({ status: "ok", id: "ticket-1" });
    const push = {
      target: { kind: "expo", token: "ExponentPushToken[x]" },
      title: "T",
      body: "B",
      ttlSeconds: 60,
    } as const;
    await driver.send({ ...push, channelId: "marketing" }, "k1");
    await driver.send(push, "k2");
    expect(bodies).toEqual([
      [
        {
          to: "ExponentPushToken[x]",
          title: "T",
          body: "B",
          data: {},
          ttl: 60,
          channelId: "marketing",
        },
      ],
      [{ to: "ExponentPushToken[x]", title: "T", body: "B", data: {}, ttl: 60 }],
    ]);
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

  it.each([
    { from: "config", config: "mailto:ops@acme.example", secret: undefined },
    { from: "the secret while config is empty", config: "", secret: "https://acme.example/push" },
  ])("signs the VAPID token with the contact from $from", async ({ config, secret }) => {
    const settings = buildConfig(NotificationsConfig, { values: { webPushVapidSubject: config } });
    const { driver, p256dh, auth } = await driverWith({}, undefined, settings, secret);
    const fetchMock = vi.fn(async () => new Response(null, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    const target = { kind: "web", endpoint: "https://push.example/sub/9", p256dh, auth } as const;
    await driver.send({ target, title: "T", body: "B", ttlSeconds: 60 }, "s1");
    const init = (fetchMock.mock.calls[0] as unknown as [URL, RequestInit])[1];
    const token = /^vapid t=([^,]+),/.exec(
      new Headers(init.headers).get("authorization") ?? "",
    )?.[1];
    const claims = JSON.parse(
      new TextDecoder().decode(base64url.decode(token?.split(".")[1] ?? "")),
    ) as { sub: string };
    expect(claims.sub).toBe(config || secret);
  });

  it("refuses a Web Push when neither config nor the secret holds the contact", async () => {
    const settings = buildConfig(NotificationsConfig);
    const { driver, p256dh, auth } = await driverWith({}, undefined, settings, undefined);
    vi.stubGlobal("fetch", vi.fn());
    const target = { kind: "web", endpoint: "https://push.example/sub/9", p256dh, auth } as const;
    await expect(
      driver.send({ target, title: "T", body: "B", ttlSeconds: 60 }, "s2"),
    ).rejects.toThrow("WEB_PUSH_VAPID_SUBJECT is not set");
  });

  it("revokes devices that receipts report gone", async () => {
    const { driver, tokens } = await driverWith({});
    await expect(
      driver.receipts(["t1", "t2"], new Map([["t2", "ExponentPushToken[y]"]])),
    ).resolves.toEqual(["t2"]);
    expect(tokens.revoked).toEqual([{ kind: "expo", token: "ExponentPushToken[y]" }]);
  });

  it("records each outcome as DeliveryRecorded when it has an outbox", async () => {
    const push = {
      target: { kind: "expo", token: "ExponentPushToken[x]" },
      title: "T",
      body: "B",
      ttlSeconds: 60,
    } as const;
    const outbox = new OutboxFake();
    const ok = await driverWith({ status: "ok", id: "ticket-1" }, outbox);
    await ok.driver.send(push, "k1");
    await ok.driver.send(push, "k1");
    const gone = await driverWith(
      { status: "error", details: { error: "DeviceNotRegistered" } },
      outbox,
    );
    await gone.driver.send(push, "k2");
    const refused = await driverWith(
      { status: "error", details: { error: "MessageTooBig" } },
      outbox,
    );
    await expect(refused.driver.send(push, "k3")).rejects.toThrow();
    const at = "2026-10-25T10:00:00.000Z";
    expect(outbox.take().map(({ event }) => event)).toEqual([
      expect.objectContaining({
        deliveryId: "k1",
        channel: "push",
        provider: "expo",
        status: "sent",
        at,
      }),
      expect.objectContaining({
        deliveryId: "k2",
        channel: "push",
        provider: "expo",
        status: "revoked",
        at,
      }),
      expect.objectContaining({
        deliveryId: "k3",
        channel: "push",
        provider: "expo",
        status: "failed",
        at,
      }),
    ]);
  });
});
