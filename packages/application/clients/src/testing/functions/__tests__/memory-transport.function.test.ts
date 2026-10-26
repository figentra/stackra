/**
 * Stackra file contract:
 * Purpose: unit tests of `memoryTransport` and the clients testing plugin: the plugin offers `ClientFake` as the
 *          `memory` candidate of `clients.ClientTransport`; `memoryTransport` returns the app's fake and refuses any
 *          other transport.
 * Boundary: test only; a stand-in app with `get`, no container boot.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; STA-1297.
 */
import { describe, expect, it } from "@stackra/testing";

import { ClientTransport } from "#contracts/ports/client-transport.port";
import { ClientFake } from "#testing/client.fake";
import { CLIENTS_TESTING_PLUGIN } from "#testing/constants/clients-testing-plugin.constant";
import { memoryTransport } from "#testing/functions/memory-transport.function";

/** A stand-in app whose `get` returns `transport` for `ClientTransport`. */
const appWith = (transport: object) =>
  ({
    get: (token: unknown) => {
      if (token !== ClientTransport) throw new Error("unexpected token");
      return transport;
    },
  }) as unknown as Parameters<typeof memoryTransport>[0];

describe("CLIENTS_TESTING_PLUGIN", () => {
  it("offers ClientFake as the memory ClientTransport", async () => {
    const [driver] = CLIENTS_TESTING_PLUGIN.drivers ?? [];
    expect(driver?.port).toBe(ClientTransport);
    expect(driver?.key).toBe("clients.ClientTransport");
    expect(Object.keys(driver?.candidates ?? {})).toEqual(["memory"]);
    expect(await driver?.candidates["memory"]?.()).toBe(ClientFake);
  });
});

describe("memoryTransport", () => {
  it("returns the app's fake", () => {
    const fake = new ClientFake();
    expect(memoryTransport(appWith(fake))).toBe(fake);
  });

  it("refuses a transport that is not the memory driver", () => {
    expect(() => memoryTransport(appWith({}))).toThrow(/useDrivers\("memory"\)/);
  });
});
