/**
 * Stackra file contract:
 * Purpose: hold `portFree` to STA-2794: a port is busy when anything listens on it, on the wildcard address or on one
 *          loopback address only (macOS lets a wildcard bind succeed beside a listener on 127.0.0.1 or ::1, so the
 *          wildcard bind alone missed it); an address this machine lacks is skipped; a free port is free.
 * Boundary: listening sockets of this process on loopback (random ports), plus a fake bind; nothing else.
 * Runtime: node (vitest)
 * Governing contract: ADR 0182 (testing strategy); STA-1952 spec FR-019; STA-2794.
 */
import assert from "node:assert/strict";
import { createServer, type Server } from "node:net";

import { test } from "@stackra/testing";

import { portFree } from "#node/doctor/functions/port-free.function";
import type { PortBind } from "#node/doctor/types/port-bind.type";

/** Listens on a random port of `host`; `undefined` when the machine has no such address. */
function listen(host: string): Promise<{ server: Server; port: number } | undefined> {
  return new Promise((resolve) => {
    const server = createServer();
    server.once("error", () => resolve(undefined));
    server.listen(0, host, () => {
      const address = server.address();
      resolve(
        typeof address === "object" && address !== null
          ? { server, port: address.port }
          : undefined,
      );
    });
  });
}

const close = (server: Server): Promise<void> =>
  new Promise((resolve) => {
    server.close(() => resolve());
  });

/** A bind where only ::1 is taken. */
const onlyLoopbackV6Busy = async (_port: number, host: string | undefined): Promise<PortBind> =>
  host === "::1" ? "busy" : "free";

test("portFree tries the wildcard, then 127.0.0.1, then ::1, and a busy loopback makes the port busy", async () => {
  const tried: (string | undefined)[] = [];
  const onlyLoopbackV4Busy = async (_port: number, host: string | undefined): Promise<PortBind> => {
    tried.push(host);
    return host === "127.0.0.1" ? "busy" : "free";
  };
  assert.equal(await portFree(3710, onlyLoopbackV4Busy), false);
  assert.deepEqual(tried, [undefined, "127.0.0.1"]);

  assert.equal(await portFree(3710, onlyLoopbackV6Busy), false);
});

test("portFree skips a loopback address the machine lacks and is free when every bind is", async () => {
  const tried: (string | undefined)[] = [];
  const noIpv6 = async (_port: number, host: string | undefined): Promise<PortBind> => {
    tried.push(host);
    return host === "::1" ? "absent" : "free";
  };
  assert.equal(await portFree(3710, noIpv6), true);
  assert.deepEqual(tried, [undefined, "127.0.0.1", "::1"]);
});

test("portFree sees a real listener bound only to 127.0.0.1", async () => {
  const held = await listen("127.0.0.1");
  assert.ok(held, "127.0.0.1 is available");
  try {
    assert.equal(await portFree(held.port), false);
  } finally {
    await close(held.server);
  }
  assert.equal(await portFree(held.port), true);
});

test("portFree sees a real listener bound only to ::1 (when the machine has IPv6)", async (context) => {
  const held = await listen("::1");
  if (held === undefined) {
    context.skip("no ::1 on this machine");
    return;
  }
  try {
    assert.equal(await portFree(held.port), false);
  } finally {
    await close(held.server);
  }
});

test("portFree sees a real listener on the wildcard address", async () => {
  const server = createServer();
  const port = await new Promise<number>((resolve) => {
    server.listen(0, () => {
      const address = server.address();
      resolve(typeof address === "object" && address !== null ? address.port : 0);
    });
  });
  try {
    assert.equal(await portFree(port), false);
  } finally {
    await close(server);
  }
});
