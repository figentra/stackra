/**
 * Stackra file contract:
 * Purpose: `ServeLocalMcpOptions`, what `serveLocalMcp` needs: the CLI's version and, all defaulted, the repository
 *          root, the stdio streams, the CLI runner and the upstream Encore connection.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5); R-29.
 */
import type { Readable, Writable } from "node:stream";

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
};
