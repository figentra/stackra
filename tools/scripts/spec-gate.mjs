#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: `spec-gate` — the stage gates for spec-kit specs in `.agents/specs/sta-<n>-<slug>/` (ADR 0120 D1, owner
 *          decision OR12).
 * Boundary: reads the spec folders, git and, through `pnpm linear`, comments on Linear (best-effort); writes no spec
 *           file. The read-only rules are the published `spec-*` functions of @stackra/repo-checks (`stackra check` runs
 *           them in any repo); this script keeps the CLI modes, the tripwire, `branch`, `dir` and the Linear calls.
 * Runtime: node
 * Governing contract: ADR 0120 (SDLC spec location, lanes and change risk); ADR 0121; ADR 0065 (rule 7).
 *
 *   plan <spec.md>              exit 1 unless the spec may be planned (run by setup-plan.sh)
 *   check <dir>                 the stage rules for the spec's declared `**Status**`
 *   tasks <tasks.md>            tasks lint: ids, covers, routes, deps, coverage, waves
 *   lane [--base=ref]           feat commits need a lite or full spec reached through the branch or `Refs:` keys,
 *                               and the diff's tier floor is not above the branch spec's `**Tier**` (ADR 0502)
 *   branch                      warn, never fail, unless the branch (STACKRA_BRANCH, else git) is Linear-named or
 *                               allow-listed: a `chore-lane` PR may use any branch, and only `linear check-pr`
 *                               sees the PR labels, so check-pr is the enforcing check
 *   ci [--base=ref]             tripwire; `check` for every spec folder changed since the base; bug-lane rules;
 *                               `lane`. SPEC_GATE_REQUIRE_READY=1 (a ready-for-review PR) also requires the PR's
 *                               own spec (the branch key's folder), when changed, to be at Tasked or later; an
 *                               edit to another spec gets only `check`, and changing another spec's `**Status**`
 *                               line needs a commit whose `Refs:` names that spec's key. No branch check: check-pr
 *                               owns it.
 *   dir [--slug s] [--key STA-n]   print the spec folder for the branch's STA key and persist .specify/feature.json
 *   stage <spec.md> <stage>     best-effort Linear comment for a stage change
 *
 * States: Draft → Clarified → Planned → Tasked → Implementing → Done, or Abandoned / Superseded. A status may lag
 * its artifacts, never lead them (I5):
 *   Draft         folder `sta-<n>-<slug>`; a `**Linear**` key, when set, equals the folder's
 *   Clarified     clarifications complete, real key, every Impact line answered, no NEEDS CLARIFICATION; a Status
 *                 history line for the current status
 *   Planned       plan.md: Constitution Check rows PASS or N/A with a reason, three deploy-mode rows, every live FR
 *                 validated by a P-### (or marked example-only)
 *   Tasked        tasks.md passes `tasks`
 *   Implementing  at least one task ticked
 *   Done          every live task ticked (spec-trace adds test coverage)
 * Linear: `plan` and `stage` comment the stage on the spec's issue through `pnpm linear`; best-effort, never part of
 * the exit code (ADR 0065 rule 7). `ci` never calls Linear. STACKRA_LINEAR=off disables the calls. Dependency-free.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { BRANCH_RE } from "./linear.mjs";
import { checks } from "./spec-checks.mjs";
import { routes } from "./spec-parse.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
// The read-only rules are published code in @stackra/repo-checks (spec-*.function.ts); core's issue prefix is `sta`,
// and core's callers keep bare issue numbers ("163") and the messages they have always printed, adapted here.
const PREFIXES = ["sta"];
const FOLDER_RE = /^sta-(\d+)-[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const SPECS_DIR = checks.SPECS_DIR;
export const STATUSES = [...checks.SPEC_STATUSES];
export const STAGES = [...checks.SPEC_STAGES];
export const FOLDER = FOLDER_RE;
const atLeast = checks.specAtLeast;

// The published message names no tool; core's points at its own Linear helpers.
const NO_LINEAR_KEY = "`**Linear**` has no STA-n key";
const withLinearHint = (problems) =>
  problems.map((p) =>
    p === NO_LINEAR_KEY ? `${p} (spec-linear.mjs issue, or the Linear MCP)` : p,
  );
const keyed = (numbers) => new Set([...numbers].map((n) => `STA-${n}`));

/** Problems that stop a spec from being planned; empty means it may be. */
export const checkSpec = (text) => withLinearHint(checks.specCheckClarified(text, "sta"));

/** The declared `**Status**`, lower-cased ("" when absent). */
export const statusOf = checks.specStatusOf;

/** Planned rules for plan.md against its spec. */
export const checkPlan = checks.specCheckPlan;

/** Tasks lint for tasks.md against its spec and plan; `known` holds the routing.yaml task types. */
export const checkTasks = (tasksText, context = {}) =>
  checks.specCheckTasks(tasksText, { ...context, prefixes: PREFIXES });

/** Problems for a spec at its declared `**Status**`; `files` lists the names in its folder. */
export const checkStage = (folder, text, context = {}) =>
  withLinearHint(checks.specCheckStage(folder, text, { ...context, prefixes: PREFIXES }));

/** feat commits need a lite or full spec reached through the branch key or their `Refs:` keys (ADR 0120 D4). */
export const checkLane = ({
  commits = [],
  branch = "",
  specKeys = new Set(),
  taskKeys = new Set(),
}) =>
  checks.specCheckLane({
    commits,
    branch,
    specKeys: keyed(specKeys),
    taskKeys: keyed(taskKeys),
    prefixes: PREFIXES,
  });

/** The spec folder is the PR's own (keyed by the branch's STA key); only it must reach Tasked on a ready PR. */
export const isOwnSpec = (folder, branch) => checks.specIsOwn(folder, branch, PREFIXES);

/** The spec's `**Status**:` line, trimmed ("" when absent). */
export const statusLine = checks.specStatusLine;

/** The spec's declared `**Tier**` (ADR 0502), or undefined. */
export const tierOf = checks.specTierOf;

/** The lowest tier a `git diff --name-status` allows, with its reasons (ADR 0502). */
export const computedTier = checks.specComputedTier;

/** The approval recorded for a stage, or undefined (ADR 0502). */
export const approvedAt = checks.specApprovedAt;

/** STA numbers named on the `Refs:` trailers of the commit messages. */
export const refsKeys = (commits) =>
  new Set([...checks.specRefsKeys(commits, PREFIXES)].map((k) => k.slice("STA-".length)));

/**
 * A PR may move another spec's `**Status**` only when one of its commits' `Refs:` names that spec's key, so a
 * spec's stage never changes as a side effect of unrelated work. The own spec and a newly added spec are exempt.
 */
export const checkForeignStatus = (context) =>
  checks.specCheckForeignStatus({ ...context, prefixes: PREFIXES });

/** The branch is Linear-named (ADR 0065 decision 5) or allow-listed. */
export function checkBranch(branch) {
  if (!branch || branch === "HEAD" || branch === "main") return [];
  if (/^(renovate\/|changeset-release\/main$)/.test(branch)) return [];
  return BRANCH_RE.test(branch)
    ? []
    : [
        `branch \`${branch}\` is not \`figentra/sta-<n>-<slug>\` (Linear's "Copy git branch name") or delegate/sta-<n>-…`,
      ];
}

/** Bug lane: `.specify/bugs/sta-<n>-<slug>/` with a regression test tagged `@covers sta-<n>:BUG`. */
export const checkBug = (folder, tests) => checks.specCheckBug(folder, tests, PREFIXES);

/** The repo-relative spec folder for a key: its existing `sta-<n>-*` folder, else one named from `slug`. */
export function specDir({ root = ROOT, branch = "", key, slug } = {}) {
  const n = (key ?? branch).match(/(?:^|[/-])sta-(\d+)(?:-|$)/i)?.[1];
  if (!n) return { error: `no STA key in ${key ? `--key ${key}` : `branch \`${branch}\``}` };
  const base = join(root, SPECS_DIR);
  const existing = existsSync(base)
    ? readdirSync(base).filter((d) => d.startsWith(`sta-${n}-`))
    : [];
  if (existing.length > 1) return { error: `several folders for STA-${n}: ${existing.join(", ")}` };
  if (existing.length) return { dir: `${SPECS_DIR}/${existing[0]}` };
  const name = `sta-${n}-${slug ?? ""}`;
  if (!FOLDER_RE.test(name))
    return { error: `no folder for STA-${n} yet; pass --slug <kebab-case short name>` };
  return { dir: `${SPECS_DIR}/${name}` };
}

/** Commands whose rendered copies must carry the Stackra feature-directory wrap. */
export const WRAPPED = [
  "specify",
  "clarify",
  "plan",
  "tasks",
  "analyze",
  "checklist",
  "implement",
  "converge",
];

/** Core commands the preset replaces outright, with the marker their rendered copies must keep (ADR 0121). */
export const REPLACED = {
  taskstoissues: "## Stackra: tasks to Linear issues",
  constitution: "## Stackra: the constitution is generated",
};

/**
 * spec-kit upgrade tripwire (ADR 0120 D1): keeping specs in `.agents/specs` rests on core text and scripts that
 * `specify integration upgrade` or `specify init --force` can change or wipe. Each problem names what broke.
 */
export function tripwire(root = ROOT) {
  const problems = [];
  const read = (p) => (existsSync(join(root, p)) ? readFileSync(join(root, p), "utf8") : null);
  const plan = read(".specify/scripts/bash/setup-plan.sh");
  if (plan !== null && !plan.includes("spec-gate.mjs"))
    problems.push("setup-plan.sh lost its gate call (re-add `spec-gate.mjs plan`)");
  const common = read(".specify/scripts/bash/common.sh");
  if (common !== null && !/SPECIFY_FEATURE_DIRECTORY[\s\S]*\.specify\/feature\.json/.test(common))
    problems.push(
      "common.sh no longer resolves SPECIFY_FEATURE_DIRECTORY, then .specify/feature.json",
    );
  const opts = read(".specify/init-options.json");
  let numbering;
  try {
    numbering = opts === null ? "linear-key" : JSON.parse(opts).feature_numbering;
  } catch {
    numbering = "(unreadable JSON)";
  }
  if (numbering !== "linear-key")
    problems.push(
      "init-options.json `feature_numbering` is not `linear-key` (an init or upgrade reset it)",
    );
  for (const name of [...WRAPPED, ...Object.keys(REPLACED)]) {
    const marker = REPLACED[name] ?? "## Stackra: feature directory";
    for (const p of [
      `.claude/skills/speckit-${name}/SKILL.md`,
      `.opencode/commands/speckit.${name}.md`,
    ]) {
      const text = read(p);
      if (text === null) {
        // The integration is installed (its folder exists) but an upgrade dropped this command.
        if (existsSync(join(root, dirname(dirname(p))))) problems.push(`${p} is missing`);
        continue;
      }
      if (!text.includes(marker))
        problems.push(`${p} lost the Stackra wrap (re-register the preset for that integration)`);
      // Anchor on the core's own resolution rule; the wrap's prose says "use it as-is" too.
      if (
        name === "specify" &&
        !/explicitly provided `SPECIFY_FEATURE_DIRECTORY` \([^\n]*\), use it as-is/.test(text)
      )
        problems.push(`${p}: core specify no longer takes SPECIFY_FEATURE_DIRECTORY as-is`);
    }
  }
  // The preset's only source is .agents/speckit/presets; the installed copy is what `pnpm speckit:sync` made of it.
  const walk = (dir) =>
    readdirSync(join(root, dir), { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? walk(`${dir}/${e.name}`) : [`${dir}/${e.name}`],
    );
  const sources = ".agents/speckit/presets";
  if (existsSync(join(root, sources)))
    for (const src of walk(sources)) {
      const installed = `.specify/presets/${src.slice(sources.length + 1)}`;
      if (read(installed) !== read(src))
        problems.push(
          `${installed} differs from ${src} (edit the source, then \`pnpm speckit:sync\`)`,
        );
    }
  // The bundled `speckit` workflow skips clarify and analyze (ADR 0121 D19); it stays disabled.
  const workflows = read(".specify/workflows/workflow-registry.json");
  if (workflows !== null) {
    let speckit;
    try {
      speckit = JSON.parse(workflows).workflows?.speckit;
    } catch {
      // unreadable workflows file: nothing is enabled
    }
    if (speckit && speckit.enabled !== false)
      problems.push(
        "the bundled `speckit` workflow is enabled (`specify workflow disable speckit`)",
      );
  }
  return problems;
}

/** Best-effort stage report to the spec's Linear issue; output and failures are swallowed. */
function linearStage(file, stage) {
  const key = readFileSync(file, "utf8").match(/^\*\*Linear\*\*:\s*(STA-\d+)\b/m)?.[1];
  if (!key || process.env.STACKRA_LINEAR === "off") return;
  const linear = (args) =>
    spawnSync("pnpm", ["--silent", "linear", ...args], {
      cwd: ROOT,
      stdio: "ignore",
      timeout: 20_000,
    });
  linear(["comment", key, `Spec stage: ${stage} (${file.replace(`${ROOT}/`, "")})`]);
  if (stage === "implementing") linear(["start", key]);
}

function gate(file) {
  const problems = checkSpec(readFileSync(file, "utf8"));
  for (const p of problems) console.error(`spec-gate: ${file}: ${p}`);
  return problems.length;
}

const readIf = (p) => (existsSync(p) ? readFileSync(p, "utf8") : "");
const knownRoutes = () => routes(readIf(join(ROOT, ".agents/routing.yaml")));

function stageGate(dir, { requireReady = false } = {}) {
  const spec = join(dir, "spec.md");
  const problems = existsSync(spec)
    ? checkStage(basename(dir), readFileSync(spec, "utf8"), {
        files: readdirSync(dir),
        tasks: readIf(join(dir, "tasks.md")),
        plan: readIf(join(dir, "plan.md")),
        known: knownRoutes(),
      })
    : ["spec.md is missing"];
  const status = statusOf(readIf(spec));
  if (requireReady && !["abandoned", "superseded"].includes(status) && !atLeast(status, "tasked"))
    problems.push(
      `status ${status || "(none)"} on a ready-for-review PR: a spec PR stays a draft until Tasked (SPEC_GATE_REQUIRE_READY)`,
    );
  for (const p of problems) console.error(`spec-gate: ${relative(ROOT, dir)}: ${p}`);
  return problems.length;
}

/** Spec folders under .agents/specs changed since `base`, and any path still under a root `specs/`. */
function changedSpecs(base) {
  let names = "";
  try {
    names = execFileSync("git", ["diff", "--name-only", `${base}...HEAD`], {
      cwd: ROOT,
      encoding: "utf8",
    });
  } catch {
    console.log(`spec-gate: no ${base} to diff against; skipping`);
  }
  const lines = names.split("\n");
  const features = new Set(
    lines.flatMap((n) => n.match(/^\.agents\/specs\/[^/]+(?=\/)/)?.slice(0, 1) ?? []),
  );
  const bugs = new Set(
    lines.flatMap((n) => n.match(/^\.specify\/bugs\/[^/]+(?=\/)/)?.slice(0, 1) ?? []),
  );
  return {
    names: lines.filter(Boolean),
    bugs: [...bugs].filter((p) => existsSync(join(ROOT, p))),
    dirs: [...features].map((f) => join(ROOT, f)).filter((p) => existsSync(p)),
    legacy: lines.filter((n) => n.startsWith("specs/") && existsSync(join(ROOT, n))),
  };
}

const git = (...a) => {
  try {
    return execFileSync("git", a, { cwd: ROOT, encoding: "utf8", maxBuffer: 64 << 20 });
  } catch {
    return "";
  }
};
const currentBranch = () => process.env.STACKRA_BRANCH || git("branch", "--show-current").trim();

/** Spec keys that exist, and the `[STA-n]` keys in any tasks.md (phase and task sub-issues). */
function specIndex() {
  const base = join(ROOT, SPECS_DIR);
  const folders = existsSync(base) ? readdirSync(base) : [];
  const specKeys = new Set(folders.flatMap((f) => f.match(FOLDER_RE)?.[1] ?? []));
  const taskKeys = new Set(
    folders.flatMap((f) =>
      [...readIf(join(base, f, "tasks.md")).matchAll(/\[STA-(\d+)\]/g)].map((m) => m[1]),
    ),
  );
  return { specKeys, taskKeys };
}

/** The PR's commit messages since `base`, merges excluded. */
const prCommits = (base) =>
  git("log", "--no-merges", "--format=%B%x00", `${base}..HEAD`)
    .split("\0")
    .map((c) => c.trim())
    .filter(Boolean);

function laneGate(base) {
  const branch = currentBranch();
  const lane = checkLane({ commits: prCommits(base), branch, ...specIndex() });
  // ADR 0502: the diff's floor against the branch's own spec; none is trivial, a spec without a tier is exempt.
  const dir = join(ROOT, SPECS_DIR);
  const own = (existsSync(dir) ? readdirSync(dir) : []).find((f) => isOwnSpec(f, branch));
  const declared = own === undefined ? undefined : tierOf(readIf(join(dir, own, "spec.md")));
  if (own !== undefined && declared === undefined) return lane;
  const changes = git("diff", "--name-status", `${base}...HEAD`)
    .split("\n")
    .filter(Boolean)
    .map((row) => {
      const [status = "", ...paths] = row.split("\t");
      return { status, path: paths.at(-1) ?? "" };
    });
  const computed = computedTier(changes);
  return [
    ...lane,
    ...checks.specCheckTier({ declared, computed: computed.tier, reasons: computed.reasons }),
  ];
}

/** checkForeignStatus for every changed spec folder, against its spec.md at the merge base. */
function foreignStatusGate(base, dirs) {
  const mergeBase = git("merge-base", base, "HEAD").trim();
  if (!mergeBase) return [];
  const branch = currentBranch();
  const commits = prCommits(base);
  return dirs.flatMap((dir) =>
    checkForeignStatus({
      folder: basename(dir),
      before: git("show", `${mergeBase}:${relative(ROOT, join(dir, "spec.md"))}`),
      after: readIf(join(dir, "spec.md")),
      branch,
      commits,
    }),
  );
}

/** Text of every test file under a `__tests__/` folder, for `@covers` lookups. */
export function testsText(root = ROOT) {
  const files = git("ls-files", "*__tests__/*")
    .split("\n")
    .filter((f) => /\.test\.[cm]?[jt]sx?$/.test(f));
  return files.map((f) => readIf(join(root, f))).join("\n");
}

function report(problems) {
  for (const p of problems) console.error(`spec-gate: ${p}`);
  return problems.length;
}

function main([mode, ...args]) {
  const [arg, stage] = args;
  if (mode === "plan" && arg) {
    if (gate(arg)) return 1;
    linearStage(arg, "clarified");
    return 0;
  }
  if (mode === "stage" && arg && STAGES.includes(stage)) {
    linearStage(arg, stage);
    return 0;
  }
  if (mode === "dir") {
    const opt = (name) =>
      args.includes(`--${name}`) ? args[args.indexOf(`--${name}`) + 1] : undefined;
    let branch = "";
    try {
      branch = execFileSync("git", ["branch", "--show-current"], { cwd: ROOT, encoding: "utf8" });
    } catch {
      // not a git checkout: no branch, so --key and --slug decide
    }
    const { dir, error } = specDir({ branch: branch.trim(), key: opt("key"), slug: opt("slug") });
    if (error) {
      console.error(`spec-gate: ${error}`);
      return 1;
    }
    // Every later spec-kit script resolves the feature from here when SPECIFY_FEATURE_DIRECTORY is unset.
    writeFileSync(
      join(ROOT, ".specify/feature.json"),
      `${JSON.stringify({ feature_directory: dir }, null, 2)}\n`,
    );
    console.log(dir);
    return 0;
  }
  const base = args.find((a) => a.startsWith("--base="))?.slice(7) ?? "origin/main";
  if (mode === "check" && arg) return stageGate(resolve(arg)) ? 1 : 0;
  if (mode === "tasks" && arg) {
    const dir = dirname(resolve(arg));
    return report(
      checkTasks(readFileSync(arg, "utf8"), {
        spec: readIf(join(dir, "spec.md")),
        plan: readIf(join(dir, "plan.md")),
        known: knownRoutes(),
      }),
    )
      ? 1
      : 0;
  }
  if (mode === "lane") return report(laneGate(base)) ? 1 : 0;
  if (mode === "branch") {
    for (const p of checkBranch(currentBranch()))
      console.warn(
        `spec-gate: warning: ${p} (fine for a PR labelled chore-lane; check-pr enforces it)`,
      );
    return 0;
  }
  if (mode === "ci") {
    let failures = 0;
    for (const p of tripwire()) {
      console.error(`spec-gate: tripwire: ${p}`);
      failures++;
    }
    const { dirs, legacy, bugs } = changedSpecs(base);
    for (const p of legacy) {
      console.error(`spec-gate: ${p}: specs live in ${SPECS_DIR}/sta-<n>-<slug>/, not specs/`);
      failures++;
    }
    const requireReady = process.env.SPEC_GATE_REQUIRE_READY === "1";
    const branch = currentBranch();
    for (const dir of dirs)
      failures += stageGate(dir, {
        requireReady: requireReady && isOwnSpec(basename(dir), branch),
      });
    failures += report(foreignStatusGate(base, dirs));
    if (bugs.length) {
      const tests = testsText();
      for (const b of bugs) failures += report(checkBug(basename(b), tests));
    }
    failures += report(laneGate(base));
    return failures ? 1 : 0;
  }
  console.error(
    `usage: spec-gate.mjs plan <spec.md> | check <dir> | tasks <tasks.md> | lane | branch | ci [--base=ref] | stage <spec.md> <${STAGES.join("|")}> | dir [--slug s] [--key STA-n]`,
  );
  return 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  process.exit(main(process.argv.slice(2)));
