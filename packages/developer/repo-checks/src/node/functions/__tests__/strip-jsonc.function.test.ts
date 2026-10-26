/**
 * Stackra file contract:
 * Purpose: unit tests of `stripJsonc` and `readJsonc`: comments outside strings and trailing commas go, a `//` inside
 *          a string stays, and an unterminated block comment throws.
 * Boundary: test only; `readJsonc` reads one temporary file.
 * Runtime: node (vitest)
 * Governing contract: the JSON vs JSONC rule (STA-299); ADR 0022 (test placement).
 */
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "@stackra/testing";

import { readJsonc } from "#node/functions/read-jsonc.function";
import { stripJsonc } from "#node/functions/strip-jsonc.function";

describe("stripJsonc", () => {
  it("drops comments and trailing commas but keeps string contents", () => {
    const text = '{\n  // a note\n  "url": "https://x//y", /* inline */\n  "list": [1, 2,],\n}\n';
    expect(JSON.parse(stripJsonc(text))).toEqual({ url: "https://x//y", list: [1, 2] });
  });

  it("refuses an unterminated block comment", () => {
    expect(() => stripJsonc('{ /* open "a": 1 }')).toThrow(/unterminated/);
  });

  it("readJsonc parses a file from disk", () => {
    const file = join(mkdtempSync(join(tmpdir(), "repo-checks-")), "turbo.jsonc");
    writeFileSync(file, '// header\n{ "tags": ["tier:lib"], }\n');
    expect(readJsonc(file)).toEqual({ tags: ["tier:lib"] });
  });
});
