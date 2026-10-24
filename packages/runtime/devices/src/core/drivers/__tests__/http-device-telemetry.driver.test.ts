/**
 * Stackra file contract:
 * Purpose: unit tests of `HttpDeviceTelemetryDriver`: a driver of `DeviceTelemetry` that posts one JSON batch to
 *          `/devices/report` with ISO 8601 instants and the bearer token, sends nothing for an empty batch, refuses to
 *          start without a hub URL and rejects with the hub's refusal.
 * Boundary: test only; the global `fetch` is stubbed and restored.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0235 (decision 2).
 */
import { buildConfig } from "@stackra/config";
import { isRefusal } from "@stackra/errors";
import { afterEach, describe, expect, it, vi } from "@stackra/testing";

import { DevicesConfig } from "#config/devices.config";
import { DeviceCredential } from "#contracts/ports/device-credential.port";
import { DeviceTelemetry } from "#contracts/ports/device-telemetry.port";
import { HttpDeviceTelemetryDriver } from "#core/drivers/http-device-telemetry.driver";
import { DeviceUnauthorizedError } from "#core/errors/device-unauthorized.error";

class StaticCredential extends DeviceCredential {
  token(): Promise<string | undefined> {
    return Promise.resolve("device-token");
  }
}

/** A driver for a hub at `https://hub.test`, one attempt per call. */
function driver(): HttpDeviceTelemetryDriver {
  return new HttpDeviceTelemetryDriver(
    buildConfig(DevicesConfig, { values: { hubUrl: "https://hub.test", attempts: 1 } }),
    new StaticCredential(),
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

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("HttpDeviceTelemetryDriver", () => {
  it("is a driver of the DeviceTelemetry port", () => {
    expect(driver()).toBeInstanceOf(DeviceTelemetry);
  });

  it("refuses to start without a hub URL", () => {
    expect(
      () => new HttpDeviceTelemetryDriver(buildConfig(DevicesConfig), new StaticCredential()),
    ).toThrow(TypeError);
  });

  it("posts one JSON batch with ISO 8601 instants", async () => {
    const seen = stubFetch(() => new Response(null, { status: 202 }));
    await driver().report([
      {
        metric: "temperature",
        value: 21.5,
        unit: "celsius",
        at: new Date("2026-10-24T09:00:00.000Z"),
      },
      { metric: "door_open", value: false, at: new Date("2026-10-24T09:00:01.000Z") },
    ]);
    expect(seen).toHaveLength(1);
    const [request] = seen as [Request];
    expect(request.method).toBe("POST");
    expect(request.url).toBe("https://hub.test/devices/report");
    expect(request.headers.get("content-type")).toBe("application/json");
    expect(request.headers.get("authorization")).toBe("Bearer device-token");
    expect(request.headers.has("idempotency-key")).toBe(true);
    expect(await request.json()).toEqual({
      readings: [
        { metric: "temperature", value: 21.5, unit: "celsius", at: "2026-10-24T09:00:00.000Z" },
        { metric: "door_open", value: false, at: "2026-10-24T09:00:01.000Z" },
      ],
    });
  });

  it("sends nothing for an empty batch", async () => {
    const seen = stubFetch(() => new Response(null, { status: 202 }));
    await driver().report([]);
    expect(seen).toHaveLength(0);
  });

  it("rejects with the hub's refusal", async () => {
    stubFetch(() => new Response(null, { status: 401 }));
    const failure = await driver()
      .report([{ metric: "temperature", value: 1, at: new Date() }])
      .catch((error: unknown) => error);
    expect(isRefusal(failure, DeviceUnauthorizedError)).toBe(true);
  });
});
