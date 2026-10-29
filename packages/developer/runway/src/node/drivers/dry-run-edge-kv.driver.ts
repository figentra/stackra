/**
 * Stackra file contract:
 * Purpose: `DryRunEdgeKvDriver`, the dry-run driver of the `EdgeKvWriter` port: keeps every row the publish step
 *          would write in memory and records each call in order, so a dry run answers the exact KV copy it would
 *          write.
 * Boundary: writes nothing outside the process; the rows are lost when it is.
 * Runtime: node
 * Governing contract: ADR 0437 (the KV copy); ADR 0481 (dry runs).
 */
import { EdgeKvWriter } from "@stackra/app/contracts";
import { Driver } from "@stackra/container";

/** One recorded call. */
type EdgeKvCall = readonly ["put", string, string] | readonly ["delete", string];

/**
 * The edge KV copy in memory.
 *
 * @example
 * const kv = new DryRunEdgeKvDriver();
 * await publishProduct({ …, kv, run: dryRunCommand() });
 * kv.json("host:console.acme.example");
 */
export class DryRunEdgeKvDriver extends Driver(EdgeKvWriter) {
  /** The rows the run would leave. */
  readonly rows = new Map<string, string>();

  /** Every call, in order. */
  readonly calls: EdgeKvCall[] = [];

  /** Keeps the row and records the call. */
  override async put(key: string, value: string): Promise<void> {
    this.calls.push(["put", key, value]);
    this.rows.set(key, value);
  }

  /** Drops the row and records the call. */
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
