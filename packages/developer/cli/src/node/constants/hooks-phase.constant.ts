/**
 * Stackra file contract:
 * Purpose: `HOOKS_PHASE`, `stackra check`'s hooks lint over the compiled output: each `.tsx` file in a component home is
 *          compiled (a class component becomes the function component gen emits; any other file is copied as it is)
 *          into a temporary folder, oxlint runs `react/rules-of-hooks` there alone, and each diagnostic is reported at
 *          the source file and line. The repository lint has that rule off in those homes, because the source rule
 *          flags a class component's hook fields.
 * Boundary: reads the target files, writes and removes one folder under the OS temp directory, starts oxlint with
 *           `-f json`; skipped when oxlint is not installed or no file is a target. A compile refusal is one finding of
 *           that file, never a crash; when no file compiled, oxlint is not started (it exits 1 over an empty folder).
 * Runtime: node
 * Governing contract: ADR 0305 (rules 37 to 41); ADR 0129.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve, sep } from "node:path";

import { compileClassComponents } from "@stackra/gen/node";
import type { Finding } from "@stackra/repo-checks/node";

import { exitFinding } from "#node/functions/exit-finding.function";
import { hookDiagnosticFinding } from "#node/functions/hook-diagnostic-finding.function";
import { isHooksTarget } from "#node/functions/is-hooks-target.function";
import { runCaptured } from "#node/functions/run-captured.function";
import { toolFinding } from "#node/functions/tool-finding.function";
import type { CheckPhase } from "#node/types/check-phase.type";
import type { HookDiagnostic } from "#node/types/hook-diagnostic.type";

/** The oxlint config the phase writes: `rules-of-hooks` alone. */
const CONFIG = JSON.stringify({
  plugins: ["react"],
  categories: { correctness: "off" },
  rules: { "react/rules-of-hooks": "error" },
});

/** The `hooks` phase. */
export const HOOKS_PHASE: CheckPhase = {
  name: "hooks",
  tool: "oxlint",
  adr: "0305",
  async run({ root, files }) {
    const listed =
      files ??
      execFileSync("git", ["ls-files", "*.tsx"], { cwd: root, encoding: "utf8" })
        .split("\n")
        .filter(Boolean);
    const targets = listed.filter(
      (file) => isHooksTarget(file.split(sep).join("/")) && existsSync(join(root, file)),
    );
    if (targets.length === 0) return { findings: [], skipped: "no component files" };

    const temp = mkdtempSync(join(tmpdir(), "stackra-hooks-"));
    try {
      const findings: Finding[] = [];
      let written = 0;
      for (const file of targets) {
        const source = readFileSync(join(root, file), "utf8");
        let code = source;
        try {
          // undefined means no `#stackra/ui` import: the file is a function component, checked as written
          code =
            (await compileClassComponents(source, file, { retainLines: true }))?.code ?? source;
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          findings.push(
            toolFinding(HOOKS_PHASE, {
              rule: "compile",
              path: file,
              message: message.split("\n")[0] ?? message,
            }),
          );
          continue;
        }
        mkdirSync(dirname(join(temp, file)), { recursive: true });
        writeFileSync(join(temp, file), code);
        written += 1;
      }
      if (written === 0) return { findings };
      const config = join(temp, ".hooks.oxlintrc.json");
      writeFileSync(config, CONFIG);
      // run from the repository root so the repository's oxlint is found; the folder is passed absolute
      const output = await runCaptured("oxlint", ["-c", config, "-f", "json", temp], root);
      if (output === undefined) return { findings: [], skipped: "not installed" };
      let diagnostics: readonly HookDiagnostic[];
      try {
        diagnostics =
          (JSON.parse(output.stdout) as { readonly diagnostics?: readonly HookDiagnostic[] })
            .diagnostics ?? [];
      } catch {
        return {
          findings: output.code === 0 ? findings : [...findings, exitFinding(HOOKS_PHASE, output)],
        };
      }
      for (const diagnostic of diagnostics) {
        const path = relative(temp, resolve(root, diagnostic.filename ?? ""))
          .split(sep)
          .join("/");
        findings.push(hookDiagnosticFinding(HOOKS_PHASE, diagnostic, path));
      }
      return { findings };
    } finally {
      rmSync(temp, { recursive: true, force: true });
    }
  },
};
