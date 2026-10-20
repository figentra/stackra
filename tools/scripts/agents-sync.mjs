#!/usr/bin/env node
/**
 * agents-sync — project `.agents/` into Claude Code and OpenCode directories.
 *
 * `.agents/` is the single source of truth for every AI artifact in this repo —
 * skills, subagents, rules, hooks and templates (specs in `.agents/specs` are read in place). Claude Code and OpenCode
 * each expect their own layout, so this script projects every entry using one of
 * two strategies per (assistant, kind):
 *
 *   SYMLINK — skills, hooks, templates. Identical bytes for every
 *   assistant, so a per-entry relative symlink back into `.agents/` is correct.
 *   Per-entry, not whole-directory: an assistant can keep tool-specific files
 *   alongside the linked ones (`.claude/settings.json`), tools that refuse to
 *   descend into a symlinked directory still work, and `git` shows a readable
 *   diff when one entry changes.
 *
 *   GENERATE — agents. Claude Code and OpenCode each read a Markdown agent
 *   with their own frontmatter dialect; the body is identical, only the
 *   frontmatter differs. Rules are rendered into a marked block of the root
 *   AGENTS.md (read by both assistants — Claude via CLAUDE.md → @AGENTS.md,
 *   OpenCode natively).
 *
 *   MCP — `.mcp.yaml` (annotated, the source) is rendered to `.mcp.json`
 *   (comment-free), the only project MCP file Claude Code reads.
 *
 * ---------------------------------------------------------------------------
 * Neutral rule frontmatter schema (`.agents/rules/*.md`):
 *
 *   ---
 *   title: <string>                    required. Short display name.
 *   description: <string>              required. One line.
 *   always: true|false                 optional, default false. true = loaded
 *                                       unconditionally, every session.
 *   applies_to: [<glob>, ...]          optional, default []. Root-relative
 *                                       globs (minimatch, {dot:true} semantics).
 *   manual: true|false                 optional, default false. true = only
 *                                       pulled in when explicitly asked by name.
 *   ---
 *
 * Precedence: `manual` wins over `always`, which wins over `applies_to`. If none
 * of the three is meaningfully set, the rule is treated as `always`.
 *
 * Rules are rendered into a marked block of the root AGENTS.md: always-on rules
 * in full, file-scoped and manual rules as an index pointing at their source.
 *
 * ---------------------------------------------------------------------------
 * Neutral agent frontmatter schema (`.agents/agents/*.md`):
 *
 *   ---
 *   name: <string>                 optional; defaults to the file stem
 *   description: <string>          required
 *   tools: Read, Grep, Glob, Bash  optional; Claude Code tool names
 *   tier: steward|executor|…       optional; mapped per assistant by models.yaml
 *   model: opus|sonnet|haiku|<provider>/<model>  optional override of the tier
 *   mode: primary|subagent|all     optional; OpenCode only, default subagent
 *   permissions:                   optional; explicit rules, overrides the
 *     - action: shell                         permissions OpenCode would derive
 *       resource: "git *"                     from `tools`
 *       effect: allow|ask|deny
 *   skills:                        optional; skill names to reference
 *     - tdd
 *   ---
 *
 * Every generated file opens with a provenance marker:
 *   <!-- generated from .agents/<kind>/<name>.md by tools/scripts/agents-sync.mjs — edit the source, not this file -->
 * `--check` recognizes a file as "ours" by this exact marker string. A file at
 * a generated path WITHOUT the marker is a real hand-authored file and is
 * reported as a conflict, never overwritten. A file WITH the marker whose
 * content no longer matches the freshly-rendered output is reported as drift
 * under `--check` and repaired by a normal (non-check) run.
 * ---------------------------------------------------------------------------
 *
 * Usage:
 *   node tools/scripts/agents-sync.mjs                 # auto-detect assistants, sync
 *   node tools/scripts/agents-sync.mjs --check         # verify only; non-zero on drift (CI)
 *   node tools/scripts/agents-sync.mjs --assistant=claude,opencode
 *   node tools/scripts/agents-sync.mjs --prune         # also remove stale links/generated files
 *   node tools/scripts/agents-sync.mjs --list          # show the mapping and exit
 *   node tools/scripts/agents-sync.mjs --lint          # validate agent sources only; writes nothing
 *
 * Safety: a real file or directory sitting where a symlink or generated file
 * belongs is NEVER overwritten. It is reported as a conflict and the run
 * fails, because silently replacing hand-written content loses work.
 *
 * Dependency-free (node: builtins only) so CI can run it before `pnpm install`.
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
import { parse as parseYaml } from "yaml";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const SOURCE = ".agents";
const SCRIPT_REL = "tools/scripts/agents-sync.mjs";

/**
 * How each assistant names the things `.agents/` holds.
 * `null` means the assistant has no equivalent and that kind is skipped for it.
 */
const ASSISTANTS = {
  claude: {
    dir: ".claude",
    // Rules are not projected to .claude/rules — they render into the AGENTS.md
    // block, which Claude reads via CLAUDE.md → @AGENTS.md.
    map: {
      skills: "skills",
      agents: "agents",
      rules: null,
      hooks: "hooks",
      templates: "templates",
    },
  },
  opencode: {
    dir: ".opencode",
    // Skills are NOT projected: OpenCode V2 searches `.agents/skills` natively.
    // Rules have no directory in OpenCode V2 — rendered into the AGENTS.md block.
    map: {
      skills: null,
      agents: "agents",
      rules: null,
      hooks: null,
      templates: "templates",
    },
    instructionsBlock: "AGENTS.md",
  },
};

/** Kinds that are byte-identical everywhere and therefore symlinked. */
const SYMLINK_KINDS = ["skills", "hooks", "templates"];
/** Kinds whose content is translated per assistant and therefore generated. */
const GENERATE_KINDS = ["rules", "agents"];
const KINDS = [...SYMLINK_KINDS, ...GENERATE_KINDS];

const argv = process.argv.slice(2);
const has = (flag) => argv.includes(flag);
const valueOf = (name) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
};

const CHECK = has("--check");
const PRUNE = has("--prune");
const LIST = has("--list");
const LINT = has("--lint");

/** Assistants to sync: explicit if asked, else every one whose directory already exists. */
function selectAssistants() {
  const explicit = valueOf("assistant");
  if (explicit) {
    const names = explicit
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const unknown = names.filter((n) => !(n in ASSISTANTS));
    if (unknown.length > 0) {
      console.error(`agents-sync: unknown assistant(s): ${unknown.join(", ")}`);
      console.error(`             known: ${Object.keys(ASSISTANTS).join(", ")}`);
      process.exit(2);
    }
    return names;
  }
  const detected = Object.keys(ASSISTANTS).filter((n) => existsSync(join(ROOT, ASSISTANTS[n].dir)));
  if (detected.length === 0) {
    console.error(
      "agents-sync: no assistant directory found. Create one (e.g. `.claude/`) or pass --assistant=claude.",
    );
    process.exit(2);
  }
  return detected;
}

/** Entries under `.agents/<kind>/`, ignoring dotfiles (`.gitkeep` and friends). */
function sourceEntries(kind) {
  const dir = join(ROOT, SOURCE, kind);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => !name.startsWith("."))
    .toSorted();
}

const results = {
  linked: 0,
  generated: 0,
  ok: 0,
  drift: [],
  conflict: [],
  broken: [],
  overrides: [],
  pruned: 0,
};

function isSymlink(p) {
  try {
    return lstatSync(p).isSymbolicLink();
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// SYMLINK strategy (skills, hooks, templates).
// ---------------------------------------------------------------------------

/** Ensure `linkPath` is a relative symlink pointing at `targetPath`. */
function ensureLink(linkPath, targetPath, label) {
  const want = relative(dirname(linkPath), targetPath);

  if (existsSync(linkPath) || isSymlink(linkPath)) {
    if (isSymlink(linkPath)) {
      const actual = readlinkSync(linkPath);
      if (actual === want) {
        results.ok++;
        return;
      }
      if (CHECK) {
        results.drift.push(`${label}: points at ${actual}, expected ${want}`);
        return;
      }
      rmSync(linkPath);
    } else {
      // A real file/dir where a link belongs. Never clobber — this is someone's work.
      results.conflict.push(`${label}: real file or directory, not a symlink into ${SOURCE}/`);
      return;
    }
  }

  if (CHECK) {
    results.drift.push(`${label}: missing`);
    return;
  }
  mkdirSync(dirname(linkPath), { recursive: true });
  symlinkSync(want, linkPath);
  results.linked++;
}

/** Remove symlinks into `.agents/` whose source entry no longer exists. */
function pruneStaleLinks(assistantDir, destSub, validNames, label) {
  const dir = join(ROOT, assistantDir, destSub === "." ? "" : destSub);
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (!isSymlink(p)) continue;
    if (!readlinkSync(p).includes(`${SOURCE}/`)) continue;
    if (validNames.has(name)) continue;
    if (CHECK) {
      results.drift.push(`${label}/${name}: stale link, source no longer exists`);
    } else {
      rmSync(p);
      results.pruned++;
    }
  }
}

// ---------------------------------------------------------------------------
// AGENT strategy — one canonical source, one rendered dialect per assistant.
//
// `.agents/agents/<name>.md` carries neutral frontmatter (Claude Code's own
// vocabulary, because that is what every source was first written in). The body
// is identical for every assistant; only the frontmatter differs:
//
//   | neutral      | Claude Code           | OpenCode                          |
//   | ------------ | --------------------- | --------------------------------- |
//   | name         | name                  | — (the filename is the name)      |
//   | description  | description           | description                       |
//   | tools        | tools (verbatim)      | permissions derived: edit/shell   |
//   |              |                       | denied when the grant lacks them  |
//   | model        | alias, or anthropic/* | provider/* verbatim               |
//   |              | id; else omitted      |                                   |
//   | mode         | —                     | mode (default subagent)           |
//   | permissions  | — (tools is the grant)| permissions[] verbatim            |
//
// A field an assistant cannot express is omitted, never guessed: an omitted
// model means "the assistant's default", which is safer than a model id the
// assistant does not know.
// ---------------------------------------------------------------------------

/**
 * Claude Code tool name → OpenCode V2 permission action it needs
 * (https://opencode.ai/v2/docs/agents). OpenCode has no tool grant, so every
 * action here that an agent's `tools` does not reach is denied for it.
 */
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

/** Neutral model alias → Claude model id. An alias missing here is omitted. */
const CLAUDE_MODELS = { opus: "opus", sonnet: "sonnet", haiku: "haiku", inherit: "inherit" };

/** Parse the small YAML subset agent frontmatter uses. */
function parseAgentFrontmatter(raw, label) {
  const opensWith = raw.startsWith("---\n") || raw.startsWith("---\r\n");
  if (!opensWith) {
    console.error(
      `agents-sync: ${label} is missing required agent frontmatter (must start with "---").`,
    );
    process.exit(2);
  }

  const firstBreak = raw.indexOf("\n");
  const closeIdx = raw.indexOf("\n---", firstBreak);
  if (closeIdx === -1) {
    console.error(`agents-sync: ${label} has unterminated frontmatter (no closing "---").`);
    process.exit(2);
  }

  const fmBlock = raw.slice(firstBreak + 1, closeIdx);
  const body = raw.slice(closeIdx + 4).replace(/^\r?\n/, "");
  const data = {};
  const lines = fmBlock.split(/\r?\n/);

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line || line.startsWith("#")) continue;
    const m = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!m) continue;

    const [, key] = m;
    let valueRaw = m[2].trim();

    if (key === "permissions" && valueRaw === "") {
      const permissions = [];
      while (i + 1 < lines.length && /^\s*-\s+/.test(lines[i + 1])) {
        i += 1;
        const permission = {};
        let property = lines[i].trim().replace(/^-\s+/, "");
        let match = property.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
        if (match) permission[match[1]] = parseScalarOrArray(match[2].trim());

        while (i + 1 < lines.length && /^\s+[A-Za-z_][\w-]*:\s*/.test(lines[i + 1])) {
          i += 1;
          property = lines[i].trim();
          match = property.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
          if (match) permission[match[1]] = parseScalarOrArray(match[2].trim());
        }
        permissions.push(permission);
      }
      data.permissions = permissions;
      continue;
    }

    if (valueRaw.startsWith("[") && !valueRaw.endsWith("]")) {
      const parts = [valueRaw];
      while (i + 1 < lines.length && !parts.at(-1).trimEnd().endsWith("]")) {
        i += 1;
        parts.push(lines[i].trim());
      }
      valueRaw = parts.join(" ");
    } else if (valueRaw === "" && /^\s*-\s+/.test(lines[i + 1] ?? "")) {
      const items = [];
      while (i + 1 < lines.length && /^\s*-\s+/.test(lines[i + 1])) {
        i += 1;
        items.push(unquote(lines[i].trim().replace(/^-\s+/, "")));
      }
      data[key] = items;
      continue;
    }

    data[key] = parseScalarOrArray(valueRaw);
  }

  return { data, body };
}

/** Validate neutral agent frontmatter and resolve defaults. Unknown keys are an error. */
function normalizeAgent(data, entry, label) {
  const stem = entry.replace(/\.md$/, "");
  const errors = [];
  const known = new Set([
    "name",
    "description",
    "tools",
    "model",
    "tier",
    "mode",
    "blocks",
    "permissions",
    "skills",
  ]);
  for (const key of Object.keys(data)) if (!known.has(key)) errors.push(`unknown key '${key}'`);

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

  let tools;
  if (data.tools !== undefined) {
    const list = Array.isArray(data.tools) ? data.tools : String(data.tools).split(",");
    tools = list.map((t) => t.trim()).filter(Boolean);
  }

  let skills;
  if (data.skills !== undefined) {
    if (!Array.isArray(data.skills)) errors.push("'skills' must be an array of skill names");
    else {
      skills = data.skills.map(String);
      // `<plugin>:<skill>` is a Claude Code plugin skill; anything else must be vendored.
      const missing = skills.filter(
        (s) => !s.includes(":") && !existsSync(join(ROOT, SOURCE, "skills", s, "SKILL.md")),
      );
      if (missing.length)
        errors.push(`skill(s) ${missing.join(", ")} not found at ${SOURCE}/skills/<name>/SKILL.md`);
    }
  }

  if (data.permissions !== undefined) {
    if (!Array.isArray(data.permissions)) errors.push("'permissions' must be an array");
    else
      data.permissions.forEach((p, i) => {
        if (!p || typeof p !== "object" || Array.isArray(p)) {
          errors.push(`'permissions[${i}]' must be an object`);
          return;
        }
        if (typeof p.action !== "string")
          errors.push(`'permissions[${i}].action' must be a string`);
        if (typeof p.resource !== "string")
          errors.push(`'permissions[${i}].resource' must be a string`);
        if (!["allow", "ask", "deny"].includes(p.effect))
          errors.push(`'permissions[${i}].effect' must be one of: allow, ask, deny`);
      });
  }

  if (errors.length) {
    console.error(`agents-sync: invalid agent frontmatter in ${label}: ${errors.join("; ")}`);
    process.exit(2);
  }

  return {
    name: stem,
    description: data.description,
    tools,
    model: data.model,
    tier: data.tier,
    mode: data.mode ?? "subagent",
    permissions: data.permissions,
    skills,
  };
}

/**
 * A backticked repository path in an agent body is an instruction to read or write
 * it, so one that does not exist sends the agent after nothing. Placeholders
 * (`<name>`, `*`, `{a,b}`, `NNNN`/`XX`) are templates, not references, and are skipped.
 */
const REFERENCE =
  /^(\.agents|\.claude|\.opencode|apps|packages|services|tools)\/|^(AGENTS|CLAUDE|README)\.md$|^(turbo\.jsonc|pnpm-workspace\.yaml|\.oxlintrc\.jsonc|mise\.toml|lefthook\.yml|opencode\.jsonc)$/;

function brokenReferences(body) {
  const refs = [...body.matchAll(/`([^`\s]+)`/g)]
    .map((m) => m[1].replace(/[:#].*$/, "").replace(/[.,;)]+$/, ""))
    .filter((r) => REFERENCE.test(r) && !/[<>*{}]|NNNN|XX/.test(r));
  return [...new Set(refs)].filter((r) => !existsSync(join(ROOT, r)));
}

/**
 * A command the body tells the agent to run, when its tool grant has no shell, is an
 * instruction it cannot follow. A line that forbids the command ("never `git push`")
 * is not an instruction to run it.
 */
const COMMAND = /`((?:pnpm|npx|node|turbo|git|gh|glab|encore|lychee|markdownlint-cli2)\s[^`]*)`/g;
const FORBIDS = /\b(never|not|don't|do not|must not|no)\b/i;

function unrunnableCommands(agent, body) {
  if (!agent.tools || agent.tools.includes("Bash")) return [];
  const found = [];
  for (const line of body.split("\n")) {
    if (FORBIDS.test(line)) continue;
    for (const m of line.matchAll(COMMAND)) found.push(m[1]);
  }
  return [...new Set(found)];
}

/** Every body-level defect of one agent source, as human-readable strings. */
function agentDefects(agent, body) {
  return [
    ...brokenReferences(body).map((r) => `references \`${r}\`, which does not exist`),
    ...unrunnableCommands(agent, body).map(
      (c) => `tells the agent to run \`${c}\` but its tools have no Bash`,
    ),
  ];
}

/** Parse + validate one agent source; exits 2 on invalid frontmatter. */
function loadAgent(entry) {
  const sourceRel = `${SOURCE}/agents/${entry}`;
  const raw = readFileSync(join(ROOT, SOURCE, "agents", entry), "utf8");
  const { data, body } = parseAgentFrontmatter(raw, sourceRel);
  return { sourceRel, agent: normalizeAgent(data, entry, sourceRel), body };
}

/**
 * `.agents/models.yaml` — agents declare a tier, this file says which model each
 * assistant runs for that tier. `tiers` is ordered cheapest → strongest (the order
 * a failing output escalates in). A `null` model means "the assistant's default".
 *
 *   tiers: [steward, executor, …]
 *   assistants: { claude: { steward: haiku, … }, opencode: { … } }
 */
const MODEL_MAP_REL = `${SOURCE}/models.yaml`;
let modelMapCache;

function modelMap() {
  if (modelMapCache !== undefined) return modelMapCache;
  const path = join(ROOT, MODEL_MAP_REL);
  if (!existsSync(path)) return (modelMapCache = null);
  let data;
  try {
    data = parseYaml(readFileSync(path, "utf8"));
  } catch (error) {
    console.error(`agents-sync: ${MODEL_MAP_REL} is not valid YAML: ${error.message}`);
    process.exit(2);
  }
  const errors = [];
  const tiers = data.tiers;
  if (!Array.isArray(tiers) || tiers.length === 0 || tiers.some((t) => typeof t !== "string"))
    errors.push("'tiers' must be a non-empty array of tier names, cheapest first");
  const assistants = data.assistants ?? {};
  for (const name of Object.keys(AGENT_DIALECTS)) {
    const row = assistants[name];
    if (!row || typeof row !== "object") {
      errors.push(`'assistants.${name}' is missing`);
      continue;
    }
    for (const tier of Array.isArray(tiers) ? tiers : []) {
      if (!(tier in row))
        errors.push(
          `'assistants.${name}.${tier}' is missing (use null for the assistant's default)`,
        );
      else if (row[tier] !== null && typeof row[tier] !== "string")
        errors.push(`'assistants.${name}.${tier}' must be a model id or null`);
    }
  }
  if (errors.length) {
    console.error(`agents-sync: invalid ${MODEL_MAP_REL}: ${errors.join("; ")}`);
    process.exit(2);
  }
  return (modelMapCache = { tiers, assistants });
}

/** The model an assistant renders for an agent: an explicit `model` override, else its tier's mapping. */
function modelFor(agent, assistantName, aliases, options) {
  if (agent.model !== undefined) return resolveModel(agent.model, aliases, options);
  if (agent.tier !== undefined)
    return modelMap().assistants[assistantName][agent.tier] ?? undefined;
  return undefined;
}

/** Resolve a neutral model for one assistant; `undefined` means "omit, use the default". */
function resolveModel(model, aliases, { passProvider }) {
  if (model === undefined) return undefined;
  if (model in aliases) return aliases[model];
  if (!model.includes("/")) return undefined;
  if (passProvider === "all") return model;
  const [provider, ...rest] = model.split("/");
  return provider === passProvider ? rest.join("/") : undefined;
}

/** Quote a YAML scalar deterministically. */
function yamlScalar(value) {
  if (typeof value === "boolean" || typeof value === "number") return String(value);
  if (value === null) return "null";
  return `"${escapeYamlDouble(String(value))}"`;
}

function escapeYamlDouble(s) {
  return String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r?\n/g, " ");
}

function claudeAgentFrontmatter(agent) {
  const lines = [`name: ${agent.name}`, `description: ${yamlScalar(agent.description)}`];
  if (agent.tools) lines.push(`tools: ${agent.tools.join(", ")}`);
  const model = modelFor(agent, "claude", CLAUDE_MODELS, { passProvider: "anthropic" });
  if (model) lines.push(`model: ${model}`);
  if (agent.skills?.length) lines.push("skills:", ...agent.skills.map((s) => `  - ${s}`));
  return lines;
}

/** OpenCode has no tool grant, only permissions — so a missing tool becomes a deny. */
function deriveOpenCodePermissions(tools) {
  if (!tools) return undefined;
  const granted = new Set(tools.map((t) => OPENCODE_ACTIONS[t]).filter(Boolean));
  const denied = [...new Set(Object.values(OPENCODE_ACTIONS))]
    .filter((action) => !granted.has(action))
    .map((action) => ({ action, resource: "*", effect: "deny" }));
  return denied.length ? denied : [{ action: "*", resource: "*", effect: "allow" }];
}

function openCodeAgentFrontmatter(agent) {
  const lines = [`description: ${yamlScalar(agent.description)}`, `mode: ${agent.mode}`];
  const model = modelFor(agent, "opencode", {}, { passProvider: "all" });
  if (model) lines.push(`model: ${yamlScalar(model)}`);
  const permissions = agent.permissions ?? deriveOpenCodePermissions(agent.tools);
  if (permissions?.length) {
    lines.push("permissions:");
    for (const p of permissions) {
      lines.push(`  - action: ${yamlScalar(p.action)}`);
      lines.push(`    resource: ${yamlScalar(p.resource)}`);
      lines.push(`    effect: ${p.effect}`);
    }
  }
  return lines;
}

/** Assistant → frontmatter renderer. An assistant whose `map.agents` is set must appear here. */
const AGENT_DIALECTS = {
  claude: claudeAgentFrontmatter,
  opencode: openCodeAgentFrontmatter,
};

function renderAgentFile(assistantName, sourceRel, agent, body) {
  const frontmatter = AGENT_DIALECTS[assistantName](agent).join("\n");
  const trimmedBody = body.replace(/^\n+/, "").replace(/\s+$/, "\n");
  return [`---\n${frontmatter}\n---`, provenanceLine(sourceRel), trimmedBody].join("\n\n");
}

/** Generate one agent while preserving the same conflict/drift guarantees as rules. */
function ensureGeneratedAgent(assistantName, dir, destSub, entry) {
  const { sourceRel, agent, body } = loadAgent(entry);
  const destPath = join(ROOT, dir, destSub, entry);
  const label = `${dir}/${destSub}/${entry}`;
  const rendered = renderAgentFile(assistantName, sourceRel, agent, body);

  if (existsSync(destPath) && !isSymlink(destPath)) {
    const current = readFileSync(destPath, "utf8");
    if (current === rendered) {
      results.ok++;
      return;
    }
    if (!isOurGeneratedContent(current, sourceRel)) {
      results.conflict.push(`${label}: real file, not generated by agents-sync from ${sourceRel}`);
      return;
    }
    if (CHECK) {
      results.drift.push(
        `${label}: hand-edited or stale (content differs from what ${sourceRel} generates)`,
      );
      return;
    }
    writeFileSync(destPath, rendered);
    results.generated++;
    return;
  }

  if (isSymlink(destPath)) {
    if (CHECK) {
      results.drift.push(`${label}: stale symlink where a generated agent belongs`);
      return;
    }
    rmSync(destPath);
  }

  if (CHECK) {
    results.drift.push(`${label}: missing`);
    return;
  }
  mkdirSync(dirname(destPath), { recursive: true });
  writeFileSync(destPath, rendered);
  results.generated++;
}

/** Remove generated agent files whose source entry no longer exists. */
function pruneStaleGeneratedAgents(dir, destSub, validEntries, label) {
  const destDir = join(ROOT, dir, destSub);
  if (!existsSync(destDir)) return;

  for (const name of readdirSync(destDir)) {
    if (validEntries.has(name)) continue;
    const p = join(destDir, name);
    // A symlink into `.agents/` here predates generation (README.md, notes files):
    // the assistant would try to load it as an agent.
    if (isSymlink(p)) {
      if (!readlinkSync(p).includes(`${SOURCE}/`)) continue;
      if (CHECK)
        results.drift.push(`${label}/${name}: symlink into ${SOURCE}/, not a generated agent`);
      else {
        rmSync(p);
        results.pruned++;
      }
      continue;
    }

    let content;
    try {
      content = readFileSync(p, "utf8");
    } catch {
      continue;
    }
    if (!content.includes(`generated from ${SOURCE}/agents/`)) continue;

    if (CHECK)
      results.drift.push(`${label}/${name}: stale generated agent, source no longer exists`);
    else {
      rmSync(p);
      results.pruned++;
    }
  }
}

// ---------------------------------------------------------------------------
// GENERATE strategy (rules) — rendered into the AGENTS.md block.
// ---------------------------------------------------------------------------

function provenanceLine(sourceRel) {
  return `<!-- generated from ${sourceRel} by ${SCRIPT_REL} — edit the source, not this file -->`;
}

function isOurGeneratedContent(content, sourceRel) {
  return content.includes(provenanceLine(sourceRel));
}

/** Minimal frontmatter parser for the neutral rule schema. Not a general YAML parser. */
function parseNeutralFrontmatter(raw, label) {
  const opensWith = raw.startsWith("---\n") || raw.startsWith("---\r\n");
  if (!opensWith) {
    console.error(
      `agents-sync: ${label} is missing required neutral frontmatter (must start with "---").`,
    );
    process.exit(2);
  }
  const firstBreak = raw.indexOf("\n");
  const closeIdx = raw.indexOf("\n---", firstBreak);
  if (closeIdx === -1) {
    console.error(`agents-sync: ${label} has unterminated frontmatter (no closing "---").`);
    process.exit(2);
  }
  const fmBlock = raw.slice(firstBreak + 1, closeIdx);
  const afterClose = raw.slice(closeIdx + 4);
  const body = afterClose.replace(/^\r?\n/, "");

  const data = {};
  const lines = fmBlock.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line || line.startsWith("#")) continue;
    const m = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!m) continue;
    const [, key] = m;
    let valueRaw = m[2].trim();

    // A YAML flow array may be written across several lines. oxfmt reflows a long
    // `applies_to: ["a", "b", …]` into exactly that shape, so a parser that only
    // understood the single-line form rejected a file it had itself just formatted —
    // and the error pointed at the rule, not at the formatter.
    if (valueRaw.startsWith("[") && !valueRaw.endsWith("]")) {
      const parts = [valueRaw];
      while (i + 1 < lines.length && !parts.at(-1).trimEnd().endsWith("]")) {
        i += 1;
        parts.push(lines[i].trim());
      }
      valueRaw = parts.join(" ");
    } else if (valueRaw === "" && lines[i + 1]?.trim().startsWith("[")) {
      // Or the flow array opens on the NEXT line, which is the shape oxfmt actually
      // produces:  applies_to:\n  [\n    "a",\n    "b",\n  ]
      const parts = [];
      while (i + 1 < lines.length) {
        i += 1;
        parts.push(lines[i].trim());
        if (parts.at(-1).endsWith("]")) break;
      }
      valueRaw = parts.join(" ");
    } else if (valueRaw === "") {
      // Or as a block sequence:  applies_to:\n  - "a"\n  - "b"
      const items = [];
      while (i + 1 < lines.length && /^\s*-\s+/.test(lines[i + 1])) {
        i += 1;
        items.push(lines[i].trim().replace(/^-\s+/, ""));
      }
      if (items.length > 0) {
        data[key] = items.map((item) => unquote(item.replace(/,$/, "")));
        continue;
      }
    }

    data[key] = parseScalarOrArray(valueRaw);
  }
  return { data, body };
}

function parseScalarOrArray(v) {
  if (v === "") return "";
  if (v === "true") return true;
  if (v === "false") return false;
  if (v.startsWith("[") && v.endsWith("]")) {
    const inner = v.slice(1, -1).trim();
    if (!inner) return [];
    return inner
      .split(",")
      .map((s) => unquote(s.trim()))
      .filter((s) => s !== "");
  }
  return unquote(v);
}

function unquote(s) {
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

/** Validate + apply defaults/precedence to a parsed neutral frontmatter object. */
function normalizeNeutral(data, label) {
  const errors = [];
  if (!data.title || typeof data.title !== "string") errors.push("missing or non-string 'title'");
  if (!data.description || typeof data.description !== "string")
    errors.push("missing or non-string 'description'");
  if (data.always !== undefined && typeof data.always !== "boolean")
    errors.push("'always' must be true|false");
  if (data.manual !== undefined && typeof data.manual !== "boolean")
    errors.push("'manual' must be true|false");
  if (data.applies_to !== undefined && !Array.isArray(data.applies_to)) {
    errors.push("'applies_to' must be a [array] of glob strings");
  }
  if (errors.length > 0) {
    console.error(`agents-sync: invalid neutral frontmatter in ${label}: ${errors.join("; ")}`);
    process.exit(2);
  }

  const neutral = {
    title: data.title,
    description: data.description,
    always: data.always === true,
    manual: data.manual === true,
    applies_to: Array.isArray(data.applies_to) ? data.applies_to : [],
  };

  // A rule with no meaningful mode is `always`.
  if (!neutral.manual && !neutral.always && neutral.applies_to.length === 0) {
    neutral.always = true;
  }
  return neutral;
}

// ---------------------------------------------------------------------------
// INSTRUCTIONS BLOCK — rules rendered into a marked block of the root
// AGENTS.md (read by both Claude Code and OpenCode). Everything outside the
// markers is hand-written and never touched.
// ---------------------------------------------------------------------------

const BLOCK_BEGIN = `<!-- BEGIN generated from ${SOURCE}/rules by ${SCRIPT_REL} — edit the sources, not this block -->`;
const BLOCK_END = `<!-- END generated from ${SOURCE}/rules -->`;
const BLOCK_BEGIN_PREFIX = `<!-- BEGIN generated from ${SOURCE}/rules`;

/** Demote every Markdown heading two levels, outside fenced code, so a rule nests under the block's `##`. */
function demoteHeadings(body, by = "##") {
  let fenced = false;
  return body
    .split("\n")
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
      return !fenced && /^#{1,4} /.test(line) ? `${by}${line}` : line;
    })
    .join("\n");
}

// ---------------------------------------------------------------------------
// CONSTITUTION — spec-kit reads `.specify/memory/constitution.md`; its single source is the
// docs laws in apps/docs/src/constitution/*.mdx. Generated whole, drift-checked like the rest.
// ---------------------------------------------------------------------------

const CONSTITUTION_SRC = "apps/docs/src/constitution";
const CONSTITUTION_OUT = ".specify/memory/constitution.md";

function renderConstitution(files) {
  const laws = files.map((f) => {
    const raw = readFileSync(join(ROOT, CONSTITUTION_SRC, f), "utf8");
    const { data, body } = parseNeutralFrontmatter(raw, `${CONSTITUTION_SRC}/${f}`);
    // Docs components (<Note>, <Steps>…) are Mintlify-only; keep their text, drop the tags. oxfmt wraps a
    // component's body onto indented lines, so a <Step> joins into one list item and other bodies are dedented
    // (left indented, they would render as code blocks).
    let text = body.replace(
      /^[ \t]*<Step title="([^"]*)">([\s\S]*?)<\/Step>[ \t]*$/gm,
      (_, title, inner) =>
        `- **${title}**: ${inner
          .trim()
          .split(/\s*\n\s*/)
          .join(" ")}`,
    );
    const block = /^([ \t]*)<([A-Z][A-Za-z]*)\b[^>\n]*>\n([\s\S]*?)\n\1<\/\2>[ \t]*$/gm;
    while (block.test(text))
      text = text.replace(block, (_, _indent, _tag, inner) => {
        const pad = Math.min(
          ...inner
            .split("\n")
            .filter((l) => l.trim())
            .map((l) => /^ */.exec(l)[0].length),
        );
        return `\n${inner.replace(new RegExp(`^ {0,${pad}}`, "gm"), "")}\n`;
      });
    text = text.replace(/^\s*<\/?[A-Z][A-Za-z]*[^>\n]*>\s*$/gm, "").replace(/\n{3,}/g, "\n\n");
    return `## ${unquote(String(data.title ?? f))}\n\n${demoteHeadings(text.trim(), "#")}`;
  });
  return [
    "# Stackra Constitution",
    "",
    `<!-- generated from ${CONSTITUTION_SRC}/*.mdx by ${SCRIPT_REL} — edit the sources, not this file -->`,
    "",
    ...laws.flatMap((l) => [l, ""]),
  ].join("\n");
}

function ensureConstitution() {
  const dir = join(ROOT, CONSTITUTION_SRC);
  if (!existsSync(dir)) return;
  // index first (the hierarchy), then the laws alphabetically
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".mdx"))
    .toSorted((a, b) => (a === "index.mdx" ? -1 : b === "index.mdx" ? 1 : a.localeCompare(b)));
  const rendered = renderConstitution(files);
  const out = join(ROOT, CONSTITUTION_OUT);
  if (existsSync(out) && readFileSync(out, "utf8") === rendered) return void results.ok++;
  if (CHECK)
    return void results.drift.push(`${CONSTITUTION_OUT}: ${existsSync(out) ? "stale" : "missing"}`);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, rendered);
  results.generated++;
}

/** Always-on rules in full; file-scoped and manual rules as an index pointing at their source. */
function renderRulesBlock(ruleEntries) {
  const rules = ruleEntries.map((entry) => {
    const sourceRel = `${SOURCE}/rules/${entry}`;
    const raw = readFileSync(join(ROOT, SOURCE, "rules", entry), "utf8");
    const { data, body } = parseNeutralFrontmatter(raw, sourceRel);
    return { sourceRel, neutral: normalizeNeutral(data, sourceRel), body };
  });
  const always = rules.filter((r) => r.neutral.always && !r.neutral.manual);
  const scoped = rules.filter((r) => !r.neutral.always && !r.neutral.manual);
  const manual = rules.filter((r) => r.neutral.manual);

  const out = [
    "## Repository rules",
    "",
    "Always-on rules follow in full. Read a file-scoped rule before touching a file its",
    "globs match.",
  ];
  for (const r of always) {
    out.push("", `<!-- source: ${r.sourceRel} -->`, "", demoteHeadings(r.body.trim()));
  }
  if (scoped.length) {
    out.push("", "### Read before touching matching files", "");
    // A list, not a table: the repository formatter re-aligns table columns, and a block
    // it rewrites would never again equal what this renders — permanent drift.
    for (const r of scoped)
      out.push(
        `- **${r.neutral.title}** — ${r.neutral.applies_to.map((g) => `\`${g}\``).join(", ")}: read \`${r.sourceRel}\``,
      );
  }
  if (manual.length) {
    out.push("", "### On request", "");
    for (const r of manual)
      out.push(`- ${r.neutral.title} — ${r.neutral.description} (\`${r.sourceRel}\`)`);
  }
  return `${BLOCK_BEGIN}\n\n${out.join("\n")}\n\n${BLOCK_END}`;
}

function ensureInstructionsBlock(file, ruleEntries) {
  const path = join(ROOT, file);
  const rendered = renderRulesBlock(ruleEntries);
  const current = existsSync(path) ? readFileSync(path, "utf8") : "";
  const begin = current.indexOf(BLOCK_BEGIN_PREFIX);
  const endAt = current.indexOf(BLOCK_END);

  if ((begin === -1) !== (endAt === -1) || (begin !== -1 && endAt < begin)) {
    results.conflict.push(`${file}: unbalanced generated-rules markers; fix by hand`);
    return;
  }
  let next;
  if (begin === -1) {
    next = `${current.replace(/\s*$/, "")}${current ? "\n\n" : ""}${rendered}\n`;
  } else {
    const existing = current.slice(begin, endAt + BLOCK_END.length);
    if (existing === rendered) {
      results.ok++;
      return;
    }
    next = current.slice(0, begin) + rendered + current.slice(endAt + BLOCK_END.length);
  }
  if (CHECK) {
    results.drift.push(`${file}: generated rules block ${begin === -1 ? "missing" : "stale"}`);
    return;
  }
  writeFileSync(path, next);
  results.generated++;
}

/** Renders `.mcp.yaml` into `.mcp.json`, which Claude Code reads (it reads only strict JSON). */
function ensureMcpJson() {
  const source = join(ROOT, ".mcp.yaml");
  if (!existsSync(source)) return;
  let rendered;
  try {
    rendered = `${JSON.stringify(parseYaml(readFileSync(source, "utf8")), null, 2)}\n`;
  } catch (error) {
    results.broken.push(`.mcp.yaml: ${error.message}`);
    return;
  }
  const target = join(ROOT, ".mcp.json");
  if (existsSync(target) && readFileSync(target, "utf8") === rendered) {
    results.ok++;
    return;
  }
  if (CHECK) {
    results.drift.push(
      `.mcp.json: ${existsSync(target) ? "stale" : "missing"} (generated from .mcp.yaml)`,
    );
    return;
  }
  writeFileSync(target, rendered);
  results.generated++;
}

/** Links a retired projection (a kind now mapped to null) left behind; the directory goes if empty. */
function pruneRetiredProjection(assistantDir, kind) {
  const dir = join(ROOT, assistantDir, kind);
  if (!existsSync(dir) || isSymlink(dir)) return;
  pruneStaleLinks(assistantDir, kind, new Set(), `${assistantDir}/${kind}`);
  if (!CHECK && readdirSync(dir).length === 0) rmSync(dir, { recursive: true });
}

// ---------------------------------------------------------------------------

function main() {
  if (!existsSync(join(ROOT, SOURCE))) {
    console.error(`agents-sync: ${SOURCE}/ does not exist — nothing to sync from.`);
    process.exit(2);
  }

  // Source-level validation runs once, before any projection, in every mode: frontmatter
  // errors exit 2 inside loadAgent; body defects fail the run once it has finished.
  //
  // Agent files follow a naming convention: lowercase letters, digits and dashes,
  // ending in .md. Anything else (README.md, DESIGN-AGENCY-COMPLETE.md,
  // MIGRATION-NOTES.md, …) is documentation, not an agent, and is never projected.
  const agentEntries = sourceEntries("agents").filter((e) => /^[a-z][a-z0-9-]*\.md$/.test(e));
  for (const entry of agentEntries) {
    const { sourceRel, agent, body } = loadAgent(entry);
    for (const defect of agentDefects(agent, body)) results.broken.push(`${sourceRel}: ${defect}`);
    if (agent.model !== undefined)
      results.overrides.push(
        `${sourceRel}: model '${agent.model}' overrides ${agent.tier ? `tier '${agent.tier}'` : `${MODEL_MAP_REL}`}`,
      );
  }
  // ADR 0121 D3: the sdlc plugin is retired here, so no route or agent may point at `sdlc:*`.
  for (const rel of [
    `${SOURCE}/routing.yaml`,
    ...agentEntries.map((e) => `${SOURCE}/agents/${e}`),
  ]) {
    const path = join(ROOT, rel);
    if (existsSync(path) && /\bsdlc:/.test(readFileSync(path, "utf8")))
      results.broken.push(`${rel}: references the retired sdlc plugin (ADR 0121 D3)`);
  }

  if (LINT) {
    for (const b of results.broken) console.error(`  BROKEN    ${b}`);
    for (const o of results.overrides) console.log(`  OVERRIDE  ${o}`);
    console.log(
      `agents-sync: linted ${agentEntries.length} agent source(s) — ${results.broken.length} defect(s)`,
    );
    return results.broken.length > 0 ? 1 : 0;
  }

  const assistants = selectAssistants();
  const noDialect = assistants.filter(
    (n) => ASSISTANTS[n].map.agents !== null && !(n in AGENT_DIALECTS),
  );
  if (noDialect.length > 0) {
    console.error(
      `agents-sync: no agent dialect for ${noDialect.join(", ")} — add one to AGENT_DIALECTS.`,
    );
    process.exit(2);
  }

  if (LIST) {
    console.log(`source: ${SOURCE}/\n`);
    for (const name of assistants) {
      const { dir, map } = ASSISTANTS[name];
      console.log(`${name} (${dir}/)`);
      for (const kind of KINDS) {
        const dest = map[kind];
        const n = sourceEntries(kind).length;
        const mode = GENERATE_KINDS.includes(kind) ? "generated" : "symlinked";
        console.log(
          dest === null
            ? `  ${kind.padEnd(10)} — not supported`
            : `  ${kind.padEnd(10)} -> ${dir}/${dest === "." ? "" : `${dest}/`}  (${n} entr${n === 1 ? "y" : "ies"}, ${mode})`,
        );
      }
      console.log("");
    }
    return 0;
  }

  ensureConstitution();
  ensureMcpJson();
  const ruleSources = sourceEntries("rules").filter((e) => e.toLowerCase() !== "readme.md");
  for (const name of assistants) {
    const { dir, map, instructionsBlock } = ASSISTANTS[name];
    if (instructionsBlock && ruleSources.length)
      ensureInstructionsBlock(instructionsBlock, ruleSources);
    for (const kind of KINDS) {
      const dest = map[kind];
      if (dest === null) {
        if (SYMLINK_KINDS.includes(kind) && (PRUNE || CHECK)) pruneRetiredProjection(dir, kind);
        continue;
      }
      const entries = sourceEntries(kind);
      if (entries.length === 0) continue;

      if (SYMLINK_KINDS.includes(kind)) {
        for (const entry of entries) {
          const linkPath = join(ROOT, dir, dest, entry);
          const targetPath = join(ROOT, SOURCE, kind, entry);
          ensureLink(linkPath, targetPath, `${dir}/${dest}/${entry}`);
        }
        if (PRUNE || CHECK) {
          pruneStaleLinks(dir, dest, new Set(entries), `${dir}/${dest}`);
        }
      } else if (kind === "agents") {
        for (const entry of agentEntries) ensureGeneratedAgent(name, dir, dest, entry);
        if (PRUNE || CHECK) {
          pruneStaleGeneratedAgents(dir, dest, new Set(agentEntries), `${dir}/${dest}`);
        }
      }
    }
  }

  for (const c of results.conflict) console.error(`  CONFLICT  ${c}`);
  for (const d of results.drift) console.error(`  DRIFT     ${d}`);
  for (const b of results.broken) console.error(`  BROKEN    ${b}`);
  for (const o of results.overrides) console.log(`  OVERRIDE  ${o}`);

  const verb = CHECK ? "checked" : "synced";
  console.log(
    `agents-sync: ${verb} ${assistants.join(", ")} — ${results.ok} up to date, ` +
      `${results.linked} linked, ${results.generated} generated, ${results.pruned} pruned, ` +
      `${results.drift.length} drift, ${results.conflict.length} conflict, ` +
      `${results.broken.length} broken`,
  );

  if (results.conflict.length > 0 || results.broken.length > 0) return 1;
  if (CHECK && results.drift.length > 0) {
    console.error("\nagents-sync: run `pnpm agents:sync` to fix.");
    return 1;
  }
  return 0;
}

process.exit(main());
