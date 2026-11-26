/**
 * Stackra file contract:
 * Purpose: `portFree(port, listen?)`, whether nothing listens on `port` on this machine: it binds the port on the
 *          wildcard address (Node's default, `::` dual-stack or `0.0.0.0`), then on each loopback address (127.0.0.1,
 *          ::1), and the port is free only when every bind succeeds. The wildcard bind alone is not enough: macOS lets
 *          it succeed beside a listener bound only to 127.0.0.1 or ::1 (Vite's dev server binds one loopback address),
 *          so that listener went unseen. A loopback address this machine lacks (no IPv6) is skipped.
 * Boundary: opens and closes listening sockets of this process, one at a time; accepts no connection.
 * Runtime: node
 * Governing contract: STA-1952 spec FR-019; STA-2794 (a loopback-only listener is busy).
 */
import { createServer } from "node:net";

import type { PortBind } from "#node/doctor/types/port-bind.type";

/** The addresses tried in turn: the wildcard (`undefined`, Node's default), then both loopbacks. */
const HOSTS: readonly (string | undefined)[] = [undefined, "127.0.0.1", "::1"];

/** Bind errors meaning the address family or address is missing here, not that the port is taken. */
const ABSENT = new Set(["EADDRNOTAVAIL", "EAFNOSUPPORT"]);

/** Binds `port` on `host` (the wildcard when `undefined`) and closes it again. */
function listenOnce(port: number, host: string | undefined): Promise<PortBind> {
  return new Promise((resolve) => {
    const server = createServer();
    server.once("error", (error: NodeJS.ErrnoException) =>
      resolve(error.code !== undefined && ABSENT.has(error.code) ? "absent" : "busy"),
    );
    server.listen({ port, host }, () => server.close(() => resolve("free")));
  });
}

/**
 * Whether `port` is free on every address of this machine a dev server may listen on.
 *
 * @param port - the TCP port.
 * @param listen - binds the port on one address (the wildcard when `undefined`); the real bind by default, a test passes
 *                 a fake.
 * @example
 * if (!(await portFree(3710))) fail("in use: 3710");
 */
export async function portFree(
  port: number,
  listen: (port: number, host: string | undefined) => Promise<PortBind> = listenOnce,
): Promise<boolean> {
  for (const host of HOSTS) if ((await listen(port, host)) === "busy") return false;
  return true;
}
