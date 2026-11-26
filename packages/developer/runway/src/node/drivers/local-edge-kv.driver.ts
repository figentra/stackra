/**
 * Stackra file contract:
 * Purpose: `LocalEdgeKvDriver`, the file driver of the `EdgeKvWriter` port: keeps the edge KV copy's rows in one JSON
 *          file on the machine (`file`, `.stackra/preview/edge-kv.json` relative to the working folder by default), so
 *          a local edge (`previewServe`) reads back what a publish wrote, as the edge Worker reads Workers KV.
 * Boundary: writes only its file, read and rewritten whole on each change; one process writes at a time. Rows are public
 *           edge data (ADR 0437 decision 3): no secret belongs in them.
 * Runtime: node
 * Governing contract: ADR 0437 (the KV copy); STA-1676 (the testbed's local console).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { EdgeKvWriter } from "@stackra/app/contracts";
import { Driver } from "@stackra/container";

import { PREVIEW_SERVE_SETTINGS } from "#node/constants/preview-serve-settings.constant";

/**
 * The edge KV copy in a local file.
 *
 * @example
 * const kv = Object.assign(new LocalEdgeKvDriver(), { file: ".stackra/preview/edge-kv.json" });
 * await kv.put("release:acme:console", JSON.stringify(release));
 * kv.json("release:acme:console");
 */
export class LocalEdgeKvDriver extends Driver(EdgeKvWriter) {
  /** The JSON file holding every row. */
  file: string = PREVIEW_SERVE_SETTINGS.kvFile;

  /** Stores the row, replacing any there. */
  override async put(key: string, value: string): Promise<void> {
    this.save({ ...this.rows(), [key]: value });
  }

  /** Removes the row; a missing one is not an error. */
  override async delete(key: string): Promise<void> {
    const { [key]: _removed, ...rest } = this.rows();
    this.save(rest);
  }

  /** The row at `key`, or `null`. */
  override async read(key: string): Promise<string | null> {
    return this.get(key);
  }

  /** The row at `key`, or `null`. */
  get(key: string): string | null {
    return this.rows()[key] ?? null;
  }

  /** The parsed JSON row at `key`, or `null`. */
  json<T>(key: string): T | null {
    const value = this.get(key);
    return value === null ? null : (JSON.parse(value) as T);
  }

  /** Every row, by key; none while the file does not exist. */
  rows(): Record<string, string> {
    return existsSync(this.file)
      ? (JSON.parse(readFileSync(this.file, "utf8")) as Record<string, string>)
      : {};
  }

  /** Writes every row. */
  private save(rows: Record<string, string>): void {
    mkdirSync(dirname(this.file), { recursive: true });
    writeFileSync(this.file, `${JSON.stringify(rows, null, 2)}\n`);
  }
}
