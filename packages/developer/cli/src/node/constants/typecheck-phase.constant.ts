/**
 * Stackra file contract:
 * Purpose: `TYPECHECK_PHASE`, phase 9 of `stackra check`: `turbo run typecheck` (only the members changed since the base
 *          and their dependents with `--affected`), one finding per compiler error, located in its member. When turbo
 *          is absent or refuses the task graph (a `^build` dependency cycle), it falls back to `tsc --noEmit -p
 *          <member>` in every member with a tsconfig.json (only the members holding an affected file with `--affected`).
 * Boundary: starts turbo, else tsc per member (a few at a time); skipped when neither can start. Paths are mapped from
 *           the turbo task prefix to the member directory through each member's package.json name.
 * Runtime: node
 * Governing contract: ADR 0129; the task vocabulary rule (root commands run `turbo run <task>`).
 */
import { existsSync, readFileSync } from "node:fs";
import { availableParallelism } from "node:os";
import { join, relative } from "node:path";

import type { Finding } from "@stackra/repo-checks/node";

import { exitFinding } from "#node/functions/exit-finding.function";
import { runCaptured } from "#node/functions/run-captured.function";
import { toolFinding } from "#node/functions/tool-finding.function";
import { workspaceMembers } from "#node/functions/workspace-members.function";
import type { CheckPhase } from "#node/types/check-phase.type";
import type { ToolOutput } from "#node/types/tool-output.type";

/** `<package>:typecheck: <rest>`, the prefix turbo puts on each task line. */
const PREFIX = /^(\S+?):typecheck: (.*)$/;
/** `file(line,col): error TS1234: message`, or the `file:line:col - error TS1234: message` form. */
const DIAGNOSTIC = /^(.+?)(?:\((\d+),(\d+)\): |:(\d+):(\d+) - )(error|warning) (TS\d+): (.*)$/;
/** What turbo prints when the task graph has a cycle, so it runs no task at all. */
const CYCLE = /dependency cycle|cyclic dependency/i;

/** Package name to member directory, relative to `root`. */
function memberDirs(root: string): Map<string, string> {
  const dirs = new Map<string, string>();
  if (!existsSync(join(root, "pnpm-workspace.yaml"))) return dirs;
  for (const member of workspaceMembers(root)) {
    const name = (
      JSON.parse(readFileSync(join(member, "package.json"), "utf8")) as { name?: string }
    ).name;
    if (name !== undefined) dirs.set(name, relative(root, member));
  }
  return dirs;
}

/** The finding of one compiler diagnostic line, its path prefixed with `dir`, or `undefined` for any other line. */
function diagnostic(line: string, dir: string | undefined): Finding | undefined {
  const match = DIAGNOSTIC.exec(line);
  if (!match) return undefined;
  const [, file = "", r1, c1, r2, c2, severity, rule = "tsc", message = ""] = match;
  return toolFinding(TYPECHECK_PHASE, {
    rule,
    path: dir === undefined || dir === "" ? file : join(dir, file),
    line: Number(r1 ?? r2 ?? 0) || null,
    column: Number(c1 ?? c2 ?? 0) || null,
    message,
    severity: severity === "warning" ? "warning" : "error",
  });
}

/**
 * `tsc --noEmit -p <member>` in each member with a tsconfig.json, a few at a time; `undefined` when tsc cannot start
 * anywhere.
 */
async function perMember(
  root: string,
  files: readonly string[] | undefined,
): Promise<readonly Finding[] | undefined> {
  const dirs = existsSync(join(root, "pnpm-workspace.yaml"))
    ? [...memberDirs(root).values()]
    : [""];
  const queue = dirs.filter(
    (dir) =>
      existsSync(join(root, dir, "tsconfig.json")) &&
      (files === undefined || dir === "" || files.some((file) => file.startsWith(`${dir}/`))),
  );
  const findings: Finding[] = [];
  let started = false;
  const worker = async (): Promise<void> => {
    for (let dir = queue.shift(); dir !== undefined; dir = queue.shift()) {
      const member = join(root, dir);
      const output = await runCaptured("tsc", ["--noEmit", "-p", member], member);
      if (output === undefined) continue;
      started = true;
      const own = output.stdout.split("\n").flatMap((line) => diagnostic(line.trim(), dir) ?? []);
      findings.push(
        ...own,
        ...(output.code !== 0 && own.length === 0
          ? [{ ...exitFinding(TYPECHECK_PHASE, output), path: dir === "" ? "." : dir }]
          : []),
      );
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, availableParallelism() - 1) }, worker));
  return started ? findings : undefined;
}

/** The turbo findings, or `undefined` when turbo is absent or refused the graph (the caller falls back to tsc). */
function fromTurbo(root: string, output: ToolOutput | undefined): readonly Finding[] | undefined {
  if (output === undefined) return undefined;
  const text = `${output.stdout}\n${output.stderr}`;
  if (output.code !== 0 && CYCLE.test(text)) return undefined;
  const dirs = memberDirs(root);
  const findings = text.split("\n").flatMap((raw) => {
    const prefixed = PREFIX.exec(raw.trim());
    const owner = prefixed?.[1];
    return (
      diagnostic(prefixed?.[2] ?? raw.trim(), owner === undefined ? undefined : dirs.get(owner)) ??
      []
    );
  });
  if (output.code !== 0 && findings.length === 0) return [exitFinding(TYPECHECK_PHASE, output)];
  return findings;
}

/** The `typecheck` phase. */
export const TYPECHECK_PHASE: CheckPhase = {
  name: "typecheck",
  tool: "tsc",
  adr: null,
  async run({ root, files, base }) {
    const filter = files === undefined ? [] : [`--filter=...[${base ?? "origin/main"}]`];
    const turbo = fromTurbo(
      root,
      await runCaptured(
        "turbo",
        ["run", "typecheck", "--continue", "--output-logs=errors-only", ...filter],
        root,
      ),
    );
    const findings = turbo ?? (await perMember(root, files));
    return findings === undefined ? { findings: [], skipped: "not installed" } : { findings };
  },
};
