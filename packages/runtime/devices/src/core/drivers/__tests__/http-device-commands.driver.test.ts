/**
 * Stackra file contract:
 * Purpose: unit tests of `HttpDeviceCommandsDriver`: a driver of `DeviceCommands` that reads and decodes the pending
 *          commands, refuses a malformed body, acknowledges with a `PUT` carrying the status and an optional detail,
 *          refuses to start without a hub URL and rejects with the hub's refusal.
 * Boundary: test only; the global `fetch` is stubbed and restored.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0235 (decision 2).
 */
import { buildConfig } from "@stackra/config";
import { isRefusal } from "@stackra/errors";
import { afterEach, describe, expect, it, vi } from "@stackra/testing";
import { ZodError } from "zod";

import { DevicesConfig } from "#config/devices.config";
import { CommandStatus } from "#contracts/enums/command-status.enum";
import { DeviceCommands } from "#contracts/ports/device-commands.port";
import { DeviceCredential } from "#contracts/ports/device-credential.port";
import { HttpDeviceCommandsDriver } from "#core/drivers/http-device-commands.driver";
import { DeviceHubRefusedError } from "#core/errors/device-hub-refused.error";

class StaticCredential extends DeviceCredential {
  token(): Promise<string | undefined> {
    return Promise.resolve("device-token");
  }
}

/** A driver for a hub at `https://hub.test`, one attempt per call. */
function driver(): HttpDeviceCommandsDriver {
  return new HttpDeviceCommandsDriver(
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

describe("HttpDeviceCommandsDriver", () => {
  it("is a driver of the DeviceCommands port", () => {
    expect(driver()).toBeInstanceOf(DeviceCommands);
  });

  it("refuses to start without a hub URL", () => {
    expect(
      () => new HttpDeviceCommandsDriver(buildConfig(DevicesConfig), new StaticCredential()),
    ).toThrow(TypeError);
  });

  it("reads and decodes the pending commands", async () => {
    const seen = stubFetch(() =>
      Response.json({
        items: [
          {
            id: "cmd_1",
            name: "reboot",
            payload: {},
            issuedAt: "2026-10-24T09:00:00Z",
            expiresAt: "2026-10-24T10:00:00Z",
          },
        ],
      }),
    );
    await expect(driver().pending()).resolves.toEqual([
      {
        id: "cmd_1",
        name: "reboot",
        payload: {},
        issuedAt: new Date("2026-10-24T09:00:00.000Z"),
        expiresAt: new Date("2026-10-24T10:00:00.000Z"),
      },
    ]);
    const [request] = seen as [Request];
    expect(request.method).toBe("GET");
    expect(request.url).toBe("https://hub.test/device-commands");
    expect(request.headers.get("authorization")).toBe("Bearer device-token");
  });

  it("refuses a malformed pending body", async () => {
    stubFetch(() => Response.json({ items: [{ id: "cmd_1" }] }));
    await expect(driver().pending()).rejects.toBeInstanceOf(ZodError);
  });

  it("acknowledges with a PUT carrying the status and the detail when given", async () => {
    const seen = stubFetch(() => new Response(null, { status: 204 }));
    await driver().acknowledge("cmd_1", CommandStatus.Failed, "disk full");
    await driver().acknowledge("cmd/2", CommandStatus.Done);
    const [failed, done] = seen as [Request, Request];
    expect(failed.method).toBe("PUT");
    expect(failed.url).toBe("https://hub.test/device-commands/cmd_1/acknowledge");
    expect(await failed.json()).toEqual({ status: "failed", detail: "disk full" });
    expect(done.url).toBe("https://hub.test/device-commands/cmd%2F2/acknowledge");
    expect(await done.json()).toEqual({ status: "done" });
  });

  it("rejects with the hub's refusal", async () => {
    stubFetch(() => new Response(null, { status: 500 }));
    const failure = await driver()
      .pending()
      .catch((error: unknown) => error);
    expect(isRefusal(failure, DeviceHubRefusedError)).toBe(true);
  });
});
