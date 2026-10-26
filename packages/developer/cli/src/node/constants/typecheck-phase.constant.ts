/**
 * Stackra file contract:
 * Purpose: `TYPECHECK_PHASE`, phase 9 of `stackra check`: `turbo run typecheck` (only the members changed since the base
 *          and their dependents with `--affected`), one finding per compiler error, located in its member.
 * Boundary: starts turbo; skipped when it is not installed. Paths are mapped from the turbo task prefix to the member
 *           directory through each member's package.json name.
 * Runtime: node
 * Governing contract: ADR 0129; the task vocabulary rule (root commands run `turbo run <task>`).
 */
import { existsSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

import { exitFinding } from "#node/functions/exit-finding.function";
import { runCaptured } from "#node/functions/run-captured.function";
import { toolFinding } from "#node/functions/tool-finding.function";
import { workspaceMembers } from "#node/functions/workspace-members.function";
import type { CheckPhase } from "#node/types/check-phase.type";

/** `<package>:typecheck: <rest>`, the prefix turbo puts on each task line. */
const PREFIX = /^(\S+?):typecheck: (.*)$/;
/** `file(line,col): error TS1234: message`, or the `file:line:col - error TS1234: message` form. */
const DIAGNOSTIC = /^(.+?)(?:\((\d+),(\d+)\): |:(\d+):(\d+) - )(error|warning) (TS\d+): (.*)$/;

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

/** The `typecheck` phase. */
export const TYPECHECK_PHASE: CheckPhase = {
  name: "typecheck",
  tool: "tsc",
  adr: null,
  async run({ root, files, base }) {
    const filter = files === undefined ? [] : [`--filter=...[${base ?? "origin/main"}]`];
    const output = await runCaptured(
      "turbo",
      ["run", "typecheck", "--continue", "--output-logs=errors-only", ...filter],
      root,
    );
    if (output === undefined) return { findings: [], skipped: "not installed" };
    const dirs = memberDirs(root);
    const findings = `${output.stdout}\n${output.stderr}`.split("\n").flatMap((raw) => {
      const prefixed = PREFIX.exec(raw.trim());
      const line = prefixed?.[2] ?? raw.trim();
      const match = DIAGNOSTIC.exec(line);
      if (!match) return [];
      const [, file = "", r1, c1, r2, c2, severity, rule = "tsc", message = ""] = match;
      const owner = prefixed?.[1];
      const dir = owner === undefined ? undefined : dirs.get(owner);
      return [
        toolFinding(TYPECHECK_PHASE, {
          rule,
          path: dir === undefined || dir === "" ? file : `${dir}/${file}`,
          line: Number(r1 ?? r2 ?? 0) || null,
          column: Number(c1 ?? c2 ?? 0) || null,
          message,
          severity: severity === "warning" ? "warning" : "error",
        }),
      ];
    });
    if (output.code !== 0 && findings.length === 0)
      return { findings: [exitFinding(TYPECHECK_PHASE, output)] };
    return { findings };
  },
};
