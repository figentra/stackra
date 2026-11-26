/**
 * Stackra file contract:
 * Purpose: `toolCommand(task, summary)`, the `stackra dev|build|start|typecheck|test|lint` commands. In a member it
 *          runs gen first (except for `lint`, and for members without `stackra.config.ts`), so the tool always sees
 *          fresh generated configs and entries, then starts the tool `resolveTool` picks. At the workspace root it fans
 *          out through `turbo run <task>`, whose member scripts call `stackra <task>` again.
 *          A docs app (`src/config/docs.config.ts`, STA-1316) always runs gen first, `lint` included, since the
 *          checks read the site gen assembles: `dev` keeps gen watching `src/` while the site's dev server runs. For a
 *          Mintlify site `lint` runs `mint broken-links`, then `mint a11y`; for a Fumadocs site (STA-2026) it builds the
 *          site, then runs `checkDocsLinks` over the build and exits 1 naming each broken link by page (the
 *          accessibility check is the app's e2e tier).
 *          A package gen wrote no entry for (a fresh `stackra new package`, nothing under `src/` yet) and with no
 *          tsdown config of its own has nothing to build: `build` says so and exits 0 instead of starting tsdown. A
 *          service has nothing to build either: Encore builds it at deploy (ADR 0091).
 * Boundary: starts at most one tool (two in sequence for a Mintlify docs app's `lint`); a gen refusal stops before
 *           the tool and exits 1.
 * Runtime: node
 * Governing contract: ADR 0295 (decision 5: tools read the configs gen writes); the task vocabulary rule (root
 *                     commands run `turbo run <task>`); ADR 0182 (test tiers).
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

import { DOCS_CONFIG_FILE, formatGenError } from "@stackra/gen";
import { watchDocsSite } from "@stackra/gen/node";

import { devSecretEnv } from "#node/dev-secrets/functions/dev-secret-env.function";
import { CliUsageError } from "#node/errors/cli-usage.error";
import { checkDocsLinks } from "#node/functions/check-docs-links.function";
import { readMember } from "#node/functions/read-member.function";
import { resolveTool } from "#node/functions/resolve-tool.function";
import { runGen } from "#node/functions/run-gen.function";
import { runProcess } from "#node/functions/run-process.function";
import type { CliCommand } from "#node/types/cli-command.type";
import type { ToolTask } from "#node/types/tool-task.type";

/** The member-root config names tsdown finds itself. */
const TSDOWN_CONFIGS = [
  "tsdown.config.ts",
  "tsdown.config.mts",
  "tsdown.config.js",
  "tsdown.config.mjs",
];

/** The options each task accepts. */
const OPTIONS: Readonly<Record<ToolTask, CliCommand["options"]>> = {
  dev: { target: { type: "string" } },
  build: { target: { type: "string" } },
  start: {},
  typecheck: {},
  test: { tier: { type: "string" }, target: { type: "string" } },
  lint: {},
};

/** Whether gen wrote a tsdown config for the member's entries, or the member keeps one of its own. */
function hasTsdownConfig(cwd: string): boolean {
  return [".stackra/tsdown.config.ts", ...TSDOWN_CONFIGS].some((file) =>
    existsSync(join(cwd, file)),
  );
}

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
        const code = await runProcess(tool, io);
        if (code !== 0) return code;
        if (tool.command === "mint") return runProcess({ ...tool, args: ["a11y"] }, io);
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
          return await runProcess(tool, io);
        } finally {
          watcher.close();
        }
      }
      // A local run gets the workspace's generated dev values for the secrets this member declares (STA-2679).
      if (task === "dev")
        return runProcess({ ...tool, env: { ...tool.env, ...devSecretEnv(cwd) } }, io);
      return runProcess(tool, io);
    },
  };
}
