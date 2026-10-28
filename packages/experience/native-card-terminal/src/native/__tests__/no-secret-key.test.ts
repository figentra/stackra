/**
 * Stackra file contract:
 * Purpose: proves the package holds no Stripe secret or restricted key: no file under `src/`, `plugin/`, `ios/` or
 *          `android/` holds a string shaped like `sk_live_…`, `sk_test_…`, `rk_live_…` or `rk_test_…`
 *          (ADR 0479 decision 4 and its enforcement line).
 * Boundary: test only; reads the package's own files with node:fs and skips this file.
 * Runtime: node (vitest)
 * Governing contract: ADR 0479 (decision 4); ADR 0022 (test placement).
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "@stackra/testing";

const ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const SELF = fileURLToPath(import.meta.url);
const KEY = /\b[sr]k_(?:live|test)_[A-Za-z0-9]{8,}/;

/** Every file below `dir`. */
function filesOf(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? filesOf(path) : [path];
  });
}

describe("no Stripe key in the package", () => {
  it("finds no secret or restricted key in the sources", () => {
    const files = ["src", "plugin", "ios", "android"].flatMap((dir) => filesOf(join(ROOT, dir)));
    expect(files.length).toBeGreaterThan(10);
    const leaking = files.filter((file) => file !== SELF && KEY.test(readFileSync(file, "utf8")));
    expect(leaking).toEqual([]);
  });
});
