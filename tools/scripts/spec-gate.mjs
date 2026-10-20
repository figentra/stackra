#!/usr/bin/env node
/**
 * spec-gate — the clarify-before-build gate for spec-kit specs in `.agents/specs/sta-<n>-<slug>/` (ADR 0120 D1).
 *
 *   node tools/scripts/spec-gate.mjs plan <spec.md>   exit 1 unless the spec may be planned
 *   node tools/scripts/spec-gate.mjs ci [--base=ref]   stage rules for every spec changed since the base ref,
 *                                                      plus the spec-kit upgrade tripwire
 *   node tools/scripts/spec-gate.mjs dir [--slug s] [--key STA-n]   print the spec folder for the branch's
 *                                                      STA key and persist it to .specify/feature.json
 *
 * A spec may be planned when it has `**Clarifications status**: complete`, a `**Linear**: STA-n`
 * key, a fully answered `## Impact` section and no `[NEEDS CLARIFICATION` marker.
 * `ci` is stage-aware, by the spec's `**Status**`: a Draft spec only needs a `sta-<n>-<slug>` folder and, when a
 * key is set, the folder's key. From Clarified on the plan rules apply; Planned also needs plan.md, Ready and
 * Implementing tasks.md, Verified every task ticked. Abandoned and Superseded specs are skipped.
 * `setup-plan.sh` runs `plan`; CI runs `ci` (wired into `pnpm validate`). Dependency-free.
 *
 *   node tools/scripts/spec-gate.mjs stage <spec.md> <clarified|planned|implementing|verified>
 *
 * Linear: `plan` (on pass, which is "clarified") and `stage` comment the stage on the spec's issue through
 * `pnpm linear`; `implementing` also moves it to In Progress (`linear start`). In Review and Done follow from the
 * pull request (`pnpm linear review|done`, linear-reconcile). Best-effort: a Linear failure never changes the exit
 * code (ADR 0065 rule 7). `ci` never calls Linear. STACKRA_LINEAR=off disables the calls.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const IMPACT_FIELDS = [
  "Apps touched",
  "Services touched",
  "Packages touched",
  "Cross-service events",
  "Tenancy and data",
  "Secrets",
  "ADR needed",
  "New dependencies",
  "Deploy modes",
  "Lane",
  "Change risk",
];
export const SPECS_DIR = ".agents/specs";
const FOLDER_RE = /^sta-(\d+)-[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const STATUSES = [
  "draft",
  "clarified",
  "planned",
  "ready",
  "implementing",
  "verified",
  "abandoned",
  "superseded",
];

/** Problems that stop a spec from being planned; empty means it may be. */
export function checkSpec(text) {
  const body = text.replace(/<!--[\s\S]*?-->/g, "");
  const problems = [];
  if (!/^\*\*Clarifications status\*\*:\s*complete\s*$/im.test(body))
    problems.push("`**Clarifications status**` is not `complete` (run /speckit.clarify)");
  if (!/^\*\*Linear\*\*:\s*STA-\d+\b/m.test(body))
    problems.push("`**Linear**` has no STA-n key (spec-linear.mjs issue, or the Linear MCP)");
  if (/\[NEEDS CLARIFICATION/i.test(body)) problems.push("a `[NEEDS CLARIFICATION` marker remains");

  const impact = body.match(/^## Impact\b[^\n]*\n([\s\S]*?)(?=^## |(?![\s\S]))/m)?.[1];
  if (impact === undefined) {
    problems.push("the `## Impact` section is missing");
  } else {
    for (const field of IMPACT_FIELDS) {
      const value = impact.match(new RegExp(`^- \\*\\*${field}\\*\\*:[ \\t]*(.*)$`, "m"))?.[1];
      if (value === undefined) problems.push(`Impact: \`${field}\` is missing`);
      else if (value.trim() === "" || /^\[.*\]$/.test(value.trim()))
        problems.push(`Impact: \`${field}\` is unanswered`);
    }
  }
  return problems;
}

export const STAGES = ["clarified", "planned", "implementing", "verified"];

/** Problems for a spec at its declared `**Status**`; `files` lists the names in its folder. */
export function checkStage(folder, text, { files = [], tasks = "" } = {}) {
  const body = text.replace(/<!--[\s\S]*?-->/g, "");
  const key = folder.match(FOLDER_RE)?.[1];
  if (!key) return [`folder \`${folder}\` is not \`sta-<n>-<slug>\` (ADR 0120 D1)`];
  const status = body.match(/^\*\*Status\*\*:\s*([A-Za-z]+)/m)?.[1]?.toLowerCase() ?? "";
  if (!STATUSES.includes(status)) return [`\`**Status**\` is not one of ${STATUSES.join(", ")}`];
  if (status === "abandoned" || status === "superseded") return [];
  const problems = [];
  const linear = body.match(/^\*\*Linear\*\*:\s*STA-(\d+)\b/m)?.[1];
  if (linear && linear !== key)
    problems.push(`\`**Linear**: STA-${linear}\` does not match the folder key STA-${key}`);
  const at = STATUSES.indexOf(status);
  if (at >= STATUSES.indexOf("clarified")) problems.push(...checkSpec(text));
  if (at >= STATUSES.indexOf("planned") && !files.includes("plan.md"))
    problems.push(`status ${status} needs plan.md`);
  if (at >= STATUSES.indexOf("ready") && !files.includes("tasks.md"))
    problems.push(`status ${status} needs tasks.md`);
  if (status === "verified" && /^\s*[-*+] \[ \]/m.test(tasks))
    problems.push("status verified, but tasks.md has unticked tasks");
  return problems;
}

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
  for (const name of WRAPPED) {
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
      if (!text.includes("## Stackra: feature directory"))
        problems.push(`${p} lost the Stackra wrap (re-register the preset for that integration)`);
      // Anchor on the core's own resolution rule; the wrap's prose says "use it as-is" too.
      if (
        name === "specify" &&
        !/explicitly provided `SPECIFY_FEATURE_DIRECTORY` \([^\n]*\), use it as-is/.test(text)
      )
        problems.push(`${p}: core specify no longer takes SPECIFY_FEATURE_DIRECTORY as-is`);
    }
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

function stageGate(dir) {
  const spec = join(dir, "spec.md");
  const tasks = join(dir, "tasks.md");
  const problems = existsSync(spec)
    ? checkStage(basename(dir), readFileSync(spec, "utf8"), {
        files: readdirSync(dir),
        tasks: existsSync(tasks) ? readFileSync(tasks, "utf8") : "",
      })
    : ["spec.md is missing"];
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
  return {
    dirs: [...features].map((f) => join(ROOT, f)).filter((p) => existsSync(p)),
    legacy: lines.filter((n) => n.startsWith("specs/") && existsSync(join(ROOT, n))),
  };
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
    } catch {}
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
  if (mode === "ci") {
    const base = arg?.startsWith("--base=") ? arg.slice(7) : "origin/main";
    let failures = 0;
    for (const p of tripwire()) {
      console.error(`spec-gate: tripwire: ${p}`);
      failures++;
    }
    const { dirs, legacy } = changedSpecs(base);
    for (const p of legacy) {
      console.error(`spec-gate: ${p}: specs live in ${SPECS_DIR}/sta-<n>-<slug>/, not specs/`);
      failures++;
    }
    for (const dir of dirs) failures += stageGate(dir);
    return failures ? 1 : 0;
  }
  console.error(
    `usage: spec-gate.mjs plan <spec.md> | ci [--base=ref] | stage <spec.md> <${STAGES.join("|")}> | dir [--slug s] [--key STA-n]`,
  );
  return 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  process.exit(main(process.argv.slice(2)));
