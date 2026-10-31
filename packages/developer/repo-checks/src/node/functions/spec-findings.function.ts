/**
 * Stackra file contract:
 * Purpose: `specFindings(options)`, the read-only spec checks of a repository that keeps spec-kit specs in
 *          `.agents/specs`: stage gate for every spec folder changed since the base, legacy `specs/` paths,
 *          foreign-status and bug-lane gates, the lane gate, then the trace rules (drift while Implementing, drift and
 *          test coverage at Done).
 * Boundary: no console, no process exit, no issue tracker, no package manager; git, file reads and existence are
 *           injected, so the check is testable and the CLI and core's wrapper pass real ones.
 * Runtime: node
 * Governing contract: ADR 0120 (SDLC spec location, lanes and change risk); ADR 0198; ADR 0282 (decision 3). Loaded by
 *                     plain Node from source by core's `tools/scripts` wrappers, so it imports values by relative
 *                     `.ts` paths and uses erasable TypeScript only (ADR 0421 decision 2).
 */
import { SPECS_DIR } from "../constants/spec-dir.constant.ts";
import type { Finding } from "../types/finding.type.ts";
import type { SpecFindingsOptions } from "../types/spec-findings-options.type.ts";
import { specAtLeast } from "./spec-at-least.function.ts";
import { specCheckBug } from "./spec-check-bug.function.ts";
import { specCheckForeignStatus } from "./spec-check-foreign-status.function.ts";
import { specCheckLane } from "./spec-check-lane.function.ts";
import { specCheckStage } from "./spec-check-stage.function.ts";
import { specDrift } from "./spec-drift.function.ts";
import { specFolderOf } from "./spec-folder-of.function.ts";
import { specImpactOf } from "./spec-impact-of.function.ts";
import { specIsOwn } from "./spec-is-own.function.ts";
import { specMemberOf } from "./spec-member-of.function.ts";
import { specParseTasks } from "./spec-parse-tasks.function.ts";
import { specPrefixesOf } from "./spec-prefixes-of.function.ts";
import { specRoutes } from "./spec-routes.function.ts";
import { specStatusOf } from "./spec-status-of.function.ts";
import { specTraceProblems } from "./spec-trace-problems.function.ts";
import { specTrace } from "./spec-trace.function.ts";

/** The last path segment. */
const folderName = (path: string): string => path.slice(path.lastIndexOf("/") + 1);

/** The unique repository-relative folders `pattern` finds in the changed paths. */
const foldersOf = (names: readonly string[], pattern: RegExp): string[] => [
  ...new Set(names.flatMap((n) => pattern.exec(n)?.[0] ?? [])),
];

/**
 * Every problem the spec gates and the trace rules find.
 *
 * @param options - the base ref, branch, ready flag and the injected git, exists, read and list.
 * @example
 * specFindings({ base: "origin/main", branch: "os-12-x", requireReady: false, git, exists, read, list });
 */
export function specFindings(options: SpecFindingsOptions): Finding[] {
  const { base, branch, requireReady, git, exists, read, list } = options;
  const out: Finding[] = [];
  const add = (rule: "spec-gate" | "spec-trace", path: string, message: string): void => {
    out.push({
      phase: "spec",
      tool: "spec",
      rule,
      path,
      line: null,
      column: null,
      message,
      severity: "error",
      fixable: false,
      adr: /\bADR (\d{4})\b/.exec(message)?.[1] ?? null,
    });
  };
  const text = (path: string): string => read(path) ?? "";

  const folders = list(SPECS_DIR);
  const prefixes = specPrefixesOf(folders);
  const names = (git(["diff", "--name-only", `${base}...HEAD`]) ?? "").split("\n").filter(Boolean);
  const dirs = foldersOf(names, /^\.agents\/specs\/[^/]+(?=\/)/).filter((p) => exists(p));
  const bugs = foldersOf(names, /^\.specify\/bugs\/[^/]+(?=\/)/).filter((p) => exists(p));
  const known = specRoutes(text(".agents/routing.yaml"));

  const commits = (git(["log", "--no-merges", "--format=%B%x00", `${base}..HEAD`]) ?? "")
    .split("\0")
    .map((c) => c.trim())
    .filter(Boolean);
  let tests: string | undefined;
  const testsText = (): string =>
    (tests ??= (git(["ls-files", "*__tests__/*"]) ?? "")
      .split("\n")
      .filter((f) => /\.test\.[cm]?[jt]sx?$/.test(f))
      .map((f) => text(f))
      .join("\n"));

  for (const p of names.filter((n) => n.startsWith("specs/") && exists(n)))
    add("spec-gate", p, `specs live in ${SPECS_DIR}/<prefix>-<n>-<slug>/, not specs/`);

  for (const dir of dirs) {
    const spec = `${dir}/spec.md`;
    const problems = exists(spec)
      ? specCheckStage(folderName(dir), text(spec), {
          files: list(dir),
          tasks: text(`${dir}/tasks.md`),
          plan: text(`${dir}/plan.md`),
          known,
          prefixes,
        })
      : ["spec.md is missing"];
    const status = specStatusOf(text(spec));
    if (
      requireReady &&
      specIsOwn(folderName(dir), branch, prefixes) &&
      !["abandoned", "superseded"].includes(status) &&
      !specAtLeast(status, "tasked")
    )
      problems.push(
        `status ${status || "(none)"} on a ready-for-review PR: a spec PR stays a draft until Tasked (SPEC_GATE_REQUIRE_READY)`,
      );
    for (const p of problems) add("spec-gate", dir, p);
  }

  const mergeBase = (git(["merge-base", base, "HEAD"]) ?? "").trim();
  if (mergeBase)
    for (const dir of dirs)
      for (const p of specCheckForeignStatus({
        folder: folderName(dir),
        before: git(["show", `${mergeBase}:${dir}/spec.md`]) ?? "",
        after: text(`${dir}/spec.md`),
        branch,
        commits,
        prefixes,
      }))
        add("spec-gate", ".", p);

  for (const b of bugs)
    for (const p of specCheckBug(folderName(b), testsText(), prefixes)) add("spec-gate", ".", p);

  // shortcut: with no spec folder there is no prefix to read a key by, so the lane gate waits for the first spec.
  if (prefixes.length > 0) {
    const specKeys = new Set(
      folders.flatMap((f) => {
        const parsed = specFolderOf(f);
        return parsed ? `${parsed.prefix.toUpperCase()}-${parsed.number}` : [];
      }),
    );
    const taskKeys = new Set(
      folders.flatMap((f) =>
        specParseTasks(text(`${SPECS_DIR}/${f}/tasks.md`), prefixes).flatMap((t) => t.key ?? []),
      ),
    );
    for (const p of specCheckLane({ commits, branch, specKeys, taskKeys, prefixes }))
      add("spec-gate", ".", p);
  }

  const specs = dirs
    .filter((d) => exists(`${d}/spec.md`))
    .map((d) => ({
      dir: d,
      folder: folderName(d),
      spec: text(`${d}/spec.md`),
      plan: text(`${d}/plan.md`),
      tasks: text(`${d}/tasks.md`),
    }));
  const named = new Set(
    names
      .map(specMemberOf)
      .filter((m): m is string => m !== undefined)
      .filter((m) => specs.some((s) => specImpactOf(s.spec).includes(m))),
  );
  for (const s of specs) {
    const status = specStatusOf(s.spec);
    if (status !== "implementing" && status !== "done") continue;
    const problems = specDrift({ ...s, changed: names, exists, named, prefixes });
    const prefix = specFolderOf(s.folder)?.prefix ?? "";
    if (status === "done")
      problems.push(
        ...specTraceProblems(specTrace({ ...s, tests: testsText(), prefixes }), prefix),
      );
    for (const p of problems) add("spec-trace", s.dir, p);
  }
  return out;
}
