/**
 * Stackra file contract:
 * Purpose: unit tests of `hubSender`: refusing a missing hub URL, joining the hub URL and the path, the bearer token
 *          (none when the credential has none), an `Idempotency-Key` on a write kept across retries, a retried 503,
 *          401 and 403 as `DeviceUnauthorizedError`, other failures as `DeviceHubRefusedError`, and a timeout.
 * Boundary: test only; the global `fetch` is stubbed and restored.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0235 (decisions 1 and
 *                     2); ADR 0138.
 */
import { buildConfig } from "@stackra/config";
import type { ConfigValues } from "@stackra/config";
import { isRefusal } from "@stackra/errors";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";
import { RequestTimedOutError } from "@stackra/transport";

import { DevicesConfig } from "#config/devices.config";
import { DeviceCredential } from "#contracts/ports/device-credential.port";
import { DeviceHubRefusedError } from "#core/errors/device-hub-refused.error";
import { DeviceUnauthorizedError } from "#core/errors/device-unauthorized.error";
import { hubSender } from "#core/functions/hub-sender.function";

class StaticCredential extends DeviceCredential {
  value: string | undefined = "device-token";

  token(): Promise<string | undefined> {
    return Promise.resolve(this.value);
  }
}

/** A config for a hub at `https://hub.test/api/` with the given overrides. */
function config(values: Partial<ConfigValues<DevicesConfig>> = {}): DevicesConfig {
  return buildConfig(DevicesConfig, {
    values: { hubUrl: "https://hub.test/api/", attempts: 1, ...values },
  });
}

/** Stubs the global fetch with `answer` and returns the requests it saw. */
function stubFetch(answer: (request: Request) => Response | Promise<Response>): Request[] {
  const seen: Request[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (request: Request) => {
      seen.push(request);
      return answer(request);
    }),
  );
  return seen;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("hubSender", () => {
  it("refuses to start without a hub URL", () => {
    expect(() => hubSender(buildConfig(DevicesConfig), new StaticCredential())).toThrow(TypeError);
  });

  it("calls the path under the hub URL with the device's bearer token", async () => {
    const seen = stubFetch(() => new Response("{}"));
    const send = hubSender(config(), new StaticCredential());
    const response = await send("/device-commands");
    expect(response.status).toBe(200);
    expect(seen[0]?.url).toBe("https://hub.test/api/device-commands");
    expect(seen[0]?.headers.get("authorization")).toBe("Bearer device-token");
    expect(seen[0]?.headers.has("idempotency-key")).toBe(false);
  });

  it("sends no Authorization header when the credential has no token", async () => {
    const seen = stubFetch(() => new Response(null, { status: 204 }));
    const credential = new StaticCredential();
    credential.value = undefined;
    await hubSender(config(), credential)("/devices/report", { method: "POST", body: "{}" });
    expect(seen[0]?.headers.has("authorization")).toBe(false);
  });

  it("retries a 503 with one Idempotency-Key, then answers", async () => {
    let calls = 0;
    const seen = stubFetch(() =>
      ++calls === 1
        ? new Response(null, { status: 503, headers: { "retry-after": "0" } })
        : new Response(null, { status: 202 }),
    );
    const send = hubSender(config({ attempts: 2 }), new StaticCredential());
    const response = await send("/devices/report", { method: "POST", body: '{"readings":[]}' });
    expect(response.status).toBe(202);
    expect(seen).toHaveLength(2);
    const key = seen[0]?.headers.get("idempotency-key");
    expect(key).toBeTruthy();
    expect(seen[1]?.headers.get("idempotency-key")).toBe(key);
  });

  it.each([401, 403])("refuses a %i as DeviceUnauthorizedError", async (status) => {
    stubFetch(() => new Response("denied", { status }));
    const failure = await hubSender(
      config(),
      new StaticCredential(),
    )("/device-commands").catch((error: unknown) => error);
    expect(isRefusal(failure, DeviceUnauthorizedError)).toBe(true);
    expect((failure as DeviceUnauthorizedError).details).toEqual({ status });
  });

  it.each([400, 404, 500, 503])("refuses a %i as DeviceHubRefusedError", async (status) => {
    stubFetch(() => new Response(null, { status }));
    const failure = await hubSender(
      config(),
      new StaticCredential(),
    )("/device-commands").catch((error: unknown) => error);
    expect(isRefusal(failure, DeviceHubRefusedError)).toBe(true);
    expect((failure as DeviceHubRefusedError).details).toEqual({ status });
  });

  it("fails with RequestTimedOutError when the hub does not answer in time", async () => {
    stubFetch(
      (request) =>
        new Promise<Response>((_, reject) => {
          request.signal.addEventListener("abort", () => reject(request.signal.reason), {
            once: true,
          });
        }),
    );
    const failure = await hubSender(
      config({ timeoutMs: 20 }),
      new StaticCredential(),
    )("/device-commands").catch((error: unknown) => error);
    expect(isRefusal(failure, RequestTimedOutError)).toBe(true);
  });
});
