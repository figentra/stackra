/**
 * Stackra file contract:
 * Purpose: `PreviewServer`, a running local edge: its origin, the KV copy it reads, and how to stop it.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: STA-1676.
 */
import type { LocalEdgeKvDriver } from "#node/drivers/local-edge-kv.driver";

/** A running local edge. */
export type PreviewServer = {
  /** The origin it serves, `http://127.0.0.1:4173`. */
  readonly url: string;
  /** The KV copy it reads the rows from. */
  readonly kv: LocalEdgeKvDriver;
  /** Stops listening and closes open connections. */
  readonly close: () => Promise<void>;
};
