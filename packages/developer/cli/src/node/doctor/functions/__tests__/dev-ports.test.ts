/**
 * Stackra file contract:
 * Purpose: hold the "dev ports free" line to STA-2794: a busy Encore dashboard port held by the current user's own
 *          Encore daemon is reused, while any other listener (another process, another user's daemon, a page that is
 *          not the dashboard, a daemon that does not answer on the user's socket) and any other busy port still fail.
 *          Covers the parsers (the daemon socket path, `/proc/net/tcp`, the dashboard page) and the real probes against
 *          a local stand-in daemon (a Unix socket and an HTTP listener of this process).
 * Boundary: local loopback sockets of this process only (a temp Unix socket, 127.0.0.1 on a random port); runs `lsof`
 *           off Linux; never touches a real Encore daemon.
 * Runtime: node (vitest)
 * Governing contract: ADR 0182 (testing strategy); STA-2794.
 */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { createServer as createHttpServer, type Server as HttpServer } from "node:http";
import { createServer, type Server } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { test } from "@stackra/testing";

import { devPortsResult } from "#node/doctor/functions/dev-ports-result.function";
import { encoreDaemonProbes } from "#node/doctor/functions/encore-daemon-probes.function";
import { encoreDaemonSocketPath } from "#node/doctor/functions/encore-daemon-socket-path.function";
import { isEncoreDashboard } from "#node/doctor/functions/is-encore-dashboard.function";
import { ownEncoreDaemon } from "#node/doctor/functions/own-encore-daemon.function";
import { procListenerUids } from "#node/doctor/functions/proc-listener-uids.function";
import type { EncoreDaemonProbes } from "#node/doctor/types/encore-daemon-probes.type";

const DASHBOARD_PAGE =
  '<!doctype html>\n<html lang="en">\n  <head>\n    <title>Encore Development Dashboard</title>\n  </head>\n</html>\n';

test("devPortsResult reuses the dashboard port the user's own Encore daemon holds", async () => {
  const asked: number[] = [];
  const line = await devPortsResult([4000, 9400], [9400], {
    portFree: async (port) => port !== 9400,
    ownEncoreDaemon: async (port) => {
      asked.push(port);
      return true;
    },
  });
  assert.equal(line?.status, "ok");
  assert.equal(line?.detail, "your Encore daemon holds 9400 (reused)");
  assert.deepEqual(asked, [9400]);
});

test("devPortsResult still fails a dashboard port held by anything else", async () => {
  const line = await devPortsResult([4000, 9400], [9400], {
    portFree: async (port) => port !== 9400,
    ownEncoreDaemon: async () => false,
  });
  assert.equal(line?.status, "fail");
  assert.equal(line?.detail, "in use: 9400");
  assert.match(line?.fix ?? "", /lsof -nP -iTCP:9400 -sTCP:LISTEN/);
});

test("devPortsResult never reuses a port outside `reusable`, even for the user's daemon", async () => {
  const asked: number[] = [];
  const line = await devPortsResult([4000, 9400, 5173], [9400], {
    portFree: async () => false,
    ownEncoreDaemon: async (port) => {
      asked.push(port);
      return true;
    },
  });
  assert.equal(line?.status, "fail");
  assert.equal(line?.detail, "in use: 4000, 5173; your Encore daemon holds 9400 (reused)");
  assert.deepEqual(asked, [9400]);
  assert.match(line?.fix ?? "", /-iTCP:4000 /);
});

test("devPortsResult is ok on free ports and absent without ports", async () => {
  const probe = {
    portFree: async () => true,
    ownEncoreDaemon: async () => assert.fail("not asked"),
  };
  const line = await devPortsResult([4000, 9400], [9400], probe);
  assert.equal(line?.status, "ok");
  assert.equal(line?.detail, undefined);
  assert.equal(await devPortsResult([], [9400], probe), undefined);
});

const probes = (patch: Partial<EncoreDaemonProbes>): EncoreDaemonProbes => ({
  listenerIsMine: async () => true,
  daemonAnswers: async () => true,
  dashboard: async () => ({ status: 200, body: DASHBOARD_PAGE }),
  ...patch,
});

test("ownEncoreDaemon needs the user's listener, the user's daemon socket and the dashboard page", async () => {
  assert.equal(await ownEncoreDaemon(9400, probes({})), true);
  // Another user's daemon (box runners share a host): the dashboard answers, but the listener is not ours.
  assert.equal(
    await ownEncoreDaemon(
      9400,
      probes({
        listenerIsMine: async () => false,
        daemonAnswers: async () => assert.fail("not asked"),
      }),
    ),
    false,
  );
  assert.equal(await ownEncoreDaemon(9400, probes({ daemonAnswers: async () => false })), false);
  assert.equal(
    await ownEncoreDaemon(
      9400,
      probes({ dashboard: async () => ({ status: 200, body: "<title>Vite</title>" }) }),
    ),
    false,
  );
  assert.equal(await ownEncoreDaemon(9400, probes({ dashboard: async () => undefined })), false);
});

test("isEncoreDashboard reads the dashboard's title on a 200 only", () => {
  assert.ok(isEncoreDashboard(200, DASHBOARD_PAGE));
  assert.ok(!isEncoreDashboard(404, DASHBOARD_PAGE));
  assert.ok(!isEncoreDashboard(200, "<title>Encore</title>"));
  assert.ok(!isEncoreDashboard(200, ""));
});

test("encoreDaemonSocketPath follows Go's os.UserCacheDir", () => {
  assert.equal(
    encoreDaemonSocketPath("darwin", { HOME: "/Users/a", XDG_CACHE_HOME: "/x" }),
    "/Users/a/Library/Caches/encore/encored.sock",
  );
  assert.equal(
    encoreDaemonSocketPath("linux", { HOME: "/home/a" }),
    "/home/a/.cache/encore/encored.sock",
  );
  assert.equal(
    encoreDaemonSocketPath("linux", { HOME: "/home/a", XDG_CACHE_HOME: "/var/cache/a" }),
    "/var/cache/a/encore/encored.sock",
  );
  assert.equal(
    encoreDaemonSocketPath("linux", { HOME: "/home/a", XDG_CACHE_HOME: "rel" }),
    undefined,
  );
  assert.equal(encoreDaemonSocketPath("linux", {}), undefined);
  assert.equal(encoreDaemonSocketPath("darwin", {}), undefined);
  assert.match(
    encoreDaemonSocketPath("win32", { LOCALAPPDATA: "C:\\L" }) ?? "",
    /encore.encored\.sock$/,
  );
  assert.equal(encoreDaemonSocketPath("win32", {}), undefined);
});

test("procListenerUids lists the owners of the LISTEN rows on the port", () => {
  const table = [
    "  sl  local_address rem_address   st tx_queue rx_queue tr tm->when retrnsmt   uid  timeout inode",
    "   0: 0100007F:24B8 00000000:0000 0A 00000000:00000000 00:00000000 00000000  1001        0 111 1 0 100 0 0 10 0",
    "   1: 0100007F:24B8 0100007F:D431 01 00000000:00000000 00:00000000 00000000  1001        0 0 1 0 20 4 30 10 -1",
    "   2: 00000000:0FA0 00000000:0000 0A 00000000:00000000 00:00000000 00000000  1002        0 112 1 0 100 0 0 10 0",
    "",
  ].join("\n");
  assert.deepEqual(procListenerUids(table, 9400), [1001]);
  assert.deepEqual(procListenerUids(table, 4000), [1002]);
  assert.deepEqual(procListenerUids(table, 4001), []);
  const tcp6 =
    "  sl  local_address                         remote_address                        st tx_queue rx_queue tr tm->when retrnsmt   uid  timeout inode\n" +
    "   0: 00000000000000000000000001000000:24B8 00000000000000000000000000000000:0000 0A 00000000:00000000 00:00000000 00000000   501        0 9 1 0 100 0 0 10 0\n";
  assert.deepEqual(procListenerUids(tcp6, 9400), [501]);
});

/** Listens and resolves once the server is up. */
const listening = <S extends Server | HttpServer>(server: S, ...args: unknown[]): Promise<S> =>
  new Promise((resolve, reject) => {
    server.once("error", reject);
    (server.listen as (...a: unknown[]) => void)(...args, () => resolve(server));
  });
const closed = (server: Server | HttpServer): Promise<void> =>
  new Promise((resolve) => {
    server.close(() => resolve());
  });

test.skipIf(process.platform === "win32")(
  "the real probes accept a stand-in daemon of this user and refuse a dead socket or another page",
  async () => {
    const dir = mkdtempSync(join(tmpdir(), "encored-"));
    const socketPath = join(dir, "encored.sock");
    const daemon = await listening(createServer(), socketPath);
    let page = DASHBOARD_PAGE;
    const dash = await listening(
      createHttpServer((_request, response) => {
        response.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(page);
      }),
      0,
      "127.0.0.1",
    );
    const address = dash.address();
    assert.ok(address !== null && typeof address === "object");
    try {
      assert.equal(await ownEncoreDaemon(address.port, encoreDaemonProbes({ socketPath })), true);
      assert.equal(
        await ownEncoreDaemon(
          address.port,
          encoreDaemonProbes({ socketPath: join(dir, "missing.sock") }),
        ),
        false,
      );
      page = "<!doctype html><title>Something else</title>";
      assert.equal(await ownEncoreDaemon(address.port, encoreDaemonProbes({ socketPath })), false);
    } finally {
      await closed(dash);
      await closed(daemon);
      rmSync(dir, { recursive: true, force: true });
    }
  },
);
