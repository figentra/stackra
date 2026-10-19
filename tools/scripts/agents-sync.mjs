#!/usr/bin/env node
/**
 * agents-sync — project `.agents/` into Claude Code and OpenCode.
 *
 * Purpose: `.agents/` is the single source of truth for repo-specific AI artifacts.
 *   - agents  `.agents/agents/<name>.md` -> `.claude/agents/<name>.md` and
 *             `.opencode/agents/<name>.md`, GENERATED (each tool has its own frontmatter
 *             dialect), with a provenance marker. A hand-written file at a generated path is
 *             a conflict and is never overwritten.
 *   - rules   `.agents/rules/*.md` -> one marked block inside root `AGENTS.md` (OpenCode reads
 *             only AGENTS.md; `CLAUDE.md` imports it). NOT projected to `.claude/rules`, or
 *             Claude Code would load every rule twice.
 *   - skills  `.agents/skills/<dir>` -> relative symlink `.claude/skills/<dir>` (OpenCode reads
 *             `.agents/skills` natively).
 *
 * Neutral agent frontmatter (Claude Code vocabulary):
 *   name         optional, must equal the file stem
 *   description  required
 *   tools        optional, comma list of Claude Code tool names (OpenCode derives denies from it)
 *   tier         optional, a tier from `.agents/models.json` (per-tool model mapping)
 *   model        optional override of the tier: alias (opus|sonnet|haiku|inherit), or
 *                `<provider>/<id>` (`anthropic/<id>` reaches Claude as the bare id; any
 *                provider reaches OpenCode verbatim)
 *   mode         optional, OpenCode only: primary|subagent|all (default subagent)
 *   skills       optional, list of skill names (Claude only)
 * Neutral rule frontmatter: title, description (required); always | applies_to: [globs] | manual.
 * Precedence manual > always > applies_to; none set means always.
 *
 * Ignored in `.agents/agents`: dotfiles, README.md, `*-NOTES.md`, and any `.md` that does not
 * open with `---` frontmatter (notes, summaries) — they are not agents.
 *
 * Usage:
 *   node tools/scripts/agents-sync.mjs          # write projections, prune stale generated ones
 *   node tools/scripts/agents-sync.mjs --check  # report drift/conflicts, exit 1 (CI); writes nothing
 *   node tools/scripts/agents-sync.mjs --lint   # validate agent sources only; writes nothing
 *
 * Dependency-free (node: builtins only) so CI can run it before `pnpm install`.
 * Owner: build · Secrets: forbidden.
 */

import {
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const SOURCE = ".agents";
const SCRIPT_REL = "tools/scripts/agents-sync.mjs";
const MODEL_MAP_REL = `${SOURCE}/models.json`;
const AGENT_DIRS = { claude: ".claude/agents", opencode: ".opencode/agents" };
const SKILLS_DEST = ".claude/skills";

const CHECK = process.argv.includes("--check");
const LINT = process.argv.includes("--lint");

const results = { ok: 0, written: 0, pruned: 0, drift: [], conflict: [], broken: [], ignored: [] };

function fail(message) {
  console.error(`agents-sync: ${message}`);
  process.exit(2);
}

const isSymlink = (p) => {
  try {
    return lstatSync(p).isSymbolicLink();
  } catch {
    return false;
  }
};

/** Entries under `.agents/<kind>/`, dotfiles excluded. */
function sourceEntries(kind) {
  const dir = join(ROOT, SOURCE, kind);
  return existsSync(dir)
    ? readdirSync(dir)
        .filter((n) => !n.startsWith("."))
        .toSorted()
    : [];
}

// ---------------------------------------------------------------------------
// Frontmatter — the small YAML subset the sources use (not a general parser).
// ---------------------------------------------------------------------------

const unquote = (s) =>
  (s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))
    ? s.slice(1, -1)
    : s;

function scalarOrArray(v) {
  if (v === "true") return true;
  if (v === "false") return false;
  if (v.startsWith("[") && v.endsWith("]"))
    return v
      .slice(1, -1)
      .split(",")
      .map((s) => unquote(s.trim()))
      .filter(Boolean);
  return unquote(v);
}

/** `null` when `raw` does not open with frontmatter; exits 2 when the frontmatter never closes. */
function parseFrontmatter(raw, label) {
  if (!/^---\r?\n/.test(raw)) return null;
  const first = raw.indexOf("\n");
  const close = raw.indexOf("\n---", first);
  if (close === -1) fail(`${label} has unterminated frontmatter (no closing "---").`);
  const lines = raw.slice(first + 1, close).split(/\r?\n/);
  const body = raw.slice(close + 4).replace(/^\r?\n/, "");
  const data = {};

  for (let i = 0; i < lines.length; i += 1) {
    const m = lines[i].trim().match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    // Trailing `# comment` after a plain value is allowed.
    let value = m[2].replace(/\s+#.*$/, "").trim();

    if (value === "" && /^\s*\[/.test(lines[i + 1] ?? "")) {
      value = "";
      while (i + 1 < lines.length) {
        i += 1;
        value += ` ${lines[i].trim()}`;
        if (value.trimEnd().endsWith("]")) break;
      }
      value = value.trim();
    } else if (value.startsWith("[") && !value.endsWith("]")) {
      while (i + 1 < lines.length && !value.endsWith("]")) {
        i += 1;
        value += ` ${lines[i].trim()}`;
      }
    } else if (value === "" && /^\s*-\s+/.test(lines[i + 1] ?? "")) {
      const items = [];
      while (i + 1 < lines.length && /^\s*-\s+/.test(lines[i + 1])) {
        i += 1;
        items.push(unquote(lines[i].trim().replace(/^-\s+/, "").replace(/,$/, "")));
      }
      data[key] = items;
      continue;
    }
    data[key] = scalarOrArray(value);
  }
  return { data, body };
}

const escapeYaml = (s) =>
  String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r?\n/g, " ");
const q = (s) => `"${escapeYaml(s)}"`;
const provenanceLine = (sourceRel) =>
  `<!-- generated from ${sourceRel} by ${SCRIPT_REL} — edit the source, not this file -->`;
const tidyBody = (body) => body.replace(/^\n+/, "").replace(/\s+$/, "\n");

// ---------------------------------------------------------------------------
// models.json — tier -> model per tool. `null` means the tool's default.
// ---------------------------------------------------------------------------

let modelMapCache;
function modelMap() {
  if (modelMapCache !== undefined) return modelMapCache;
  const path = join(ROOT, MODEL_MAP_REL);
  if (!existsSync(path)) return (modelMapCache = null);
  let data;
  try {
    data = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    fail(`${MODEL_MAP_REL} is not valid JSON: ${error.message}`);
  }
  const { tiers } = data;
  const errors = [];
  if (!Array.isArray(tiers) || tiers.length === 0 || tiers.some((t) => typeof t !== "string"))
    errors.push("'tiers' must be a non-empty array of tier names, cheapest first");
  for (const tool of Object.keys(AGENT_DIRS)) {
    const row = data.assistants?.[tool];
    if (!row || typeof row !== "object") errors.push(`'assistants.${tool}' is missing`);
    else
      for (const tier of Array.isArray(tiers) ? tiers : [])
        if (!(tier in row))
          errors.push(`'assistants.${tool}.${tier}' is missing (use null for the default)`);
        else if (row[tier] !== null && typeof row[tier] !== "string")
          errors.push(`'assistants.${tool}.${tier}' must be a model id or null`);
  }
  if (errors.length) fail(`invalid ${MODEL_MAP_REL}: ${errors.join("; ")}`);
  return (modelMapCache = { tiers, assistants: data.assistants });
}

// ---------------------------------------------------------------------------
// Agents
// ---------------------------------------------------------------------------

const KNOWN_KEYS = new Set(["name", "description", "tools", "model", "tier", "mode", "skills"]);
const CLAUDE_ALIASES = new Set(["opus", "sonnet", "haiku", "inherit"]);
/** Claude Code tool -> the OpenCode permission action it needs; actions an agent lacks are denied. */
const OPENCODE_ACTIONS = {
  Write: "edit",
  Edit: "edit",
  MultiEdit: "edit",
  NotebookEdit: "edit",
  Bash: "shell",
  WebFetch: "webfetch",
  WebSearch: "websearch",
  Task: "subagent",
  Agent: "subagent",
};

function normalizeAgent(data, entry, label) {
  const stem = entry.replace(/\.md$/, "");
  const errors = [];
  for (const key of Object.keys(data))
    if (!KNOWN_KEYS.has(key)) errors.push(`unknown key '${key}'`);
  if (data.name !== undefined && data.name !== stem)
    errors.push(`'name' is '${data.name}' but the file is ${entry} — they must match`);
  if (!data.description || typeof data.description !== "string")
    errors.push("missing or non-string 'description'");
  if (data.model !== undefined && typeof data.model !== "string")
    errors.push("'model' must be a string");
  if (data.tier !== undefined) {
    const map = modelMap();
    if (!map) errors.push(`'tier' needs ${MODEL_MAP_REL}, which does not exist`);
    else if (!map.tiers.includes(data.tier))
      errors.push(`'tier' is '${data.tier}'; ${MODEL_MAP_REL} defines: ${map.tiers.join(", ")}`);
  }
  if (data.mode !== undefined && !["primary", "subagent", "all"].includes(data.mode))
    errors.push("'mode' must be one of: primary, subagent, all");
  if (data.skills !== undefined && !Array.isArray(data.skills))
    errors.push("'skills' must be an array of skill names");
  if (errors.length) fail(`invalid agent frontmatter in ${label}: ${errors.join("; ")}`);

  const tools =
    data.tools === undefined
      ? undefined
      : (Array.isArray(data.tools) ? data.tools : String(data.tools).split(","))
          .map((t) => t.trim())
          .filter(Boolean);
  return {
    name: stem,
    description: data.description,
    tools,
    model: data.model,
    tier: data.tier,
    mode: data.mode ?? "subagent",
    skills: data.skills?.map(String),
  };
}

function loadAgent(entry) {
  const sourceRel = `${SOURCE}/agents/${entry}`;
  const parsed = parseFrontmatter(readFileSync(join(ROOT, sourceRel), "utf8"), sourceRel);
  return { sourceRel, agent: normalizeAgent(parsed.data, entry, sourceRel), body: parsed.body };
}

/** A path in an agent body that does not exist sends the agent after nothing. Placeholders are skipped. */
const REFERENCE =
  /^(\.agents|\.claude|\.opencode|apps|packages|services|tools)\/|^(AGENTS|CLAUDE|README)\.md$|^(turbo\.jsonc|pnpm-workspace\.yaml|\.oxlintrc\.json|mise\.toml|lefthook\.yml|opencode\.jsonc)$/;
const COMMAND = /`((?:pnpm|npx|node|turbo|git|gh|glab|encore)\s[^`]*)`/g;
const FORBIDS = /\b(never|not|don't|do not|must not|no)\b/i;

function agentDefects(agent, body) {
  const defects = [...new Set([...body.matchAll(/`([^`\s]+)`/g)].map((m) => m[1]))]
    .map((r) => r.replace(/[:#].*$/, "").replace(/[.,;)]+$/, ""))
    .filter((r) => REFERENCE.test(r) && !/[<>*{}]|NNNN|XX/.test(r) && !existsSync(join(ROOT, r)))
    .map((r) => `references \`${r}\`, which does not exist`);
  // shortcut: line-level negation heuristic; upgrade if prose false-positives appear.
  if (agent.tools && !agent.tools.includes("Bash"))
    for (const line of body.split("\n"))
      if (!FORBIDS.test(line))
        for (const m of line.matchAll(COMMAND))
          defects.push(`tells the agent to run \`${m[1]}\` but its tools have no Bash`);
  return defects;
}

function modelFor(agent, tool) {
  if (agent.model !== undefined) {
    const m = agent.model;
    if (tool === "claude")
      return CLAUDE_ALIASES.has(m) ? m : m.startsWith("anthropic/") ? m.slice(10) : undefined;
    return m.includes("/") ? m : undefined;
  }
  return agent.tier === undefined
    ? undefined
    : (modelMap().assistants[tool][agent.tier] ?? undefined);
}

function claudeFrontmatter(agent) {
  const lines = [`name: ${agent.name}`, `description: ${q(agent.description)}`];
  if (agent.tools) lines.push(`tools: ${agent.tools.join(", ")}`);
  const model = modelFor(agent, "claude");
  if (model) lines.push(`model: ${model}`);
  if (agent.skills?.length) lines.push("skills:", ...agent.skills.map((s) => `  - ${s}`));
  return lines;
}

function opencodeFrontmatter(agent) {
  const lines = [`description: ${q(agent.description)}`, `mode: ${agent.mode}`];
  const model = modelFor(agent, "opencode");
  if (model) lines.push(`model: ${q(model)}`);
  if (agent.tools) {
    const granted = new Set(agent.tools.map((t) => OPENCODE_ACTIONS[t]).filter(Boolean));
    const denied = [...new Set(Object.values(OPENCODE_ACTIONS))].filter((a) => !granted.has(a));
    const rules = denied.length
      ? denied.map((action) => ({ action, effect: "deny" }))
      : [{ action: "*", effect: "allow" }];
    lines.push("permissions:");
    for (const r of rules)
      lines.push(`  - action: ${q(r.action)}`, '    resource: "*"', `    effect: ${r.effect}`);
  }
  return lines;
}

const DIALECTS = { claude: claudeFrontmatter, opencode: opencodeFrontmatter };

function renderAgent(tool, sourceRel, agent, body) {
  return [
    `---\n${DIALECTS[tool](agent).join("\n")}\n---`,
    provenanceLine(sourceRel),
    tidyBody(body),
  ].join("\n\n");
}

/** Write `rendered` to `rel`, never clobbering a hand-written file; reports drift under --check. */
function place(rel, rendered, sourceRel) {
  const path = join(ROOT, rel);
  if (isSymlink(path)) {
    if (CHECK)
      return void results.drift.push(`${rel}: stale symlink where a generated file belongs`);
    rmSync(path);
  } else if (existsSync(path)) {
    const current = readFileSync(path, "utf8");
    if (current === rendered) return void results.ok++;
    if (!current.includes(provenanceLine(sourceRel)))
      return void results.conflict.push(`${rel}: real file, not generated from ${sourceRel}`);
    if (CHECK)
      return void results.drift.push(`${rel}: hand-edited or stale (differs from ${sourceRel})`);
  } else if (CHECK) {
    return void results.drift.push(`${rel}: missing`);
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, rendered);
  results.written++;
}

/** Remove (or report under --check) generated files / links into `.agents/` whose source is gone. */
function pruneStale(destRel, validNames) {
  const dir = join(ROOT, destRel);
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    if (validNames.has(name)) continue;
    const p = join(dir, name);
    const ours = isSymlink(p)
      ? readlinkSync(p).includes(`${SOURCE}/`)
      : /<!-- generated from \.agents\/\S+ by /.test(readFileSafe(p));
    if (!ours) continue;
    if (CHECK) results.drift.push(`${destRel}/${name}: stale, source no longer exists`);
    else {
      rmSync(p, { recursive: true });
      results.pruned++;
    }
  }
}

function readFileSafe(p) {
  try {
    return readFileSync(p, "utf8");
  } catch {
    return "";
  }
}

/** Agent sources: `.md` files that open with frontmatter. Everything else is listed as ignored. */
function agentEntries() {
  const entries = [];
  for (const e of sourceEntries("agents")) {
    const isDoc = !e.endsWith(".md") || e.toLowerCase() === "readme.md" || /-notes\.md$/i.test(e);
    if (!isDoc && /^---\r?\n/.test(readFileSafe(join(ROOT, SOURCE, "agents", e)))) entries.push(e);
    else results.ignored.push(e);
  }
  return entries;
}

// ---------------------------------------------------------------------------
// Rules -> marked block in AGENTS.md
// ---------------------------------------------------------------------------

const BLOCK_BEGIN = `<!-- BEGIN generated from ${SOURCE}/rules by ${SCRIPT_REL} — edit the sources, not this block -->`;
const BLOCK_END = `<!-- END generated from ${SOURCE}/rules -->`;
const BLOCK_BEGIN_PREFIX = `<!-- BEGIN generated from ${SOURCE}/rules`;

function loadRule(entry) {
  const sourceRel = `${SOURCE}/rules/${entry}`;
  const parsed = parseFrontmatter(readFileSync(join(ROOT, sourceRel), "utf8"), sourceRel);
  if (!parsed) fail(`${sourceRel} is missing required rule frontmatter (must start with "---").`);
  const { data } = parsed;
  const errors = [];
  for (const k of ["title", "description"])
    if (!data[k] || typeof data[k] !== "string") errors.push(`missing or non-string '${k}'`);
  for (const k of ["always", "manual"])
    if (data[k] !== undefined && typeof data[k] !== "boolean")
      errors.push(`'${k}' must be true|false`);
  if (data.applies_to !== undefined && !Array.isArray(data.applies_to))
    errors.push("'applies_to' must be an array of globs");
  if (errors.length) fail(`invalid rule frontmatter in ${sourceRel}: ${errors.join("; ")}`);

  const applies = data.applies_to ?? [];
  const manual = data.manual === true;
  const always = !manual && (data.always === true || applies.length === 0);
  return {
    sourceRel,
    title: data.title,
    description: data.description,
    applies,
    manual,
    always,
    body: parsed.body,
  };
}

/** Demote headings two levels outside code fences so a rule nests under the block's `##`. */
function demoteHeadings(body) {
  let fenced = false;
  return body
    .split("\n")
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
      return !fenced && /^#{1,4} /.test(line) ? `##${line}` : line;
    })
    .join("\n");
}

function renderRulesBlock(rules) {
  const out = [
    "## Repository rules",
    "",
    "Always-on rules follow in full. Read a file-scoped rule before touching a file its",
    "globs match.",
  ];
  for (const r of rules.filter((x) => x.always))
    out.push("", `<!-- source: ${r.sourceRel} -->`, "", demoteHeadings(r.body.trim()));
  const scoped = rules.filter((r) => !r.always && !r.manual);
  if (scoped.length) {
    out.push("", "### Read before touching matching files", "");
    // A list, not a table: the formatter re-aligns tables and would cause permanent drift.
    for (const r of scoped)
      out.push(
        `- **${r.title}** — ${r.applies.map((g) => `\`${g}\``).join(", ")}: read \`${r.sourceRel}\``,
      );
  }
  const manual = rules.filter((r) => r.manual);
  if (manual.length) {
    out.push("", "### On request", "");
    for (const r of manual) out.push(`- ${r.title} — ${r.description} (\`${r.sourceRel}\`)`);
  }
  return `${BLOCK_BEGIN}\n\n${out.join("\n")}\n\n${BLOCK_END}`;
}

function ensureRulesBlock(file, rules) {
  const path = join(ROOT, file);
  const rendered = renderRulesBlock(rules);
  const current = existsSync(path) ? readFileSync(path, "utf8") : "";
  const begin = current.indexOf(BLOCK_BEGIN_PREFIX);
  const end = current.indexOf(BLOCK_END);
  if ((begin === -1) !== (end === -1) || (begin !== -1 && end < begin))
    return void results.conflict.push(`${file}: unbalanced generated-rules markers; fix by hand`);

  let next;
  if (begin === -1) next = `${current.replace(/\s*$/, "")}${current ? "\n\n" : ""}${rendered}\n`;
  else {
    if (current.slice(begin, end + BLOCK_END.length) === rendered) return void results.ok++;
    next = current.slice(0, begin) + rendered + current.slice(end + BLOCK_END.length);
  }
  if (CHECK)
    return void results.drift.push(
      `${file}: generated rules block ${begin === -1 ? "missing" : "stale"}`,
    );
  writeFileSync(path, next);
  results.written++;
}

// ---------------------------------------------------------------------------
// Skills -> relative symlinks
// ---------------------------------------------------------------------------

function ensureSkillLink(name) {
  const rel = `${SKILLS_DEST}/${name}`;
  const link = join(ROOT, rel);
  const want = relative(dirname(link), join(ROOT, SOURCE, "skills", name));
  if (isSymlink(link)) {
    if (readlinkSync(link) === want) return void results.ok++;
    if (CHECK)
      return void results.drift.push(`${rel}: points at ${readlinkSync(link)}, expected ${want}`);
    rmSync(link);
  } else if (existsSync(link)) {
    return void results.conflict.push(
      `${rel}: real file or directory, not a symlink into ${SOURCE}/`,
    );
  } else if (CHECK) {
    return void results.drift.push(`${rel}: missing`);
  }
  mkdirSync(dirname(link), { recursive: true });
  symlinkSync(want, link);
  results.written++;
}

// ---------------------------------------------------------------------------

function main() {
  if (!existsSync(join(ROOT, SOURCE))) fail(`${SOURCE}/ does not exist — nothing to sync from.`);

  // Source validation runs in every mode; body defects fail the run once it has finished.
  const agents = agentEntries().map((entry) => ({ entry, ...loadAgent(entry) }));
  for (const { sourceRel, agent, body } of agents)
    for (const d of agentDefects(agent, body)) results.broken.push(`${sourceRel}: ${d}`);

  if (LINT) {
    for (const b of results.broken) console.error(`  BROKEN    ${b}`);
    console.log(
      `agents-sync: linted ${agents.length} agent source(s) — ${results.broken.length} defect(s)`,
    );
    return results.broken.length > 0 ? 1 : 0;
  }

  const rules = sourceEntries("rules")
    .filter((e) => e.endsWith(".md") && e.toLowerCase() !== "readme.md")
    .map(loadRule);
  if (rules.length) ensureRulesBlock("AGENTS.md", rules);

  for (const tool of Object.keys(AGENT_DIRS)) {
    for (const { entry, sourceRel, agent, body } of agents)
      place(`${AGENT_DIRS[tool]}/${entry}`, renderAgent(tool, sourceRel, agent, body), sourceRel);
    pruneStale(AGENT_DIRS[tool], new Set(agents.map((a) => a.entry)));
  }

  const skills = sourceEntries("skills").filter((n) =>
    lstatSync(join(ROOT, SOURCE, "skills", n)).isDirectory(),
  );
  for (const name of skills) ensureSkillLink(name);
  pruneStale(SKILLS_DEST, new Set(skills));

  for (const c of results.conflict) console.error(`  CONFLICT  ${c}`);
  for (const d of results.drift) console.error(`  DRIFT     ${d}`);
  for (const b of results.broken) console.error(`  BROKEN    ${b}`);
  console.log(
    `agents-sync: ${CHECK ? "checked" : "synced"} ${agents.length} agent(s), ${rules.length} rule(s), ` +
      `${skills.length} skill(s) — ${results.ok} up to date, ${results.written} written, ` +
      `${results.pruned} pruned, ${results.drift.length} drift, ${results.conflict.length} conflict, ` +
      `${results.broken.length} broken, ${results.ignored.length} ignored`,
  );

  if (results.conflict.length > 0 || results.broken.length > 0) return 1;
  if (CHECK && results.drift.length > 0) {
    console.error("\nagents-sync: run `pnpm agents:sync` to fix.");
    return 1;
  }
  return 0;
}

process.exit(main());
