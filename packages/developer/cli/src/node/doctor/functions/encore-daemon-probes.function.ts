/**
 * Stackra file contract:
 * Purpose: `encoreDaemonProbes(options?)`, the real reads behind `ownEncoreDaemon`: who owns the listener on a port
 *          (`/proc/net/tcp` and `/proc/net/tcp6` on Linux, `lsof -Fu` elsewhere: without root it sees only the user's
 *          own processes), whether the user's Encore daemon answers on its socket (`encoreDaemonSocketPath`), and the
 *          answer to `GET /` on the port of 127.0.0.1.
 * Boundary: read-only: reads two /proc tables, runs `lsof` (a status read), opens and closes one Unix socket and sends
 *           one local HTTP GET. Sends nothing to the daemon's socket and prints nothing.
 * Runtime: node
 * Governing contract: STA-2794 (a second `stackra dev` reuses the user's own Encore daemon).
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createConnection } from "node:net";

import { encoreDaemonSocketPath } from "#node/doctor/functions/encore-daemon-socket-path.function";
import { procListenerUids } from "#node/doctor/functions/proc-listener-uids.function";
import type { EncoreDaemonProbes } from "#node/doctor/types/encore-daemon-probes.type";

/** The most of the dashboard's page that is read: its title is in the first lines. */
const MAX_BODY = 64 * 1024;

/** The user ids that listen on `port`, as this platform tells them. */
function listenerUids(platform: NodeJS.Platform, port: number): number[] {
  if (platform === "linux")
    return ["/proc/net/tcp", "/proc/net/tcp6"].flatMap((table) => {
      try {
        return procListenerUids(readFileSync(table, "utf8"), port);
      } catch {
        return [];
      }
    });
  const r = spawnSync("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN", "-Fu"], {
    encoding: "utf8",
    timeout: 10_000,
  });
  if (r.error !== undefined || r.status !== 0) return [];
  return (r.stdout ?? "")
    .split("\n")
    .filter((line) => line.startsWith("u"))
    .map((line) => Number(line.slice(1)))
    .filter(Number.isInteger);
}

/**
 * The real probes.
 *
 * @param options - `platform` (default `process.platform`), `socketPath` (default the current user's daemon socket),
 *                  `timeoutMs` for the socket and the HTTP read (default 2 s).
 * @example
 * await ownEncoreDaemon(9400, encoreDaemonProbes());
 */
export function encoreDaemonProbes(
  options: {
    readonly platform?: NodeJS.Platform;
    readonly socketPath?: string;
    readonly timeoutMs?: number;
  } = {},
): EncoreDaemonProbes {
  const platform = options.platform ?? process.platform;
  const timeoutMs = options.timeoutMs ?? 2000;
  const socketPath = options.socketPath ?? encoreDaemonSocketPath(platform, process.env);
  return {
    listenerIsMine: async (port) => {
      const uid = process.getuid?.();
      if (uid === undefined) return false;
      const uids = listenerUids(platform, port);
      return uids.length > 0 && uids.every((owner) => owner === uid);
    },
    daemonAnswers: () =>
      new Promise((resolve) => {
        if (socketPath === undefined) {
          resolve(false);
          return;
        }
        const socket = createConnection({ path: socketPath, timeout: timeoutMs });
        const done = (ok: boolean) => {
          socket.destroy();
          resolve(ok);
        };
        socket.once("connect", () => done(true));
        socket.once("timeout", () => done(false));
        socket.once("error", () => done(false));
      }),
    dashboard: async (port) => {
      try {
        const response = await fetch(`http://127.0.0.1:${port}/`, {
          redirect: "manual",
          signal: AbortSignal.timeout(timeoutMs),
        });
        return { status: response.status, body: (await response.text()).slice(0, MAX_BODY) };
      } catch {
        return undefined;
      }
    },
  };
}
