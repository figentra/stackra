/**
 * Stackra file contract:
 * Purpose: unit tests of `specFindings`, the orchestrator the `spec` phase runs: stage gate per changed spec folder, legacy
 *          `specs/` paths, lane gate and trace rules, over an in-memory repository (git, reads and listings injected)
 *          whose specs use the prefix `os`.
 * Boundary: test only; no disk, no git.
 * Runtime: node (vitest)
 * Governing contract: ADR 0120 (spec gates); ADR 0198; ADR 0022 (test placement).
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "@stackra/testing";

import { specFindings } from "#node/functions/spec-findings.function";

const FOLDER = "os-901-widget";
const DIR = `.agents/specs/${FOLDER}`;
const read = (name: string): string =>
  readFileSync(fileURLToPath(new URL(`fixtures/sdd/${FOLDER}/${name}`, import.meta.url)), "utf8");

/** An in-memory repository: its files, the changed paths and the PR's commit messages. */
function repo(
  files: Record<string, string>,
  {
    changed = [] as string[],
    commits = [] as string[],
    branch = "feature/os-901-x",
    requireReady = false,
  } = {},
) {
  return specFindings({
    base: "origin/main",
    branch,
    requireReady,
    git: (args) => {
      if (args[0] === "diff") return changed.join("\n");
      if (args[0] === "log") return commits.map((c) => `${c}\0`).join("");
      if (args[0] === "merge-base") return "abc123\n";
      if (args[0] === "ls-files")
        return Object.keys(files)
          .filter((f) => f.includes("__tests__"))
          .join("\n");
      return null;
    },
    exists: (path) => path in files || Object.keys(files).some((f) => f.startsWith(`${path}/`)),
    read: (path) => files[path],
    list: (path) => [
      ...new Set(
        Object.keys(files)
          .filter((f) => f.startsWith(`${path}/`))
          .map((f) => f.slice(path.length + 1).split("/")[0] ?? ""),
      ),
    ],
  });
}

const widget = (): Record<string, string> => ({
  [`${DIR}/spec.md`]: read("spec.md"),
  [`${DIR}/plan.md`]: read("plan.md"),
  [`${DIR}/tasks.md`]: read("tasks.md"),
  ".agents/routing.yaml": "tasks:\n  tests:\n    x: 1\n  spec-task:\n    x: 1\n",
});
const TOUCHED = [
  `${DIR}/spec.md`,
  "packages/foundation/widget/src/build.ts",
  "apps/docs/src/docs/guides/widget.mdx",
];
const TESTS = {
  "x/__tests__/a.test.ts": "// @covers os-901:P-001\n",
  "packages/foundation/widget/src/__tests__/build.test.ts": "",
};

describe("specFindings", () => {
  it("finds nothing when no spec folder changed and no feat commit needs one", () => {
    expect(repo(widget(), { changed: ["src/a.ts"], commits: ["chore: x"] })).toEqual([]);
  });

  it("passes a changed Done spec whose tests cover it", () => {
    const files = { ...widget(), "packages/foundation/widget/src/build.ts": "", ...TESTS };
    expect(repo(files, { changed: TOUCHED, commits: ["feat: w\n\nRefs: OS-901"] })).toEqual([]);
  });

  it("reports a broken changed spec as a spec-gate finding at its folder", () => {
    const files = {
      ...widget(),
      [`${DIR}/tasks.md`]: read("tasks.md").replace("route: tests", "route: nope"),
    };
    const findings = repo(files, { changed: [`${DIR}/tasks.md`] }).filter(
      (f) => f.rule === "spec-gate",
    );
    expect(findings).toEqual([
      expect.objectContaining({
        phase: "spec",
        rule: "spec-gate",
        path: DIR,
        severity: "error",
        message: expect.stringMatching(/route `nope`/),
      }),
    ]);
  });

  it("reports drift and missing coverage of a Done spec as spec-trace findings", () => {
    const findings = repo(
      { ...widget(), "packages/foundation/widget/src/build.ts": "" },
      { changed: [`${DIR}/spec.md`] },
    );
    const messages = findings.filter((f) => f.rule === "spec-trace").map((f) => f.message);
    expect(messages.join("\n")).toMatch(/Impact's doc/);
    expect(messages.join("\n")).toMatch(/FR-001 has no test carrying `@covers os-901:FR-001`/);
  });

  it("holds the PR's own spec to Tasked on a ready PR, and only that one", () => {
    const draft = read("spec.md").replace("**Status**: Done", "**Status**: Draft");
    const files = { ...widget(), [`${DIR}/spec.md`]: draft };
    const own = repo(files, { changed: [`${DIR}/spec.md`], requireReady: true });
    expect(own.map((f) => f.message).join()).toMatch(/ready-for-review PR/);
    const other = repo(files, {
      changed: [`${DIR}/spec.md`],
      requireReady: true,
      branch: "feature/os-5-x",
    });
    expect(other.map((f) => f.message).join()).not.toMatch(/ready-for-review PR/);
  });

  it("refuses a path under a root specs folder", () => {
    const findings = repo(
      { ...widget(), "specs/old/spec.md": "x" },
      { changed: ["specs/old/spec.md"] },
    );
    expect(findings).toEqual([
      expect.objectContaining({ rule: "spec-gate", path: "specs/old/spec.md" }),
    ]);
  });

  it("needs a spec behind a feat commit's key, and waits for the first spec folder", () => {
    const lane = repo(widget(), { commits: ["feat: x\n\nRefs: OS-5"], branch: "feature/os-5-x" });
    expect(lane.map((f) => f.message).join()).toMatch(/feat commit\(s\).*OS-5/);
    expect(repo({ ".agents/specs/README.md": "x" }, { commits: ["feat: x"] })).toEqual([]);
  });

  it("reads the bug lane's regression tag", () => {
    const files = { ...widget(), ".specify/bugs/os-44-crash/notes.md": "x" };
    const findings = repo(files, { changed: [".specify/bugs/os-44-crash/notes.md"] });
    expect(findings.map((f) => f.message).join()).toMatch(/@covers os-44:BUG/);
  });
});
