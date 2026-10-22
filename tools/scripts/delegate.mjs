#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: hand a task to the executor .agents/routing.yaml names for it (`pnpm delegate <task-type> "<brief>"`).
 *   opencode → budget check, fresh worktree + branch `delegate/sta-<n>-<type>-<slug>` from origin/main, `opencode run`
 *              inside it, JSON transcript saved next to the worktree; the lead (Claude) reviews and commits.
 *   claude   → prints the command for the lead to run; nothing starts here.
 * Linear: `--issue STA-n` is required (ADR 0065). At dispatch it runs `pnpm linear start` on the issue with the
 *   delegate branch; at the end `pnpm linear comment` with the exit code and report path. Both are best-effort.
 * Flags: --issue STA-n (required), --agent <name>, --executor claude|opencode (or STACKRA_EXECUTOR), --dry-run, --no-install,
 *        --auto (opencode --auto: approve every permission not explicitly denied in opencode.jsonc — faster, but a
 *        run that wanders is not stopped by a prompt; the deny list and the worktree are the only fences).
 * Secrets: forbidden — the brief goes to the model; never put a secret value in it.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";
import { costOf, evaluate, fetchStats, formatLine, parseBudget } from "./ai-spend.mjs";

const EXECUTORS = ["claude", "opencode"];

/** The `--issue` value as STA-n, or a thrown usage error: delegation never starts without a Linear issue. */
export function requireIssue(value) {
  const m = String(value ?? "").match(/^STA-(\d+)$/i);
  if (!m) throw new Error("--issue STA-n is required (every delegated task has a Linear issue)");
  return `STA-${m[1]}`;
}

/** Best-effort `pnpm linear …` (ADR 0065 rule 7: Linear sync never blocks). */
function linearSync(args) {
  const r = spawnSync("pnpm", ["--silent", "linear", ...args], {
    encoding: "utf8",
    timeout: 30_000,
  });
  if (r.status !== 0)
    console.warn(
      `delegate: linear ${args[0]} skipped (${(r.stderr || r.error?.message || "failed").trim().split("\n").pop()})`,
    );
}

/** shortcut: two-space `name:` entries under `tasks:` with four-space `key: value` lines; no deeper nesting. */
export function parseRouting(yamlText) {
  const tasks = {};
  for (const m of yamlText.matchAll(/^ {2}([\w-]+):[ \t]*\n((?: {4}\S.*\n?)+)/gm)) {
    tasks[m[1]] = Object.fromEntries(
      [...m[2].matchAll(/^ {4}([\w-]+):\s*(.+)$/gm)].map((kv) => [kv[1], kv[2].trim()]),
    );
  }
  return { tasks, budget: parseBudget(yamlText) };
}

/** Flag beats env beats routing.yaml. Throws on an unknown task type or executor. */
export function resolveRoute(routing, { type, agent, executor }, env = {}) {
  const entry = routing.tasks[type];
  if (!entry)
    throw new Error(`unknown task type "${type}". Known: ${Object.keys(routing.tasks).join(", ")}`);
  const chosen = executor ?? env.STACKRA_EXECUTOR ?? entry.executor;
  if (!EXECUTORS.includes(chosen))
    throw new Error(`executor must be one of ${EXECUTORS.join(", ")} (got "${chosen}")`);
  return { executor: chosen, model: entry.model, agent: agent ?? entry.agent };
}

export const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/, "") || "task";

/** Branch and worktree names; the slug comes from the brief. */
/** The issue key leads the branch so Linear links it and the PR passes `check-pr`. */
export function names(type, brief, issue) {
  const slug = slugify(brief);
  const key = issue.toLowerCase();
  return { slug, branch: `delegate/${key}-${type}-${slug}`, dir: `stackra-delegate-${slug}` };
}

export const RULES = [
  "Rules for this run:",
  "- Never run git add, commit, push, checkout, reset or stash: the lead reviews and commits.",
  "- Stay inside the files the brief names; list anything else you noticed instead of fixing it.",
  "- Never read, print or write a secret value (.env*, Infisical, tokens).",
  "- Finish with a summary: files changed, commands run and their results, anything unverified.",
].join("\n");

export const buildPrompt = (brief) => `${brief}\n\n${RULES}`;

export function opencodeArgs({ agent, model, title, prompt, auto }) {
  return [
    "run",
    "--agent",
    agent,
    ...(model ? ["--model", model] : []),
    "--format",
    "json",
    "--title",
    title,
    ...(auto ? ["--auto"] : []),
    prompt,
  ];
}

/** Command line the lead runs when the executor is claude. */
export const claudeCommand = ({ agent, brief }) =>
  `claude --agent ${agent} ${JSON.stringify(brief)}`;

const run = (cmd, args, opts = {}) => spawnSync(cmd, args, { encoding: "utf8", ...opts });

function mainCheckout() {
  const common = run("git", ["rev-parse", "--git-common-dir"]).stdout.trim();
  return dirname(realpathSync(resolve(common)));
}

function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      agent: { type: "string" },
      executor: { type: "string" },
      issue: { type: "string" },
      "dry-run": { type: "boolean" },
      "no-install": { type: "boolean" },
      auto: { type: "boolean" },
    },
  });
  const [type, brief] = positionals;
  if (!type || !brief) {
    console.error(
      'usage: pnpm delegate <task-type> "<brief>" --issue STA-n [--agent x] [--executor claude|opencode] [--dry-run] [--auto]',
    );
    process.exit(2);
  }
  const issue = requireIssue(values.issue);
  const root = fileURLToPath(new URL("../../", import.meta.url));
  const routing = parseRouting(readFileSync(`${root}.agents/routing.yaml`, "utf8"));
  const route = resolveRoute(
    routing,
    { type, agent: values.agent, executor: values.executor },
    process.env,
  );
  const { branch, dir, slug } = names(type, brief, issue);

  if (route.executor === "claude") {
    console.log(
      `${type} is the lead's work. Run:\n  pnpm linear start ${issue}\n  ${claudeCommand({ agent: route.agent, brief: `${brief} (Linear ${issue})` })}`,
    );
    return;
  }

  let spend = null;
  try {
    spend = evaluate({ today: costOf(fetchStats(0)), week: costOf(fetchStats(7)) }, routing.budget);
    console.log(formatLine(spend));
  } catch (e) {
    console.warn(`delegate: spend unknown (${e.message}); continuing`);
  }
  if (spend?.level === "over") {
    console.error(
      "delegate: refusing — today's OpenCode spend is at the daily cap. Raise budget.dailyUsd or wait.",
    );
    process.exit(1);
  }

  const parent = dirname(mainCheckout());
  const worktree = `${parent}/${dir}`;
  const report = `${worktree}.report.json`;
  const title = `${issue} ${type}: ${brief}`.slice(0, 80);
  const args = opencodeArgs({
    agent: route.agent,
    model: route.model,
    title,
    prompt: buildPrompt(`${brief}\n\nLinear issue: ${issue}`),
    auto: values.auto,
  });

  if (values["dry-run"]) {
    console.log(
      JSON.stringify(
        {
          ...route,
          issue,
          branch,
          worktree,
          report,
          command: ["opencode", ...args.slice(0, -1), "<brief + rules>"],
        },
        null,
        2,
      ),
    );
    return;
  }
  if (existsSync(worktree)) {
    console.error(`delegate: ${worktree} already exists — pick a different brief or remove it.`);
    process.exit(1);
  }

  run("git", ["fetch", "origin", "main"], { stdio: "inherit" });
  const add = run("git", ["worktree", "add", "-b", branch, worktree, "origin/main"], {
    stdio: "inherit",
  });
  if (add.status !== 0) process.exit(add.status ?? 1);
  linearSync(["start", issue, "--branch", branch]);
  if (!values["no-install"])
    run("pnpm", ["install", "--frozen-lockfile", "--prefer-offline"], {
      cwd: worktree,
      stdio: "inherit",
    });

  console.log(`delegate: running opencode (${route.agent}) in ${worktree} …`);
  const r = run("opencode", args, { cwd: worktree, maxBuffer: 512 * 1024 * 1024 });
  writeFileSync(report, r.stdout ?? "");
  if (r.stderr) writeFileSync(`${report}.stderr`, r.stderr);
  linearSync([
    "comment",
    issue,
    `Delegated ${type} run (${route.agent}) exited ${r.status} on branch \`${branch}\`; report ${report}. The lead reviews before commit.`,
  ]);
  console.log(
    `delegate: opencode exited ${r.status}\n  branch: ${branch}\n  worktree: ${worktree}\n  report: ${report} (slug ${slug})\nReview the diff, run pnpm verify, then commit from the worktree.`,
  );
  process.exit(r.status ?? 1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (e) {
    console.error(`delegate: ${e.message}`);
    process.exit(2);
  }
}
