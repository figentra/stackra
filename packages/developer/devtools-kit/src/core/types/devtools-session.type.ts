/**
 * Stackra file contract:
 * Purpose: `DevtoolsSession`, how an attached host reads the kit: the tabs it may see and their data, the RPC
 *          functions, and the buffered stream.
 * Boundary: a type only. Every method throws (or rejects with) `DevtoolsError("detached")` once the host detached.
 * Runtime: isomorphic
 * Governing contract: ADR 0246 (decisions 2 to 4).
 */
import type { DevtoolsEvent } from "#core/types/devtools-event.type";
import type { DevtoolsTabMetadata } from "#core/types/devtools-tab-metadata.type";

/** An attached host's view of the kit. */
export interface DevtoolsSession {
  /** The tabs this host may see, sorted by `order` then id. */
  tabs: () => readonly DevtoolsTabMetadata[];

  /**
   * Reads one tab's data.
   *
   * @throws DevtoolsError `unknown_tab` when no tab has that id or it is sensitive and the host did not accept that.
   */
  readTab: (id: string) => Promise<unknown>;

  /** The RPC names, sorted. */
  rpcNames: () => readonly string[];

  /**
   * Calls one RPC function with the host's arguments.
   *
   * @throws DevtoolsError `unknown_rpc` when no package defined that name.
   */
  call: (name: string, ...args: readonly unknown[]) => Promise<unknown>;

  /** The buffered stream, oldest first; only `channel` when given. */
  replay: (channel?: string) => readonly DevtoolsEvent[];
}
