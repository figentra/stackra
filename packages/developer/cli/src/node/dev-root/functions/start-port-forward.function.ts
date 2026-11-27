/**
 * Stackra file contract:
 * Purpose: `startPortForward(port, target, hosts?)`, a plain forward of one dev port to the gateway `encore run`
 *          serves: every HTTP request (method, path, headers and body as sent) and every upgrade (WebSocket, SSE over
 *          an upgrade) goes to `localhost:<target>` and its answer comes back. In one Encore app every service answers
 *          on the gateway, so a URL that names a member's own dev port (a relay subscriber's inbox, a client's base URL,
 *          `stackra dev --surface --api`) still reaches it.
 * Boundary: listens on the loopback addresses only (127.0.0.1 and ::1 by default), never on the network. A request
 *           the gateway does not answer gets 502 naming the port. Rewrites nothing: the Host header is the caller's.
 * Runtime: node
 * Governing contract: STA-2664 (item 2: stackra dev forwards member ports to the gateway); ADR 0296 (decision 3);
 *                     STA-2840.
 */
import { createServer, request, type Server } from "node:http";
import { connect, type Socket } from "node:net";

import type { PortForward } from "#node/dev-root/types/port-forward.type";

/** The loopback hosts a forward listens on. */
const LOOPBACK = ["127.0.0.1", "::1"] as const;

/** The head of an upgrade request, as the client sent it. */
const head = (method: string, url: string, version: string, raw: readonly string[]): string => {
  const lines = [`${method} ${url} HTTP/${version}`];
  for (let index = 0; index < raw.length; index += 2)
    lines.push(`${raw[index]}: ${raw[index + 1]}`);
  return `${lines.join("\r\n")}\r\n\r\n`;
};

/** A server that forwards to `localhost:<target>`. */
function forwardServer(target: number, sockets: Set<Socket>): Server {
  const server = createServer((incoming, outgoing) => {
    const upstream = request(
      {
        host: "localhost",
        port: target,
        method: incoming.method,
        path: incoming.url,
        headers: incoming.headers,
      },
      (answer) => {
        outgoing.writeHead(answer.statusCode ?? 502, answer.statusMessage, answer.rawHeaders);
        answer.pipe(outgoing);
      },
    );
    upstream.on("error", (error) => {
      if (!outgoing.headersSent) outgoing.writeHead(502, { "content-type": "text/plain" });
      outgoing.end(
        `stackra dev: the gateway on port ${target} did not answer (${error.message})\n`,
      );
    });
    incoming.pipe(upstream);
  });
  server.on("connection", (socket) => {
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
  });
  server.on("upgrade", (incoming, socket: Socket, first: Buffer) => {
    const upstream = connect({ host: "localhost", port: target }, () => {
      upstream.write(
        head(
          incoming.method ?? "GET",
          incoming.url ?? "/",
          incoming.httpVersion,
          incoming.rawHeaders,
        ),
      );
      if (first.length > 0) upstream.write(first);
      upstream.pipe(socket);
      socket.pipe(upstream);
    });
    sockets.add(upstream);
    upstream.on("close", () => sockets.delete(upstream));
    upstream.on("error", () => socket.destroy());
    socket.on("error", () => upstream.destroy());
  });
  return server;
}

/**
 * Forwards `port` to the gateway on `target`.
 *
 * @param port - the port to listen on (0 picks a free one, for tests).
 * @param target - the gateway port.
 * @param hosts - the addresses to listen on; an address the machine lacks (no IPv6) is skipped.
 * @returns the ports and addresses it listens on, and `close`.
 * @throws Error when no address could be listened on (the port is taken).
 * @example
 * const forward = await startPortForward(4019, 4000);
 * await forward.close();
 */
export async function startPortForward(
  port: number,
  target: number,
  hosts: readonly string[] = LOOPBACK,
): Promise<PortForward> {
  const sockets = new Set<Socket>();
  const servers: Server[] = [];
  const ports: number[] = [];
  const addresses: string[] = [];
  let failure: Error | undefined;
  for (const host of hosts) {
    const server = forwardServer(target, sockets);
    try {
      await new Promise<void>((resolve, reject) => {
        server.once("error", reject);
        server.listen(port, host, () => resolve());
      });
      servers.push(server);
      const address = server.address();
      const bound = typeof address === "object" && address !== null ? address : undefined;
      ports.push(bound?.port ?? port);
      addresses.push(bound?.address ?? host);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      // A machine without IPv6 (or without that address) has nothing to listen on there.
      if (code !== "EADDRNOTAVAIL" && code !== "EAFNOSUPPORT") failure = error as Error;
    }
  }
  if (servers.length === 0 || failure !== undefined) {
    await Promise.all(
      servers.map(
        (server) =>
          new Promise((resolve) => {
            server.close(resolve);
          }),
      ),
    );
    throw new Error(
      `cannot forward port ${port} to the gateway: ${failure?.message ?? "no loopback address"}`,
    );
  }
  return {
    ports,
    addresses,
    close: async () => {
      for (const socket of sockets) socket.destroy();
      await Promise.all(
        servers.map(
          (server) =>
            new Promise((resolve) => {
              server.close(resolve);
            }),
        ),
      );
    },
  };
}
