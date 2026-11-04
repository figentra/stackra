/**
 * Stackra file contract:
 * Purpose: `runToolTask(task, options, io, start)`, the run behind `stackra dev|build|start|typecheck|test|lint`. In a
 *          member it runs gen first (except for `lint`, and for members without `stackra.config.ts`), so the tool
 *          always sees fresh generated configs and entries, then starts the tool `resolveTool` picks. At the workspace
 *          root it fans out through `turbo run <task>` (`test:e2e` for `--tier e2e`), whose member scripts call
 *          `stackra <task>` again.
 *          A docs app (`src/config/docs.config.ts`, STA-1316) always runs gen first, `lint` included, since the
 *          checks read the site gen assembles: `dev` keeps gen watching `src/` while the site's dev server runs. For a
 *          Mintlify site `lint` runs `mint broken-links`, then `mint a11y`; for a Fumadocs site (STA-2026) it builds the
 *          site, then runs `checkDocsLinks` over the build and exits 1 naming each broken link by page (the
 *          accessibility check is the app's e2e tier).
 *          A package gen wrote no entry for (a fresh `stackra new package`, nothing under `src/` yet) and with no
 *          tsdown config of its own has nothing to build: `build` says so and exits 0 instead of starting tsdown. A
 *          service has nothing to build either: Encore builds it at deploy (ADR 0091).
 * Boundary: starts at most one tool (two in sequence for a Mintlify docs app's `lint`) through `start`, which the
 *           caller picks (`runProcess` for a passthrough command, `runInherited` for a console command); a gen refusal
 *           stops before the tool and exits 1. `--target` at the root and an unknown tier are usage errors.
 * Runtime: node
 * Governing contract: ADR 0295 (decision 5: tools read the configs gen writes); the task vocabulary rule (root
 *                     commands run `turbo run <task>`); ADR 0182 (test tiers).
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

import { DOCS_CONFIG_FILE, formatGenError } from "@stackra/gen";
import { watchDocsSite } from "@stackra/gen/node";

import { CliUsageError } from "#node/errors/cli-usage.error";
import { checkDocsLinks } from "#node/functions/check-docs-links.function";
import { readMember } from "#node/functions/read-member.function";
import { resolveTool } from "#node/functions/resolve-tool.function";
import { runGen } from "#node/functions/run-gen.function";
import type { CliIo } from "#node/types/cli-io.type";
import type { ToolRun } from "#node/types/tool-run.type";
import type { ToolTask } from "#node/types/tool-task.type";

/** The member-root config names tsdown finds itself. */
const TSDOWN_CONFIGS = [
  "tsdown.config.ts",
  "tsdown.config.mts",
  "tsdown.config.js",
  "tsdown.config.mjs",
];

/** Whether gen wrote a tsdown config for the member's entries, or the member keeps one of its own. */
function hasTsdownConfig(cwd: string): boolean {
  return [".stackra/tsdown.config.ts", ...TSDOWN_CONFIGS].some((file) =>
    existsSync(join(cwd, file)),
  );
}

/**
 * Runs `task` in `options.cwd` and resolves with the exit code.
 *
 * @param task - the command name, also the Turborepo task.
 * @param options - the directory, and `target` and `tier` when the command takes them.
 * @param io - where gen and the notices write.
 * @param start - starts one tool and resolves with its exit code.
 * @throws CliUsageError for `--target` at the workspace root, or an unknown tier.
 * @example
 * await runToolTask("test", { cwd, tier: "e2e" }, cliIoOf(io), (tool) => runInherited(io, tool));
 */
export async function runToolTask(
  task: ToolTask,
  options: {
    readonly cwd: string;
    readonly target?: string | undefined;
    readonly tier?: string | undefined;
  },
  io: CliIo,
  start: (tool: ToolRun) => Promise<number>,
): Promise<number> {
  const { cwd, target, tier } = options;
  if (existsSync(join(cwd, "pnpm-workspace.yaml"))) {
    if (target !== undefined)
      throw new CliUsageError("--target picks one app's target; run it in the app");
    if (tier !== undefined && tier !== "unit" && tier !== "e2e") {
      throw new CliUsageError(`unknown tier: ${tier} (expected unit or e2e)`);
    }
    const turboTask = tier === "e2e" ? "test:e2e" : task;
    return start({ command: "turbo", args: ["run", turboTask], cwd });
  }

  const docs = existsSync(join(cwd, DOCS_CONFIG_FILE));
  if (docs || (task !== "lint" && existsSync(join(cwd, "stackra.config.ts")))) {
    if (!(await runGen(cwd, { base: cwd }, io))) return 1;
  }
  const member = readMember(cwd);
  if (task === "build" && member.layout === "package" && !hasTsdownConfig(cwd)) {
    io.out(`nothing to build in ${cwd}: gen wrote no entry\n`);
    return 0;
  }
  if (task === "build" && member.layout === "service") {
    io.out(`nothing to build in ${cwd}: Encore builds a service at deploy\n`);
    return 0;
  }
  const tool = resolveTool(task, member, { target, tier });
  if (docs && task === "lint") {
    const code = await start(tool);
    if (code !== 0) return code;
    if (tool.command === "mint") return start({ ...tool, args: ["a11y"] });
    const broken = checkDocsLinks(join(tool.cwd, "build", "client"));
    for (const { page, link, reason } of broken) io.err(`${page}: ${link} (${reason})\n`);
    if (broken.length > 0) return 1;
    io.out("every internal link resolves\n");
    return 0;
  }
  if (docs && task === "dev") {
    const watcher = watchDocsSite(
      cwd,
      ({ errors, changed }) => {
        for (const error of errors) io.err(`${formatGenError(error)}\n`);
        for (const path of changed) io.out(`wrote ${path}\n`);
      },
      (error) => io.err(`gen: ${error instanceof Error ? error.message : String(error)}\n`),
    );
    try {
      return await start(tool);
    } finally {
      watcher.close();
    }
  }
  return start(tool);
}
