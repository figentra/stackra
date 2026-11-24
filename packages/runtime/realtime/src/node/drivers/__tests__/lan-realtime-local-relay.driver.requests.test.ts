/**
 * Stackra file contract:
 * Purpose: unit tests of the requests `LanRealtimeLocalRelayDriver` refuses or answers beyond the keyed happy path: any
 *          path but the realtime one is 404 before the key is looked at; a method it does not serve is 405 once the key
 *          is right and 401 before; a body over 64 KiB is 413 and is relayed to no one, and the relay keeps serving;
 *          an idle stream gets a comment line every 25 s; a peer that answers with another key's refusal is not a relay
 *          (`discover` goes on to the next peer, then null); the advertised address is the configured one, else the first
 *          non-internal IPv4 address, else loopback.
 * Boundary: test only; a real node:http server on a loopback port the operating system picked, fetched in-process; the
 *           network interfaces are a fake; only `setInterval` is faked, so the sockets run on real time.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0225 (decisions 1 and 2); ADR 0173.
 */
import { request } from "node:http";
import { createServer } from "node:net";
import type { AddressInfo } from "node:net";
import { networkInterfaces } from "node:os";
import type { NetworkInterfaceInfo } from "node:os";

import { buildConfig } from "@stackra/config";
import { SecretStore } from "@stackra/config/contracts";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { RealtimeConfig } from "#config/realtime.config";
import { LanRealtimeLocalRelayDriver } from "#node/drivers/lan-realtime-local-relay.driver";

vi.mock("node:os", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  networkInterfaces: vi.fn(),
}));

/** A loopback port nothing holds right now: the operating system picks one on the wildcard address the relay binds. */
async function freePort(): Promise<number> {
  const probe = createServer();
  await new Promise<void>((resolve, reject) => {
    probe.once("error", reject);
    probe.listen(0, resolve);
  });
  const { port } = probe.address() as AddressInfo;
  await new Promise<void>((resolve) => {
    probe.close(() => {
      resolve();
    });
  });
  return port;
}

/** A secret store holding the venue key `key`. */
function secretsOf(key: string): SecretStore {
  return new (class extends SecretStore {
    get(name: string): string | undefined {
      return name === "REALTIME_LOCAL_RELAY_KEY" ? key : undefined;
    }
  })();
}

/** A relay driver with the venue key, on `port`, advertising `address` (empty: choose one), probing `peers`. */
function relayWith(
  port: number,
  { key = "venue-key", address = "127.0.0.1", peers = [] as string[] } = {},
): LanRealtimeLocalRelayDriver {
  return new LanRealtimeLocalRelayDriver(
    buildConfig(RealtimeConfig, {
      values: {
        localRelayPort: port,
        localRelayAddress: address,
        localRelayPeers: peers,
        localRelayProbeMs: 500,
      },
      secrets: secretsOf(key),
    }),
  );
}

/** A network interface as `os.networkInterfaces()` reports one. */
function iface(address: string, family: "IPv4" | "IPv6", internal = false): NetworkInterfaceInfo {
  return { address, netmask: "", family, mac: "", internal, cidr: null } as NetworkInterfaceInfo;
}

/** The status a POST of `size` bytes with the venue key gets, or "reset" when the server drops the connection. */
function postOf(origin: string, size: number): Promise<number | "reset"> {
  return new Promise((resolve) => {
    const outgoing = request(
      `${origin}/realtime`,
      { method: "POST", headers: { authorization: "Bearer venue-key" } },
      (incoming) => {
        incoming.resume();
        resolve(incoming.statusCode ?? 0);
      },
    );
    outgoing.on("error", () => resolve("reset"));
    outgoing.end(Buffer.alloc(size, 0x61));
  });
}

let hosting: LanRealtimeLocalRelayDriver | undefined;

beforeEach(() => {
  vi.mocked(networkInterfaces).mockReturnValue({});
});

afterEach(async () => {
  vi.useRealTimers();
  await hosting?.stop();
  hosting = undefined;
});

/** A relay hosting on a fresh port, and its origin. */
async function host(options?: Parameters<typeof relayWith>[1]) {
  const port = await freePort();
  hosting = relayWith(port, options);
  await hosting.host();
  return { port, origin: `http://127.0.0.1:${port}` };
}

describe("LanRealtimeLocalRelayDriver requests", () => {
  it("answers 404 for any path but the realtime one, with or without the key", async () => {
    const { origin } = await host();
    const keyed = await fetch(`${origin}/elsewhere`, {
      headers: { authorization: "Bearer venue-key" },
    });
    expect(keyed.status).toBe(404);
    expect((await fetch(`${origin}/`)).status).toBe(404);
  });

  it("answers 401 to a missing or wrong key, and 405 to a method it does not serve once the key is right", async () => {
    const { origin } = await host();
    expect((await fetch(`${origin}/realtime`, { method: "PUT" })).status).toBe(401);
    expect(
      (
        await fetch(`${origin}/realtime`, {
          method: "PUT",
          headers: { authorization: "Bearer no" },
        })
      ).status,
    ).toBe(401);
    for (const method of ["PUT", "DELETE", "PATCH"]) {
      const answer = await fetch(`${origin}/realtime`, {
        method,
        headers: { authorization: "Bearer venue-key" },
      });
      expect(answer.status).toBe(405);
    }
  });

  it("refuses a body over 64 KiB and relays it to no one, and keeps serving", async () => {
    const { origin } = await host();
    const stream = await fetch(`${origin}/realtime?token=venue-key`);
    const reader = stream.body?.getReader();
    await reader?.read(); // ": open"

    expect(await postOf(origin, 65_536 + 1)).toBe(413);

    const heard = await Promise.race([
      reader?.read().then((chunk) => new TextDecoder().decode(chunk.value)),
      new Promise<string>((resolve) => {
        setTimeout(() => resolve("silence"), 300);
      }),
    ]);
    expect(heard).toBe("silence");

    const message = { channel: "tenant.scp_1.floor", name: "floor.table.seated.v1", id: "evt_9" };
    const posted = await fetch(`${origin}/realtime`, {
      method: "POST",
      headers: { authorization: "Bearer venue-key" },
      body: JSON.stringify(message),
    });
    expect(posted.status).toBe(202);
    await reader?.cancel();
  });

  it("keeps an idle stream alive with a comment line every 25 seconds", async () => {
    const { origin } = await host();
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
    const stream = await fetch(`${origin}/realtime?token=venue-key`);
    const reader = stream.body?.getReader();
    expect(new TextDecoder().decode((await reader?.read())?.value)).toBe(": open\n\n");
    vi.advanceTimersByTime(25_000);
    expect(new TextDecoder().decode((await reader?.read())?.value)).toBe(": ping\n\n");
    await reader?.cancel();
  });

  it("does not take a peer that refuses the venue key for a relay: discover goes on, then answers null", async () => {
    const strangerPort = await freePort();
    const strangerOrigin = `http://127.0.0.1:${strangerPort}`;
    const stranger = relayWith(strangerPort, { key: "another-venue-key" });
    await stranger.host();
    try {
      const real = await host();
      const searching = relayWith(await freePort(), { peers: [strangerOrigin, real.origin] });
      expect(await searching.discover()).toEqual({ origin: real.origin, token: "venue-key" });
      const onlyStranger = relayWith(await freePort(), { peers: [strangerOrigin] });
      expect(await onlyStranger.discover()).toBeNull();
    } finally {
      await stranger.stop();
    }
  });

  it("advertises the configured address, else the first non-internal IPv4 address, else loopback", async () => {
    const port = await freePort();
    const advertised = async (address: string): Promise<string> => {
      hosting = relayWith(port, { address });
      const target = await hosting.host();
      await hosting.stop();
      hosting = undefined;
      return target.origin;
    };
    vi.mocked(networkInterfaces).mockReturnValue({
      lo: [iface("127.0.0.1", "IPv4", true)],
      eth0: [iface("fe80::1", "IPv6"), iface("192.168.1.20", "IPv4"), iface("10.0.0.5", "IPv4")],
      gone: undefined,
    });
    expect(await advertised("")).toBe(`http://192.168.1.20:${port}`);
    expect(await advertised("203.0.113.9")).toBe(`http://203.0.113.9:${port}`);
    vi.mocked(networkInterfaces).mockReturnValue({
      lo: [iface("127.0.0.1", "IPv4", true)],
      eth0: [iface("fe80::1", "IPv6")],
    });
    expect(await advertised("")).toBe(`http://127.0.0.1:${port}`);
  });
});
