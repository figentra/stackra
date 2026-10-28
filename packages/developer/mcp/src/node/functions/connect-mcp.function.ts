/**
 * Stackra file contract:
 * Purpose: `connectMcp(input, output, handle?)`, an MCP stdio connection over two streams: newline-delimited JSON-RPC
 *          2.0 both ways. The returned peer sends requests and notifications; `handle` answers what the other end
 *          sends. The local server and the Encore proxy client are both one of these.
 * Boundary: framing and correlation only; no MCP method is known here. A line that is not JSON is answered with a
 *           parse error; a response to no waiting request is dropped.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5: local mode over stdio); R-29.
 */
import type { Readable, Writable } from "node:stream";

import { McpProtocolError } from "#node/errors/mcp-protocol.error";
import type { McpHandler } from "#node/types/mcp-handler.type";
import type { McpPeer } from "#node/types/mcp-peer.type";

/** One parsed JSON-RPC message. */
type Message = {
  readonly id?: number | string | null;
  readonly method?: unknown;
  readonly params?: unknown;
  readonly result?: unknown;
  readonly error?: { readonly code: number; readonly message: string };
};

/** The default handler: every method is unknown. */
const unknownMethod: McpHandler = (method) =>
  Promise.reject(new McpProtocolError(-32_601, `Method not found: ${method}`));

/**
 * A connection reading `input` and writing `output`.
 *
 * @param input - where the other end's messages arrive (a child's stdout, or this process's stdin).
 * @param output - where this end's messages go.
 * @param handle - answers incoming requests and notifications; defaults to refusing every method.
 * @example
 * const encore = connectMcp(child.stdout, child.stdin);
 * await encore.request("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo });
 */
export function connectMcp(
  input: Readable,
  output: Writable,
  handle: McpHandler = unknownMethod,
): McpPeer {
  let nextId = 1;
  let isClosed = false;
  let settle!: () => void;
  const closed = new Promise<void>((resolve) => {
    settle = resolve;
  });
  const pending = new Map<
    number | string,
    { resolve: (value: unknown) => void; reject: (error: Error) => void }
  >();

  const send = (message: object): void => {
    if (!isClosed && output.writable)
      output.write(`${JSON.stringify({ jsonrpc: "2.0", ...message })}\n`);
  };

  const respond = async (id: number | string, method: string, params: unknown): Promise<void> => {
    try {
      send({ id, result: (await handle(method, params)) ?? {} });
    } catch (error) {
      const code = error instanceof McpProtocolError ? error.code : -32_603;
      send({ id, error: { code, message: (error as Error).message } });
    }
  };

  const receive = (line: string): void => {
    if (line.trim() === "") return;
    let message: Message;
    try {
      message = JSON.parse(line) as Message;
    } catch {
      send({ id: null, error: { code: -32_700, message: "Parse error" } });
      return;
    }
    if (typeof message.method === "string") {
      if (message.id === undefined || message.id === null)
        void handle(message.method, message.params).catch(() => {});
      else void respond(message.id, message.method, message.params);
      return;
    }
    if (message.id === undefined || message.id === null) return;
    const waiting = pending.get(message.id);
    if (waiting === undefined) return;
    pending.delete(message.id);
    if (message.error)
      waiting.reject(new McpProtocolError(message.error.code, message.error.message));
    else waiting.resolve(message.result);
  };

  const end = (): void => {
    if (isClosed) return;
    isClosed = true;
    for (const waiting of pending.values()) waiting.reject(new Error("MCP connection closed"));
    pending.clear();
    settle();
  };

  let buffer = "";
  input.setEncoding("utf8");
  input.on("data", (chunk: string) => {
    buffer += chunk;
    for (let at = buffer.indexOf("\n"); at !== -1; at = buffer.indexOf("\n")) {
      const line = buffer.slice(0, at);
      buffer = buffer.slice(at + 1);
      receive(line);
    }
  });
  input.on("end", end);
  input.on("close", end);
  input.on("error", end);
  // A peer that exits makes the next write fail with EPIPE; that ends the connection instead of the process.
  output.on("error", end);

  return {
    request: (method, params) =>
      new Promise((resolve, reject) => {
        if (isClosed) {
          reject(new Error("MCP connection closed"));
          return;
        }
        const id = nextId++;
        pending.set(id, { resolve, reject });
        send({ id, method, ...(params === undefined ? {} : { params }) });
      }),
    notify: (method, params) => send({ method, ...(params === undefined ? {} : { params }) }),
    close: () => {
      end();
      input.destroy();
      if (!output.destroyed) output.end();
    },
    closed,
  };
}
