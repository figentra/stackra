/**
 * Stackra file contract:
 * Purpose: unit tests of `ApnsLiveActivityPushesDriver`: the request it sends (origin, path, push type, topic, signed
 *          ES256 JWT reused between pushes), `gone` on 410 only, a thrown refusal otherwise (`BadDeviceToken` naming
 *          `apnsEnvironment`), a cancelled push APNs never answers, and the refusals of a missing bundle id,
 *          secret or a malformed token.
 * Boundary: test only; `node:http2` is mocked; the key pair is generated per run, so no secret is in the repo.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; STA-1539.
 */
import { EventEmitter } from "node:events";
import { generateKeyPairSync, verify } from "node:crypto";

import { buildConfig, MemorySecretStoreDriver } from "@stackra/config";
import { beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { LiveActivityConfig as BaseLiveActivityConfig } from "#config/live-activity.config";
import type { ActivityProgress } from "#contracts/types/activity-progress.type";
import { ApnsLiveActivityPushesDriver } from "#node/drivers/apns-live-activity-pushes.driver";

const mocks = vi.hoisted(() => ({
  answer: { status: 200, body: "", hang: false },
  timeouts: [] as (() => void)[],
  connect: vi.fn(),
  requests: [] as { headers: Record<string, string>; body: string }[],
}));

vi.mock("node:http2", () => ({
  connect: mocks.connect,
  constants: { NGHTTP2_CANCEL: 8 },
}));

/** A host that pushes to its sandbox app. */
class LiveActivityConfig extends BaseLiveActivityConfig {
  override apnsBundleId = "com.figentra.mobile";

  override apnsEnvironment = "sandbox" as const;
}

const ORDER: ActivityProgress = {
  reference: "order_1042",
  title: "Order 1042",
  status: "On the way",
  step: 3,
  steps: 4,
};

const { privateKey, publicKey } = generateKeyPairSync("ec", { namedCurve: "P-256" });

/** A driver over the sandbox configuration and a full set of secrets. */
function driver(config = buildConfig(LiveActivityConfig)): ApnsLiveActivityPushesDriver {
  const secrets = new MemorySecretStoreDriver();
  secrets.set("APNS_KEY_ID", "KEY123");
  secrets.set("APNS_TEAM_ID", "TEAM123");
  secrets.set("APNS_PRIVATE_KEY", privateKey.export({ type: "pkcs8", format: "pem" }).toString());
  return new ApnsLiveActivityPushesDriver(config, secrets);
}

describe("ApnsLiveActivityPushesDriver", () => {
  beforeEach(() => {
    mocks.answer = { status: 200, body: "", hang: false };
    mocks.requests.length = 0;
    mocks.timeouts.length = 0;
    mocks.connect.mockImplementation(() => {
      const session = Object.assign(new EventEmitter(), {
        close: vi.fn(),
        request: (headers: Record<string, string>) => {
          const request = Object.assign(new EventEmitter(), {
            setEncoding: vi.fn(),
            close: vi.fn(),
            setTimeout: (_ms: number, onTimeout: () => void) => {
              mocks.timeouts.push(onTimeout);
            },
            end: (body: string) => {
              mocks.requests.push({ headers, body });
              if (mocks.answer.hang) return;
              queueMicrotask(() => {
                request.emit("response", { ":status": mocks.answer.status });
                if (mocks.answer.body) request.emit("data", mocks.answer.body);
                request.emit("end");
              });
            },
          });
          return request;
        },
      });
      return session;
    });
  });

  it("posts a liveactivity push to the sandbox with a signed provider token", async () => {
    expect(await driver().send("abcdef01", "update", ORDER)).toBe("sent");
    expect(mocks.connect).toHaveBeenCalledWith("https://api.sandbox.push.apple.com");
    const [request] = mocks.requests;
    expect(request?.headers).toMatchObject({
      ":method": "POST",
      ":path": "/3/device/abcdef01",
      "apns-push-type": "liveactivity",
      "apns-topic": "com.figentra.mobile.push-type.liveactivity",
    });
    expect(JSON.parse(request?.body ?? "{}").aps.event).toBe("update");
    const [header, claims, signature] = (request?.headers.authorization ?? "")
      .replace("bearer ", "")
      .split(".");
    expect(JSON.parse(Buffer.from(header ?? "", "base64url").toString())).toEqual({
      alg: "ES256",
      kid: "KEY123",
    });
    expect(JSON.parse(Buffer.from(claims ?? "", "base64url").toString()).iss).toBe("TEAM123");
    expect(
      verify(
        "sha256",
        Buffer.from(`${header}.${claims}`),
        { key: publicKey, dsaEncoding: "ieee-p1363" },
        Buffer.from(signature ?? "", "base64url"),
      ),
    ).toBe(true);
  });

  it("reuses the provider token between pushes", async () => {
    const pushes = driver();
    await pushes.send("abcdef01", "update", ORDER);
    await pushes.send("abcdef01", "end", ORDER);
    expect(mocks.requests[0]?.headers.authorization).toBe(mocks.requests[1]?.headers.authorization);
  });

  it("answers gone on 410 only, and throws any other refusal", async () => {
    mocks.answer = { status: 410, body: JSON.stringify({ reason: "Unregistered" }), hang: false };
    expect(await driver().send("abcdef01", "update", ORDER)).toBe("gone");
    mocks.answer = { status: 400, body: JSON.stringify({ reason: "BadDeviceToken" }), hang: false };
    await expect(driver().send("abcdef01", "update", ORDER)).rejects.toThrow("apnsEnvironment");
    mocks.answer = {
      status: 403,
      body: JSON.stringify({ reason: "InvalidProviderToken" }),
      hang: false,
    };
    await expect(driver().send("abcdef01", "update", ORDER)).rejects.toThrow(
      "403 InvalidProviderToken",
    );
  });

  it("cancels and throws when APNs never answers", async () => {
    mocks.answer = { status: 200, body: "", hang: true };
    const push = driver().send("abcdef01", "update", ORDER);
    await vi.waitFor(() => expect(mocks.timeouts).toHaveLength(1));
    mocks.timeouts[0]?.();
    await expect(push).rejects.toThrow("did not answer");
  });

  it("refuses a malformed token and a host without a bundle id or secrets", async () => {
    await expect(driver().send("../x", "update", ORDER)).rejects.toThrow(TypeError);
    await expect(
      driver(buildConfig(BaseLiveActivityConfig)).send("abcdef01", "update", ORDER),
    ).rejects.toThrow("apnsBundleId");
    const bare = new ApnsLiveActivityPushesDriver(
      buildConfig(LiveActivityConfig),
      new MemorySecretStoreDriver(),
    );
    await expect(bare.send("abcdef01", "update", ORDER)).rejects.toThrow("APNS_KEY_ID");
    expect(mocks.requests).toHaveLength(0);
  });
});
