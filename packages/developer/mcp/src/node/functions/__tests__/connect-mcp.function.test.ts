/**
 * Stackra file contract:
 * Purpose: unit tests of `connectMcp`: two connected peers exchange requests, results and notifications over
 *          newline-delimited JSON split across chunks; a handler's `McpProtocolError` reaches the caller with its code;
 *          an unknown method and a line that is not JSON get the JSON-RPC errors; closing fails waiting requests.
 * Boundary: test only; in-memory streams.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 5).
 */
import { PassThrough } from "node:stream";

import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { McpProtocolError } from "#node/errors/mcp-protocol.error";
import { connectMcp } from "#node/functions/connect-mcp.function";
import type { McpHandler } from "#node/types/mcp-handler.type";

/** Two peers wired to each other; `server` answers with `handle`. */
function pair(handle?: McpHandler) {
  const toServer = new PassThrough();
  const toClient = new PassThrough();
  return {
    client: connectMcp(toClient, toServer),
    server: connectMcp(toServer, toClient, handle),
    toServer,
    toClient,
  };
}

/** The next line written to `stream`, parsed. */
const nextMessage = (stream: PassThrough): Promise<Record<string, unknown>> =>
  new Promise((resolve) => {
    stream.once("data", (chunk: Buffer) => resolve(JSON.parse(chunk.toString())));
  });

describe("connectMcp", () => {
  it("answers a request with the handler's result and passes notifications", async () => {
    const handle = vi.fn<McpHandler>(async (method, params) => ({ method, params }));
    const { client } = pair(handle);

    await expect(client.request("tools/list", { cursor: "a" })).resolves.toEqual({
      method: "tools/list",
      params: { cursor: "a" },
    });
    client.notify("notifications/initialized");
    await vi.waitFor(() =>
      expect(handle).toHaveBeenCalledWith("notifications/initialized", undefined),
    );
  });

  it("carries a handler's error code and refuses unknown methods by default", async () => {
    const { client } = pair(async () => {
      throw new McpProtocolError(-32602, "Unknown tool: deploy");
    });
    await expect(client.request("tools/call")).rejects.toMatchObject({
      code: -32602,
      message: "Unknown tool: deploy",
    });

    const { client: other } = pair();
    await expect(other.request("anything")).rejects.toMatchObject({ code: -32601 });
  });

  it("reassembles a message split across chunks and answers bad JSON with a parse error", async () => {
    const input = new PassThrough();
    const output = new PassThrough();
    connectMcp(input, output, async () => "pong");

    const reply = nextMessage(output);
    input.write('{"jsonrpc":"2.0","id":7,"meth');
    input.write('od":"ping"}\n');
    await expect(reply).resolves.toEqual({ jsonrpc: "2.0", id: 7, result: "pong" });

    const parseError = nextMessage(output);
    input.write("not json\n");
    await expect(parseError).resolves.toMatchObject({ id: null, error: { code: -32700 } });
  });

  it("fails waiting requests when the other end closes", async () => {
    const { client, toClient } = pair(() => new Promise(() => {}));
    const waiting = client.request("tools/list");
    toClient.end();
    await expect(waiting).rejects.toThrow("MCP connection closed");
    await expect(client.closed).resolves.toBeUndefined();
    await expect(client.request("ping")).rejects.toThrow("MCP connection closed");
  });
});
