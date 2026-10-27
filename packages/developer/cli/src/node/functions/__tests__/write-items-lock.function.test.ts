/**
 * Stackra file contract:
 * Purpose: unit tests of `readItemsLock` and `writeItemsLock`: an empty lock when the file is missing, a round trip
 *          with items sorted by name, and an invalid lock refused on read and on write.
 * Boundary: test only; writes a throwaway workspace in the OS temp directory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0453 (decision 11).
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { ItemsLock } from "@stackra/skills/contracts";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { readItemsLock } from "#node/functions/read-items-lock.function";
import { writeItemsLock } from "#node/functions/write-items-lock.function";

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-lock-"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

const entry = (target: string) =>
  ({ kind: "skill", version: "0.1.0", integrity: "sha512-AAAA", target }) as const;

describe("items lock", () => {
  it("is empty before the first add", () => {
    expect(readItemsLock(root)).toEqual({ lockfileVersion: 1, items: {} });
  });

  it("round-trips with items sorted by name", () => {
    const lock: ItemsLock = {
      lockfileVersion: 1,
      items: {
        "@stackra/skill-zed": entry(".agents/skills/zed"),
        "@stackra/skill-abc": entry(".agents/skills/abc"),
      },
    };
    writeItemsLock(root, lock);
    const text = readFileSync(join(root, "stackra-items.lock.yaml"), "utf8");
    expect(text.indexOf("skill-abc")).toBeLessThan(text.indexOf("skill-zed"));
    expect(readItemsLock(root)).toEqual(lock);
  });

  it("refuses an invalid lock on read and on write", () => {
    writeFileSync(join(root, "stackra-items.lock.yaml"), "lockfileVersion: 2\nitems: {}\n");
    expect(() => readItemsLock(root)).toThrow();
    expect(() =>
      writeItemsLock(root, {
        lockfileVersion: 1,
        items: { "@stackra/skill-x": entry("../outside") },
      }),
    ).toThrow();
  });
});
