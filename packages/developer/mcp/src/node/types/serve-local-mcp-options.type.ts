/**
 * Stackra file contract:
 * Purpose: `ServeLocalMcpOptions`, what `serveLocalMcp` needs: the CLI's version and, all defaulted, the repository
 *          root, the stdio streams, the CLI runner, the upstream Encore connection and the signal that stops the server.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5); R-29.
 */
import type { Readable, Writable } from "node:stream";

import type { LocalTool } from "#node/types/local-tool.type";
import type { McpPeer } from "#node/types/mcp-peer.type";
import type { StackraRunner } from "#node/types/stackra-runner.type";

/** Options of `serveLocalMcp`. */
export type ServeLocalMcpOptions = {
  /** The version the server reports; `@stackra/cli` passes its own. */
  readonly version: string;
  /** The repository root; defaults to the working directory. */
  readonly root?: string;
  /** Where requests arrive; defaults to standard input. */
  readonly input?: Readable;
  /** Where answers go; defaults to standard output. */
  readonly output?: Writable;
  /** Runs `stackra` commands; defaults to spawning the `stackra` binary in `root`. */
  readonly run?: StackraRunner;
  /**
   * The local Encore MCP to proxy, `null` for none; defaults to `encore mcp run` for the root runway's
   * `providers.encore.app`.
   */
  readonly encore?: McpPeer | null;

  /**
   * Tools from CLI command definitions (`toolsOf` of `@stackra/console`), served with the command's own schema and
   * handler; one named like a built-in tool replaces it.
   */
  readonly tools?: readonly LocalTool[];

  /**
   * Stops the server: aborting closes `input`, which ends the connection as a disconnecting client does, so the
   * server resolves and closes the Encore proxy. A client stops a stdio server with SIGTERM, and a server that keeps
   * reading standard input outlives it.
   */
  readonly signal?: AbortSignal;
};
