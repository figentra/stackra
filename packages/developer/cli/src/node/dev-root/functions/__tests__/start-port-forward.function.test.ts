/**
 * Stackra file contract:
 * Purpose: unit tests of `startPortForward`: a request to the forwarded port reaches the gateway with its method, path,
 *          headers and body and the answer comes back; an upgrade is piped both ways; a gateway that is down answers
 *          502 naming its port; a taken port is refused; `close` stops listening.
 * Boundary: test only; loopback servers on free ports.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-2664 (item 2); STA-2840.
 */
import { createServer, request, type Server } from "node:http";
import { connect } from "node:net";

import { afterEach, describe, expect, it } from "@stackra/testing";

import { startPortForward } from "#node/dev-root/functions/start-port-forward.function";
import type { PortForward } from "#node/dev-root/types/port-forward.type";

const opened: { close: () => unknown }[] = [];

/** A gateway that echoes the request and answers upgrades with the bytes it gets back. */
async function gateway(): Promise<{ server: Server; port: number }> {
  const server = createServer((incoming, outgoing) => {
    let body = "";
    incoming.on("data", (chunk: Buffer) => (body += chunk.toString()));
    incoming.on("end", () => {
      outgoing.writeHead(201, { "x-gateway": "yes" });
      outgoing.end(`${incoming.method} ${incoming.url} ${incoming.headers["x-probe"]} ${body}`);
    });
  });
  server.on("upgrade", (_incoming, socket) => {
    socket.write(
      "HTTP/1.1 101 Switching Protocols\r\nUpgrade: echo\r\nConnection: Upgrade\r\n\r\n",
    );
    socket.on("data", (chunk: Buffer) => socket.write(chunk));
  });
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });
  opened.push({ close: () => server.close() });
  const address = server.address();
  return { server, port: typeof address === "object" && address !== null ? address.port : 0 };
}

/** Starts a forward on a free port and remembers it for cleanup. */
async function forward(target: number): Promise<PortForward> {
  const started = await startPortForward(0, target, ["127.0.0.1"]);
  opened.push(started);
  return started;
}

/** One request through `port`. */
function call(
  port: number,
  body: string,
): Promise<{ status: number; header: unknown; text: string }> {
  return new Promise((resolve, reject) => {
    const sent = request(
      {
        host: "127.0.0.1",
        port,
        method: "POST",
        path: "/inbox/v1?x=1",
        headers: { "x-probe": "p" },
      },
      (answer) => {
        let text = "";
        answer.on("data", (chunk: Buffer) => (text += chunk.toString()));
        answer.on("end", () =>
          resolve({ status: answer.statusCode ?? 0, header: answer.headers["x-gateway"], text }),
        );
      },
    );
    sent.on("error", reject);
    sent.end(body);
  });
}

afterEach(async () => {
  for (const item of opened.splice(0)) await item.close();
});

describe("startPortForward", () => {
  it("forwards a request to the gateway and its answer back", async () => {
    const { port } = await gateway();
    const started = await forward(port);
    expect(await call(started.ports[0] as number, "hello")).toEqual({
      status: 201,
      header: "yes",
      text: "POST /inbox/v1?x=1 p hello",
    });
  });

  it("pipes an upgrade both ways", async () => {
    const { port } = await gateway();
    const started = await forward(port);
    const socket = connect(started.ports[0] as number, "127.0.0.1");
    opened.push({ close: () => socket.destroy() });
    const received = await new Promise<string>((resolve) => {
      let text = "";
      socket.on("data", (chunk: Buffer) => {
        text += chunk.toString();
        if (text.includes("ping")) resolve(text);
        else if (text.includes("\r\n\r\n")) socket.write("ping");
      });
      socket.write(
        "GET /live HTTP/1.1\r\nHost: localhost\r\nUpgrade: echo\r\nConnection: Upgrade\r\n\r\n",
      );
    });
    expect(received).toContain("101 Switching Protocols");
    expect(received.endsWith("ping")).toBe(true);
  });

  it("answers 502 naming the port when the gateway is down", async () => {
    const { server, port } = await gateway();
    await new Promise((resolve) => {
      server.close(resolve);
    });
    const started = await forward(port);
    const answer = await call(started.ports[0] as number, "");
    expect(answer.status).toBe(502);
    expect(answer.text).toContain(`the gateway on port ${port} did not answer`);
  });

  it("refuses a taken port and stops listening on close", async () => {
    const { port } = await gateway();
    const started = await startPortForward(0, port, ["127.0.0.1"]);
    const taken = started.ports[0] as number;
    await expect(startPortForward(taken, port, ["127.0.0.1"])).rejects.toThrow(
      `cannot forward port ${taken}`,
    );
    await started.close();
    await expect(call(taken, "")).rejects.toThrow(/ECONNREFUSED/);
  });
});
