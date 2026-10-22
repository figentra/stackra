/**
 * Proves the refs-issue-key rule: off without a prefix, keyed types need `Refs: <PREFIX>-n`, unkeyed types do not,
 * and a different prefix does not satisfy it; the preset ships the rule off.
 */
import { describe, expect, it } from "vitest";
import preset, { refsIssueKey } from "../preset.ts";

const commit = (type: string, raw: string) => ({ type, raw });
const ok = (c: { type: string; raw: string }, prefix?: string) =>
  refsIssueKey(c, "always", prefix)[0];

describe("refs-issue-key", () => {
  it("is off in the preset and passes without a prefix", () => {
    expect(preset.rules["refs-issue-key"]).toEqual([0]);
    expect(ok(commit("feat", "feat: x"))).toBe(true);
  });

  it("requires the footer on keyed types", () => {
    for (const type of ["feat", "fix", "refactor", "perf"]) {
      expect(ok(commit(type, `${type}: x`), "STA")).toBe(false);
      expect(ok(commit(type, `${type}: x\n\nRefs: STA-12`), "STA")).toBe(true);
    }
  });

  it("does not require it on unkeyed types", () => {
    expect(ok(commit("docs", "docs: x"), "STA")).toBe(true);
    expect(ok(commit("build", "build: x"), "STA")).toBe(true);
  });

  it("rejects a wrong prefix and accepts a configured one", () => {
    expect(ok(commit("fix", "fix: x\n\nRefs: ABC-1"), "STA")).toBe(false);
    expect(ok(commit("fix", "fix: x\n\nRefs: ABC-1"), "ABC")).toBe(true);
  });
});
