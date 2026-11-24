/**
 * Stackra file contract:
 * Purpose: unit tests of `probeHosts`: every IPv4 address of a host gets its own probe, which is ok when the TLS handshake
 *          (port 443, the host's name as server name, the timeout given) finishes and not ok on a timeout or an error;
 *          a host that does not resolve is one failed probe with an empty address; the socket is destroyed after each
 *          answer; hosts are probed side by side.
 * Boundary: test only; `node:dns/promises` and `node:tls` are fakes, no network is used.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-1952 spec FR-016.
 */
import { beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { probeHosts } from "#node/doctor/functions/probe-hosts.function";

/** How a fake socket ends: the event it emits once it is created. */
type Outcome = "secureConnect" | "timeout" | "error" | "never";

const fake = vi.hoisted(() => ({
  addresses: {} as Record<string, string[]>,
  outcomes: {} as Record<string, string>,
  sockets: [] as Array<{ options: Record<string, unknown>; destroyed: boolean }>,
  lookups: [] as Array<{ host: string; options: unknown }>,
}));

vi.mock("node:dns/promises", () => ({
  lookup: async (host: string, options: unknown) => {
    fake.lookups.push({ host, options });
    const found = fake.addresses[host];
    if (found === undefined) throw new Error("ENOTFOUND");
    return found.map((address) => ({ address, family: 4 }));
  },
}));

vi.mock("node:tls", async () => {
  const { EventEmitter: Emitter } = await import("node:events");
  return {
    connect: (options: Record<string, unknown>) => {
      const socket = Object.assign(new Emitter(), {
        options,
        destroyed: false,
        destroy() {
          this.destroyed = true;
        },
      });
      fake.sockets.push(socket);
      const outcome = fake.outcomes[String(options["host"])] ?? "secureConnect";
      if (outcome !== "never") queueMicrotask(() => socket.emit(outcome, new Error("tls failed")));
      return socket;
    },
  };
});

beforeEach(() => {
  fake.addresses = {};
  fake.outcomes = {};
  fake.sockets = [];
  fake.lookups = [];
});

const outcome = (address: string, how: Outcome): void => {
  fake.outcomes[address] = how;
};

describe("probeHosts", () => {
  it("probes every IPv4 address of a host: the handshake goes to port 443 with the host's name and the timeout", async () => {
    fake.addresses["github.com"] = ["140.82.1.1", "140.82.1.2"];
    const probes = await probeHosts(["github.com"], 1234);

    expect(probes).toEqual([
      { host: "github.com", address: "140.82.1.1", ok: true },
      { host: "github.com", address: "140.82.1.2", ok: true },
    ]);
    expect(fake.lookups).toEqual([{ host: "github.com", options: { all: true, family: 4 } }]);
    expect(fake.sockets.map((socket) => socket.options)).toEqual([
      { host: "140.82.1.1", port: 443, servername: "github.com", timeout: 1234 },
      { host: "140.82.1.2", port: 443, servername: "github.com", timeout: 1234 },
    ]);
  });

  it("waits 4 seconds for a handshake when no timeout is given", async () => {
    fake.addresses["example.test"] = ["192.0.2.1"];
    await probeHosts(["example.test"]);
    expect(fake.sockets[0]?.options["timeout"]).toBe(4000);
  });

  it("fails an address whose handshake times out or errors, and keeps the ones that finish", async () => {
    fake.addresses["a.test"] = ["192.0.2.1", "192.0.2.2", "192.0.2.3"];
    outcome("192.0.2.1", "timeout");
    outcome("192.0.2.2", "error");
    const probes = await probeHosts(["a.test"]);

    expect(probes.map((probe) => [probe.address, probe.ok])).toEqual([
      ["192.0.2.1", false],
      ["192.0.2.2", false],
      ["192.0.2.3", true],
    ]);
  });

  it("destroys every socket once it has answered", async () => {
    fake.addresses["a.test"] = ["192.0.2.1", "192.0.2.2"];
    outcome("192.0.2.2", "timeout");
    await probeHosts(["a.test"]);
    expect(fake.sockets).toHaveLength(2);
    expect(fake.sockets.every((socket) => socket.destroyed)).toBe(true);
  });

  it("reports a host that does not resolve as one failed probe with no address, and opens no socket for it", async () => {
    expect(await probeHosts(["nowhere.test"])).toEqual([
      { host: "nowhere.test", address: "", ok: false },
    ]);
    expect(fake.sockets).toHaveLength(0);

    fake.addresses["empty.test"] = [];
    expect(await probeHosts(["empty.test"])).toEqual([
      { host: "empty.test", address: "", ok: false },
    ]);
  });

  it("probes several hosts and returns their probes in the order the hosts were given", async () => {
    fake.addresses["one.test"] = ["192.0.2.10"];
    fake.addresses["two.test"] = ["192.0.2.20", "192.0.2.21"];
    outcome("192.0.2.21", "error");
    const probes = await probeHosts(["two.test", "gone.test", "one.test"]);

    expect(probes.map((probe) => `${probe.host}|${probe.address}|${probe.ok}`)).toEqual([
      "two.test|192.0.2.20|true",
      "two.test|192.0.2.21|false",
      "gone.test||false",
      "one.test|192.0.2.10|true",
    ]);
  });

  it("returns nothing for no host", async () => {
    expect(await probeHosts([])).toEqual([]);
  });
});
