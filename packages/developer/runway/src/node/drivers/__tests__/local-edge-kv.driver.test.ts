/**
 * Stackra file contract:
 * Purpose: unit tests of `LocalEdgeKvDriver`: rows put are read back as text and JSON, survive a new driver on the same
 *          file, a delete removes one row and deleting a missing key is no error, and a missing file reads as empty.
 * Boundary: test only; a temporary folder.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0437 (the KV copy); STA-1676.
 */
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { EdgeKvWriter } from "@stackra/app/contracts";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { LocalEdgeKvDriver } from "#node/drivers/local-edge-kv.driver";

let folder = "";
let file = "";

beforeEach(() => {
  folder = mkdtempSync(join(tmpdir(), "local-edge-kv-"));
  file = join(folder, "nested", "edge-kv.json");
});

afterEach(() => {
  rmSync(folder, { recursive: true, force: true });
});

describe("LocalEdgeKvDriver", () => {
  it("keeps rows in its file, read back by another driver", async () => {
    const kv = Object.assign(new LocalEdgeKvDriver(), { file });
    expect(kv).toBeInstanceOf(EdgeKvWriter);
    expect(kv.rows()).toEqual({});

    await kv.put("release:acme:console", JSON.stringify({ version: "1.0.0" }));
    await kv.put("host:console.acme", "{}");

    const again = Object.assign(new LocalEdgeKvDriver(), { file });
    expect(again.json("release:acme:console")).toEqual({ version: "1.0.0" });
    expect(again.get("host:console.acme")).toBe("{}");
    expect(again.get("missing")).toBeNull();
  });

  it("deletes a row, and a missing key is no error", async () => {
    const kv = Object.assign(new LocalEdgeKvDriver(), { file });
    await kv.put("a", "1");
    await kv.put("b", "2");
    await kv.delete("a");
    await kv.delete("never");

    expect(kv.rows()).toEqual({ b: "2" });
  });
});
