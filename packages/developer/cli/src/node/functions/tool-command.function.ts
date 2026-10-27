/**
 * Stackra file contract:
 * Purpose: `toolCommand(task, summary)`, the `stackra dev|build|start|typecheck|test|lint` commands. In a member it
 *          runs gen first (except for `lint`, and for members without `stackra.config.ts`), so the tool always sees
 *          fresh generated configs and entries, then starts the tool `resolveTool` picks. At the workspace root it fans
 *          out through `turbo run <task>`, whose member scripts call `stackra <task>` again.
 *          A docs app (`src/config/docs.config.ts`, STA-1316) always runs gen first, `lint` included, since Mintlify
 *          checks the site gen assembles: `dev` keeps gen watching `src/` while `mint dev` runs, and `lint` runs
 *          `mint broken-links`, then `mint a11y`.
 * Boundary: starts at most one tool (two in sequence for a docs app's `lint`); a gen refusal stops before the tool
 *           and exits 1.
 * Runtime: node
 * Governing contract: ADR 0295 (decision 5: tools read the configs gen writes); the task vocabulary rule (root
 *                     commands run `turbo run <task>`); ADR 0182 (test tiers).
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

import { DOCS_CONFIG_FILE, formatGenError } from "@stackra/gen";
import { watchDocsSite } from "@stackra/gen/node";

import { CliUsageError } from "#node/errors/cli-usage.error";
import { readMember } from "#node/functions/read-member.function";
import { resolveTool } from "#node/functions/resolve-tool.function";
import { runGen } from "#node/functions/run-gen.function";
import { runProcess } from "#node/functions/run-process.function";
import type { CliCommand } from "#node/types/cli-command.type";
import type { ToolTask } from "#node/types/tool-task.type";

/** The options each task accepts. */
const OPTIONS: Readonly<Record<ToolTask, CliCommand["options"]>> = {
  dev: { target: { type: "string" } },
  build: { target: { type: "string" } },
  start: {},
  typecheck: {},
  test: { tier: { type: "string" }, target: { type: "string" } },
  lint: {},
};

/**
 * The command that runs `task`.
 *
 * @param task - the command name, also the Turborepo task.
 * @param summary - its line in `stackra --help`.
 * @example
 * toolCommand("build", "Generate, then build the member");
 */
export function toolCommand(task: ToolTask, summary: string): CliCommand {
  const options = OPTIONS[task] ?? {};
  const flags = Object.keys(options).map((name) => ` [--${name} <${name}>]`);
  return {
    name: task,
    summary,
    usage: `stackra ${task}${flags.join("")}`,
    options,
    async run({ cwd, values, io }) {
      const target = typeof values["target"] === "string" ? values["target"] : undefined;
      const tier = typeof values["tier"] === "string" ? values["tier"] : undefined;

      if (existsSync(join(cwd, "pnpm-workspace.yaml"))) {
        if (target !== undefined)
          throw new CliUsageError("--target picks one app's target; run it in the app");
        if (tier !== undefined && tier !== "unit" && tier !== "e2e") {
          throw new CliUsageError(`unknown tier: ${tier} (expected unit or e2e)`);
        }
        const turboTask = tier === "e2e" ? "test:e2e" : task;
        return runProcess({ command: "turbo", args: ["run", turboTask], cwd }, io);
      }

      const docs = existsSync(join(cwd, DOCS_CONFIG_FILE));
      if (docs || (task !== "lint" && existsSync(join(cwd, "stackra.config.ts")))) {
        if (!(await runGen(cwd, { base: cwd }, io))) return 1;
      }
      const tool = resolveTool(task, readMember(cwd), { target, tier });
      if (docs && task === "lint") {
        const code = await runProcess(tool, io);
        return code === 0 ? runProcess({ ...tool, args: ["a11y"] }, io) : code;
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
          return await runProcess(tool, io);
        } finally {
          watcher.close();
        }
      }
      return runProcess(tool, io);
    },
  };
}
