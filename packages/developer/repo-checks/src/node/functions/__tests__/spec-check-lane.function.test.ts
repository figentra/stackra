/**
 * Stackra file contract:
 * Purpose: unit tests of the lane, ownership and foreign-status rules and the prefix helpers: a key is matched only for
 *          the prefixes the repository's spec folders use (`os`, `sta`), never for an arbitrary `word-123`.
 * Boundary: test only; pure functions.
 * Runtime: node (vitest)
 * Governing contract: ADR 0120 D4 (lanes); ADR 0022 (test placement).
 */
import { describe, expect, it } from "@stackra/testing";

import { specCheckBug } from "#node/functions/spec-check-bug.function";
import { specCheckForeignStatus } from "#node/functions/spec-check-foreign-status.function";
import { specCheckLane } from "#node/functions/spec-check-lane.function";
import { specFolderOf } from "#node/functions/spec-folder-of.function";
import { specIsOwn } from "#node/functions/spec-is-own.function";
import { specPrefixesOf } from "#node/functions/spec-prefixes-of.function";
import { specRefsKeys } from "#node/functions/spec-refs-keys.function";

const os = ["os"];

describe("prefixes", () => {
  it("come from the spec folder names only", () => {
    expect(specFolderOf("os-12-billing")).toEqual({ prefix: "os", number: "12" });
    expect(specFolderOf("12-billing")).toBeUndefined();
    expect(specPrefixesOf(["os-12-billing", "os-3-x", "sta-1-y", "README.md", "001-x"])).toEqual([
      "os",
      "sta",
    ]);
  });
});

describe("specCheckLane", () => {
  const specKeys = new Set(["OS-163"]);
  const taskKeys = new Set(["OS-170"]);
  const feat = "feat(x): y\n\nRefs: OS-5";

  it("lets feat commits through when the branch or a Refs key reaches a spec", () => {
    expect(
      specCheckLane({ commits: ["chore: x"], branch: "feature/os-5-x", prefixes: os }),
    ).toEqual([]);
    expect(
      specCheckLane({ commits: [feat], branch: "feature/os-163-x", specKeys, prefixes: os }),
    ).toEqual([]);
    expect(specCheckLane({ commits: ["feat: y\n\nRefs: OS-170"], taskKeys, prefixes: os })).toEqual(
      [],
    );
  });

  it("names the keys it found when none reaches a spec", () => {
    expect(
      specCheckLane({
        commits: [feat],
        branch: "feature/os-5-x",
        specKeys,
        taskKeys,
        prefixes: os,
      }).join(),
    ).toMatch(/feat commit\(s\).*OS-5/);
  });

  it("ignores a word-number that is no known prefix", () => {
    const problems = specCheckLane({
      commits: ["feat: y\n\nRefs: ZZ-163"],
      branch: "feature/zz-163-x",
      specKeys,
      prefixes: os,
    });
    expect(problems.join()).toMatch(/\(none\)/);
  });
});

describe("specIsOwn and specRefsKeys", () => {
  it("own spec is the branch key's folder", () => {
    expect(specIsOwn("os-163-gates", "feature/os-163-x", os)).toBe(true);
    expect(specIsOwn("os-35-notes", "feature/os-163-x", os)).toBe(false);
    expect(specIsOwn("os-16-x", "feature/os-163-x", os)).toBe(false);
    expect(specIsOwn("os-35-notes", "chore/foo", os)).toBe(false);
  });

  it("reads keys from Refs trailers only", () => {
    expect([...specRefsKeys(["feat: a\n\nRefs: OS-1, os-2", "fix: OS-3"], os)]).toEqual([
      "OS-1",
      "OS-2",
    ]);
  });
});

const spec = (s: string): string => `# X\n\n**Status**: ${s}\n**Linear**: OS-35\n`;

describe("specCheckForeignStatus", () => {
  const base = {
    folder: "os-35-notes",
    before: spec("Draft"),
    branch: "feature/os-170-x",
    prefixes: os,
  };

  it("lets another spec's Status move only with a Refs naming its key", () => {
    expect(specCheckForeignStatus({ ...base, after: spec("Draft"), commits: ["fix: y"] })).toEqual(
      [],
    );
    expect(
      specCheckForeignStatus({
        ...base,
        after: spec("Clarified"),
        commits: ["fix: y\n\nRefs: OS-170"],
      }).join(),
    ).toMatch(/os-35-notes: .*Draft.*Clarified.*Refs: OS-35/);
    expect(
      specCheckForeignStatus({
        ...base,
        after: spec("Clarified"),
        commits: ["docs: y\n\nRefs: OS-170, OS-35"],
      }),
    ).toEqual([]);
    // OS-350 is not OS-35, and a key outside a Refs trailer does not count.
    expect(
      specCheckForeignStatus({
        ...base,
        after: spec("Clarified"),
        commits: ["docs: OS-35\n\nRefs: OS-350"],
      }),
    ).toHaveLength(1);
  });

  it("exempts the own spec and a new spec, and counts a removed line as a change", () => {
    expect(
      specCheckForeignStatus({ ...base, branch: "feature/os-35-x", after: spec("Planned") }),
    ).toEqual([]);
    expect(specCheckForeignStatus({ ...base, before: "", after: spec("Draft") })).toEqual([]);
    expect(specCheckForeignStatus({ ...base, after: "# X\n" })).toHaveLength(1);
  });
});

describe("specCheckBug", () => {
  it("needs a keyed folder and a regression test tagged with its key", () => {
    expect(specCheckBug("os-44-crash", "/** @covers os-44:BUG */", os)).toEqual([]);
    expect(specCheckBug("os-44-crash", "nothing", os).join()).toMatch(/@covers os-44:BUG/);
    expect(specCheckBug("44-crash", "", os).join()).toMatch(/not `os-<n>-<slug>`/);
  });
});
