/**
 * Stackra file contract:
 * Purpose: unit tests of `withLocalEncoreApp`: while the run runs, `encore.app` carries the id `""` and every other
 *          field gen wrote; afterwards (also when the run throws) gen's file is back byte for byte; a file something
 *          else rewrote meanwhile is kept; a missing, non-object or already local-only file is left untouched; and a
 *          stopping signal puts the file back first.
 * Boundary: test only; a temporary member root, and a fake run.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0182 (decision 3); STA-2838.
 */
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { withLocalEncoreApp } from "#node/functions/local-encore-app.function";

let root: string;
const file = () => join(root, "encore.app");
const read = () => readFileSync(file(), "utf8");
const GENERATED = `${JSON.stringify({ id: "acme-platform", lang: "typescript" }, null, 2)}\n`;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-encore-app-"));
});

afterEach(() => {
  vi.restoreAllMocks();
  rmSync(root, { recursive: true, force: true });
});

describe(withLocalEncoreApp, () => {
  it("runs with the id emptied and every other field kept, then puts gen's file back", async () => {
    writeFileSync(file(), GENERATED);
    const seen = await withLocalEncoreApp(root, async () => JSON.parse(read()) as unknown);
    expect(seen).toEqual({ id: "", lang: "typescript" });
    expect(read()).toBe(GENERATED);
  });

  it("puts gen's file back when the run throws", async () => {
    writeFileSync(file(), GENERATED);
    await expect(
      withLocalEncoreApp(root, async () => {
        throw new Error("encore test crashed");
      }),
    ).rejects.toThrow("encore test crashed");
    expect(read()).toBe(GENERATED);
  });

  it("keeps a file something else rewrote while the run ran", async () => {
    writeFileSync(file(), GENERATED);
    const regenerated = `${JSON.stringify({ id: "acme-next", lang: "typescript" }, null, 2)}\n`;
    await withLocalEncoreApp(root, async () => writeFileSync(file(), regenerated));
    expect(read()).toBe(regenerated);
  });

  it("leaves a missing, non-object or already local-only file as it is", async () => {
    expect(await withLocalEncoreApp(root, async () => existsSync(file()))).toBe(false);
    for (const text of ["not json", "[1]\n", `${JSON.stringify({ id: "" })}\n`]) {
      writeFileSync(file(), text);
      expect(await withLocalEncoreApp(root, async () => read())).toBe(text);
      expect(read()).toBe(text);
    }
  });

  it("puts gen's file back before a stopping signal ends the process", async () => {
    writeFileSync(file(), GENERATED);
    const kill = vi.spyOn(process, "kill").mockImplementation(() => true);
    const listeners = process.listenerCount("SIGTERM");
    await withLocalEncoreApp(root, async () => {
      process.emit("SIGTERM", "SIGTERM");
      expect(read()).toBe(GENERATED);
    });
    expect(kill).toHaveBeenCalledWith(process.pid, "SIGTERM");
    expect(process.listenerCount("SIGTERM")).toBe(listeners);
  });
});
