/**
 * Stackra file contract:
 * Purpose: `MemoryEdgeKv`, an in-memory `EdgeKvWriter` for the publish tests: holds the rows and records every call
 *          with all its arguments, in order.
 * Boundary: test only; never exported from an entry.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0437 (the KV copy).
 */
import { EdgeKvWriter } from "@stackra/app/contracts";
import { Driver } from "@stackra/container";

/** One recorded call. */
export type EdgeKvCall = readonly ["put", string, string] | readonly ["delete", string];

/** The edge KV copy in memory. */
export class MemoryEdgeKv extends Driver(EdgeKvWriter) {
  /** The rows. */
  readonly rows = new Map<string, string>();

  /** Every call, in order. */
  readonly calls: EdgeKvCall[] = [];

  /** Stores the row and records the call. */
  override async put(key: string, value: string): Promise<void> {
    this.calls.push(["put", key, value]);
    this.rows.set(key, value);
  }

  /** Removes the row and records the call. */
  override async delete(key: string): Promise<void> {
    this.calls.push(["delete", key]);
    this.rows.delete(key);
  }

  /** The parsed JSON row at `key`. */
  json(key: string): unknown {
    const value = this.rows.get(key);
    return value === undefined ? undefined : JSON.parse(value);
  }
}
