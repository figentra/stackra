/**
 * @module tools/scripts/agents-sync.test
 *
 * Purpose: hold `agents-sync.mjs`'s agent projection to each assistant's dialect — Claude
 *          Code and OpenCode — and to its safety guarantees (never clobber, --check
 *          detects drift, --prune removes only what it owns, bad sources fail loudly).
 * Boundary: runs the real script against a throwaway repository in the OS temp dir; never
 *           reads or writes this repository's own `.agents/` or assistant directories.
 * Runtime: node — uses node:test, node:assert and node:child_process.
 *
 * The script executes on load (it calls `process.exit(main())`), so it is exercised as a
 * child process against a copied fixture root rather than imported.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), "../agents-sync.mjs");

const READ_ONLY = `---
name: reviewer
description: Reviews changes for correctness and regressions
tools: Read, Grep, Glob
model: sonnet
---

# reviewer

Body text.
`;

const FULL = `---
name: builder
description: Builds things
tools: Read, Write, Edit, Bash, Grep, Glob, TodoWrite, WebFetch, WebSearch, Agent
model: opus
---

# builder
`;

/** A throwaway repo root holding the script, the given agent sources, and the given assistant dirs. */
function fixture(agents, assistants = [".claude", ".opencode"]) {
  const root = mkdtempSync(join(tmpdir(), "agents-sync-"));
  mkdirSync(join(root, "tools/scripts"), { recursive: true });
  copyFileSync(SCRIPT, join(root, "tools/scripts/agents-sync.mjs"));
  // the script's one dependency (yaml) resolves through the repo's node_modules
  symlinkSync(join(dirname(SCRIPT), "../../node_modules"), join(root, "node_modules"));
  mkdirSync(join(root, ".agents/agents"), { recursive: true });
  for (const [name, content] of Object.entries(agents))
    writeFileSync(join(root, ".agents/agents", name), content);
  for (const dir of assistants) mkdirSync(join(root, dir));
  return root;
}

function run(root, ...args) {
  const r = spawnSync(process.execPath, [join(root, "tools/scripts/agents-sync.mjs"), ...args], {
    encoding: "utf8",
  });
  return { code: r.status, out: r.stdout + r.stderr };
}

const read = (root, path) => readFileSync(join(root, path), "utf8");
const deny = (action) => [`  - action: "${action}"`, '    resource: "*"', "    effect: deny"];
const frontmatter = (text) => text.slice(4, text.indexOf("\n---", 4));

function withFixture(agents, fn, assistants) {
  const root = fixture(agents, assistants);
  try {
    fn(root);
  } finally {
    rmSync(root, { recursive: true });
  }
}

// ---------------------------------------------------------------------------
// Dialects
// ---------------------------------------------------------------------------

test("Claude Code receives name, description, tools and model as frontmatter", () => {
  withFixture({ "reviewer.md": READ_ONLY }, (root) => {
    assert.equal(run(root).code, 0);
    const out = read(root, ".claude/agents/reviewer.md");
    assert.equal(
      frontmatter(out),
      [
        "name: reviewer",
        'description: "Reviews changes for correctness and regressions"',
        "tools: Read, Grep, Glob",
        "model: sonnet",
      ].join("\n"),
    );
    assert.match(out, /<!-- generated from \.agents\/agents\/reviewer\.md/);
    assert.match(out, /# reviewer\n\nBody text\.\n$/);
  });
});

test("OpenCode denies every action the tool grant does not reach", () => {
  withFixture({ "reviewer.md": READ_ONLY }, (root) => {
    assert.equal(run(root).code, 0);
    assert.equal(
      frontmatter(read(root, ".opencode/agents/reviewer.md")),
      [
        'description: "Reviews changes for correctness and regressions"',
        "mode: subagent",
        "permissions:",
        ...deny("edit"),
        ...deny("shell"),
        ...deny("webfetch"),
        ...deny("websearch"),
        ...deny("subagent"),
      ].join("\n"),
    );
  });
});

test("OpenCode allows everything when the grant reaches every action", () => {
  withFixture({ "builder.md": FULL }, (root) => {
    assert.equal(run(root).code, 0);
    assert.match(
      read(root, ".opencode/agents/builder.md"),
      /permissions:\n {2}- action: "\*"\n {4}resource: "\*"\n {4}effect: allow\n/,
    );
  });
});

test("a non-Anthropic model is kept for OpenCode and omitted for Claude", () => {
  const src = READ_ONLY.replace("model: sonnet", "model: amazon-bedrock/zai.glm-5");
  withFixture({ "reviewer.md": src }, (root) => {
    assert.equal(run(root).code, 0);
    assert.doesNotMatch(read(root, ".claude/agents/reviewer.md"), /\nmodel:/);
    assert.match(read(root, ".opencode/agents/reviewer.md"), /model: "amazon-bedrock\/zai\.glm-5"/);
  });
});

test("an anthropic/<id> model reaches Claude Code as the bare id", () => {
  const src = READ_ONLY.replace("model: sonnet", "model: anthropic/claude-sonnet-4-5");
  withFixture({ "reviewer.md": src }, (root) => {
    assert.equal(run(root).code, 0);
    assert.match(read(root, ".claude/agents/reviewer.md"), /\nmodel: claude-sonnet-4-5\n/);
  });
});

test("explicit permissions pass through to OpenCode", () => {
  const src = READ_ONLY.replace(
    "model: sonnet\n",
    'model: sonnet\npermissions:\n  - action: shell\n    resource: "git *"\n    effect: allow\n',
  );
  withFixture({ "reviewer.md": src }, (root) => {
    assert.equal(run(root).code, 0);
    const opencode = read(root, ".opencode/agents/reviewer.md");
    assert.match(opencode, /- action: "shell"\n {4}resource: "git \*"\n {4}effect: allow/);
    assert.doesNotMatch(opencode, /action: "edit"/, "explicit permissions replace derived ones");
    assert.doesNotMatch(read(root, ".claude/agents/reviewer.md"), /permissions/);
  });
});

test("README.md is documentation, not an agent, and is not projected", () => {
  withFixture({ "README.md": "# Agents\n", "reviewer.md": READ_ONLY }, (root) => {
    assert.equal(run(root).code, 0);
    assert.equal(existsSync(join(root, ".claude/agents/README.md")), false);
  });
});

test("non-agent .md files (uppercase, notes) are not treated as agents", () => {
  withFixture(
    {
      "reviewer.md": READ_ONLY,
      "DESIGN-AGENCY-COMPLETE.md": "# Design Agency Complete\n",
      "MIGRATION-NOTES.md": "# Migration Notes\n",
      "README.md": "# Agents\n",
    },
    (root) => {
      assert.equal(run(root).code, 0);
      assert.equal(existsSync(join(root, ".claude/agents/DESIGN-AGENCY-COMPLETE.md")), false);
      assert.equal(existsSync(join(root, ".claude/agents/MIGRATION-NOTES.md")), false);
      assert.equal(existsSync(join(root, ".claude/agents/README.md")), false);
      assert.ok(existsSync(join(root, ".claude/agents/reviewer.md")));
    },
  );
});

test("OpenCode does not receive the Claude Code hook scripts", () => {
  withFixture({ "reviewer.md": READ_ONLY }, (root) => {
    mkdirSync(join(root, ".agents/hooks"));
    writeFileSync(join(root, ".agents/hooks/guard.mjs"), "");
    assert.equal(run(root).code, 0);
    assert.equal(existsSync(join(root, ".opencode/hooks")), false);
    assert.ok(lstatSync(join(root, ".claude/hooks/guard.mjs")).isSymbolicLink());
  });
});

test("skills: Claude lists them all, OpenCode does not project skills", () => {
  const src = READ_ONLY.replace(
    "model: sonnet",
    "model: sonnet\nskills:\n  - tdd\n  - vendor:some-skill",
  );
  withFixture({ "reviewer.md": src }, (root) => {
    mkdirSync(join(root, ".agents/skills/tdd"), { recursive: true });
    writeFileSync(join(root, ".agents/skills/tdd/SKILL.md"), "# tdd\n");
    assert.equal(run(root).code, 0);
    assert.match(
      read(root, ".claude/agents/reviewer.md"),
      /\nskills:\n {2}- tdd\n {2}- vendor:some-skill\n/,
    );
    assert.doesNotMatch(read(root, ".opencode/agents/reviewer.md"), /skill/);
  });
});

test("templates are linked into both assistants", () => {
  withFixture({ "reviewer.md": READ_ONLY }, (root) => {
    mkdirSync(join(root, ".agents/templates"));
    writeFileSync(join(root, ".agents/templates/design.md"), "# design\n");
    assert.equal(run(root).code, 0);
    for (const dir of [".claude", ".opencode"]) {
      const link = join(root, dir, "templates/design.md");
      assert.ok(lstatSync(link).isSymbolicLink(), `${dir} links the template`);
      assert.equal(readFileSync(link, "utf8"), "# design\n");
    }
  });
});

test("OpenCode gets no skills copy, and a leftover one is pruned", () => {
  withFixture({ "reviewer.md": READ_ONLY }, (root) => {
    mkdirSync(join(root, ".agents/skills/tdd"), { recursive: true });
    writeFileSync(join(root, ".agents/skills/tdd/SKILL.md"), "# tdd\n");
    mkdirSync(join(root, ".opencode/skills"));
    symlinkSync("../../.agents/skills/tdd", join(root, ".opencode/skills/tdd"));
    const check = run(root, "--check");
    assert.equal(check.code, 1);
    assert.match(check.out, /\.opencode\/skills\/tdd: stale link/);
    assert.equal(run(root, "--prune").code, 0);
    assert.equal(existsSync(join(root, ".opencode/skills")), false);
    assert.ok(lstatSync(join(root, ".claude/skills/tdd")).isSymbolicLink(), "Claude still gets it");
  });
});

// ---------------------------------------------------------------------------
// Rules block (AGENTS.md)
// ---------------------------------------------------------------------------

const RULE = (fm, body) =>
  `---\ntitle: ${fm.title}\ndescription: ${fm.title} rule\n${fm.extra ?? ""}---\n\n# ${fm.title}\n\n${body}\n`;

test("rules reach OpenCode as a marked AGENTS.md block; hand-written text is kept", () => {
  withFixture({ "reviewer.md": READ_ONLY }, (root) => {
    mkdirSync(join(root, ".agents/rules"));
    writeFileSync(
      join(root, ".agents/rules/secrets.md"),
      RULE({ title: "Secrets", extra: "always: true\n" }, "## Never\n\nNo values."),
    );
    writeFileSync(
      join(root, ".agents/rules/versions.md"),
      RULE({ title: "Versions", extra: 'applies_to: ["**/package.json"]\n' }, "Catalogs only."),
    );
    writeFileSync(join(root, "AGENTS.md"), "# AGENTS.md\n\nHand-written intro.\n");
    assert.equal(run(root).code, 0);
    const text = read(root, "AGENTS.md");
    assert.match(text, /^# AGENTS\.md\n\nHand-written intro\.\n/);
    assert.match(text, /<!-- BEGIN generated from \.agents\/rules/);
    assert.match(
      text,
      /### Secrets\n[\s\S]*#### Never\n\nNo values\./,
      "always-on rule in full, headings demoted",
    );
    assert.match(
      text,
      /- \*\*Versions\*\* — `\*\*\/package\.json`: read `\.agents\/rules\/versions\.md`/,
    );
    assert.doesNotMatch(text, /Catalogs only\./, "file-scoped rule is indexed, not inlined");
    assert.equal(run(root, "--check").code, 0, "idempotent");

    writeFileSync(join(root, "AGENTS.md"), `${text}\nMore hand-written text.\n`);
    assert.equal(run(root, "--check").code, 0, "text outside the markers is not drift");
    writeFileSync(
      join(root, ".agents/rules/secrets.md"),
      RULE({ title: "Secrets", extra: "always: true\n" }, "Changed."),
    );
    assert.match(run(root, "--check").out, /AGENTS\.md: generated rules block stale/);
    assert.equal(run(root).code, 0);
    assert.match(
      read(root, "AGENTS.md"),
      /Changed\.[\s\S]*END generated[\s\S]*More hand-written text\./,
    );
  });
});

test("unbalanced rules-block markers are a conflict, never rewritten", () => {
  withFixture({ "reviewer.md": READ_ONLY }, (root) => {
    mkdirSync(join(root, ".agents/rules"));
    writeFileSync(
      join(root, ".agents/rules/secrets.md"),
      RULE({ title: "Secrets", extra: "always: true\n" }, "x"),
    );
    const broken = "# A\n\n<!-- BEGIN generated from .agents/rules by x -->\n\nno end marker\n";
    writeFileSync(join(root, "AGENTS.md"), broken);
    const r = run(root);
    assert.equal(r.code, 1);
    assert.match(r.out, /CONFLICT {2}AGENTS\.md: unbalanced generated-rules markers/);
    assert.equal(read(root, "AGENTS.md"), broken);
  });
});

// ---------------------------------------------------------------------------
// Model tiers
// ---------------------------------------------------------------------------

const MODELS = {
  tiers: ["economy", "standard", "frontier"],
  assistants: {
    claude: { economy: "haiku", standard: "sonnet", frontier: "opus" },
    opencode: { economy: "p/cheap", standard: "p/mid", frontier: "p/best" },
  },
};
const withModels = (root, models = MODELS) =>
  writeFileSync(join(root, ".agents/models.yaml"), JSON.stringify(models));
const TIERED = (tier) => READ_ONLY.replace("model: sonnet", `tier: ${tier}`);

test("a tier renders each assistant's mapped model; null means the assistant's default", () => {
  withFixture(
    {
      "reviewer.md": TIERED("frontier"),
      "builder.md": FULL.replace("model: opus", "tier: economy"),
    },
    (root) => {
      withModels(root);
      assert.equal(run(root).code, 0);
      assert.match(read(root, ".claude/agents/reviewer.md"), /\nmodel: opus\n/);
      assert.match(read(root, ".opencode/agents/reviewer.md"), /model: "p\/best"/);
      assert.match(read(root, ".claude/agents/builder.md"), /\nmodel: haiku\n/);
      assert.match(read(root, ".opencode/agents/builder.md"), /model: "p\/cheap"/);
    },
  );
});

test("an explicit model overrides the tier and is reported", () => {
  const src = TIERED("economy").replace("tier: economy", "tier: economy\nmodel: opus");
  withFixture({ "reviewer.md": src }, (root) => {
    withModels(root);
    const r = run(root);
    assert.equal(r.code, 0);
    assert.match(
      r.out,
      /OVERRIDE {2}\.agents\/agents\/reviewer\.md: model 'opus' overrides tier 'economy'/,
    );
    assert.match(read(root, ".claude/agents/reviewer.md"), /\nmodel: opus\n/);
  });
});

test("a tier without a mapping file, or outside it, is rejected with exit 2", () => {
  withFixture({ "reviewer.md": TIERED("frontier") }, (root) => {
    const r = run(root, "--lint");
    assert.equal(r.code, 2);
    assert.match(r.out, /'tier' needs \.agents\/models\.yaml/);
  });
  withFixture({ "reviewer.md": TIERED("premium") }, (root) => {
    withModels(root);
    const r = run(root, "--lint");
    assert.equal(r.code, 2);
    assert.match(
      r.out,
      /'tier' is 'premium'; \.agents\/models\.yaml defines: economy, standard, frontier/,
    );
  });
});

test("a tier an assistant has no row for is not projected to it, and --prune removes the old copy", () => {
  withFixture(
    {
      "reviewer.md": TIERED("frontier"),
      "builder.md": FULL.replace("model: opus", "tier: economy"),
    },
    (root) => {
      withModels(root);
      assert.equal(run(root).code, 0);
      assert.ok(existsSync(join(root, ".opencode/agents/reviewer.md")));
      const partial = structuredClone(MODELS);
      delete partial.assistants.opencode.frontier;
      withModels(root, partial);
      const check = run(root, "--check");
      assert.equal(check.code, 1);
      assert.match(check.out, /\.opencode\/agents\/reviewer\.md: stale generated agent/);
      assert.equal(run(root, "--prune").code, 0);
      assert.ok(!existsSync(join(root, ".opencode/agents/reviewer.md")));
      assert.ok(existsSync(join(root, ".claude/agents/reviewer.md")));
      assert.ok(existsSync(join(root, ".opencode/agents/builder.md")));
      assert.equal(run(root, "--check").code, 0);
    },
  );
});

test("a tier mapped for no assistant, or a row naming an unknown tier, is rejected with exit 2", () => {
  withFixture({ "reviewer.md": TIERED("frontier") }, (root) => {
    const broken = structuredClone(MODELS);
    delete broken.assistants.opencode.frontier;
    delete broken.assistants.claude.frontier;
    withModels(root, broken);
    const r = run(root);
    assert.equal(r.code, 2);
    assert.match(r.out, /tier 'frontier' is mapped for no assistant/);
  });
  withFixture({ "reviewer.md": TIERED("frontier") }, (root) => {
    const broken = structuredClone(MODELS);
    broken.assistants.opencode.premium = "p/x";
    withModels(root, broken);
    const r = run(root);
    assert.equal(r.code, 2);
    assert.match(r.out, /'assistants\.opencode\.premium' is not a tier in 'tiers'/);
  });
});

test("an `assistants` list limits the projection; an unknown name is rejected", () => {
  const claudeOnly = TIERED("economy").replace(
    "tier: economy",
    "tier: economy\nassistants: [claude]",
  );
  withFixture({ "reviewer.md": claudeOnly }, (root) => {
    withModels(root);
    assert.equal(run(root).code, 0);
    assert.ok(existsSync(join(root, ".claude/agents/reviewer.md")));
    assert.ok(!existsSync(join(root, ".opencode/agents/reviewer.md")));
  });
  withFixture({ "reviewer.md": claudeOnly.replace("[claude]", "[claude, cursor]") }, (root) => {
    withModels(root);
    const r = run(root, "--lint");
    assert.equal(r.code, 2);
    assert.match(r.out, /'assistants' must be a list of: claude, opencode \(unknown: cursor\)/);
  });
});

test("a route that sends an agent to OpenCode when the agent is not projected there is broken", () => {
  withFixture({ "reviewer.md": TIERED("frontier") }, (root) => {
    const partial = structuredClone(MODELS);
    delete partial.assistants.opencode.frontier;
    withModels(root, partial);
    writeFileSync(
      join(root, ".agents/routing.yaml"),
      "tasks:\n  review:\n    executor: opencode\n    model: p/x\n    agent: reviewer\n  other:\n    executor: claude\n    model: opus\n    agent: reviewer\n",
    );
    const r = run(root, "--lint");
    assert.equal(r.code, 1);
    assert.match(
      r.out,
      /task 'review' routes to OpenCode, but agent 'reviewer' is not projected there/,
    );
    assert.doesNotMatch(r.out, /task 'other'/);
  });
});

test("a skill that teaches rejected technology fails --lint unless an allowance names the reason", () => {
  withFixture({ "reviewer.md": READ_ONLY }, (root) => {
    const skill = (name, text) => {
      mkdirSync(join(root, ".agents/skills", name, "references"), { recursive: true });
      writeFileSync(join(root, ".agents/skills", name, "SKILL.md"), `# ${name}\n`);
      writeFileSync(join(root, ".agents/skills", name, "references/more.md"), text);
    };
    skill("orm-tips", "Define tables with drizzle-orm and run `drizzle-kit push`.\n");
    skill("flows", "Model the checkout with XState and write checkout.spec.ts.\n");
    skill("vitest", "The API is Jest-compatible: `vi.fn()` mirrors jest.fn().\n");
    const fenced = join(root, ".agents/reference/encore/encore-api");
    mkdirSync(fenced, { recursive: true });
    writeFileSync(join(fenced, "SKILL.md"), "import { api } from 'encore.dev/api'\n");
    const r = run(root, "--lint");
    assert.equal(r.code, 1);
    assert.match(r.out, /\.agents\/skills\/orm-tips: teaches 'drizzle', which is rejected/);
    assert.match(r.out, /\.agents\/skills\/flows: teaches 'xstate'/);
    assert.match(r.out, /\.agents\/skills\/flows: teaches 'spec-files'/);
    assert.doesNotMatch(r.out, /skills\/vitest: teaches/);
    assert.doesNotMatch(r.out, /encore-api/);
  });
});

// ---------------------------------------------------------------------------
// Body defects: broken references and commands the agent cannot run
// ---------------------------------------------------------------------------

test("a backticked path that does not exist fails sync, --check and --lint", () => {
  const src = READ_ONLY.replace(
    "Body text.",
    "Read `.agents/rules/nope.md` and `packages/<name>/src` first.",
  );
  withFixture({ "reviewer.md": src }, (root) => {
    for (const args of [[], ["--check"], ["--lint"]]) {
      const r = run(root, ...args);
      assert.equal(r.code, 1, `exit for ${args.join(" ") || "sync"}`);
      assert.match(
        r.out,
        /BROKEN {4}\.agents\/agents\/reviewer\.md: references `\.agents\/rules\/nope\.md`/,
      );
      assert.doesNotMatch(r.out, /packages\/<name>/, "a placeholder is not a reference");
    }
  });
});

test("an existing path passes --lint", () => {
  const src = READ_ONLY.replace("Body text.", "Read `.agents/agents/reviewer.md`.");
  withFixture({ "reviewer.md": src }, (root) => assert.equal(run(root, "--lint").code, 0));
});

test("a command the agent is told to run without Bash is a defect; a forbidden one is not", () => {
  const src = READ_ONLY.replace("Body text.", "Run `pnpm test` first.\n\nNever run `git push`.");
  withFixture({ "reviewer.md": src }, (root) => {
    const r = run(root, "--lint");
    assert.equal(r.code, 1);
    assert.match(r.out, /tells the agent to run `pnpm test` but its tools have no Bash/);
    assert.doesNotMatch(r.out, /git push/);
  });
  withFixture(
    { "builder.md": FULL.replace("# builder", "# builder\n\nRun `pnpm test`.") },
    (root) => assert.equal(run(root, "--lint").code, 0, "an agent with Bash may run commands"),
  );
});

test("--lint needs no assistant directory and writes nothing", () => {
  withFixture(
    { "reviewer.md": READ_ONLY },
    (root) => {
      assert.equal(run(root, "--lint").code, 0);
      for (const dir of [".claude", ".opencode"]) assert.equal(existsSync(join(root, dir)), false);
    },
    [],
  );
});

// ---------------------------------------------------------------------------
// Safety: --check, conflicts, prune
// ---------------------------------------------------------------------------

test("--check passes after a sync and fails once a generated file is hand-edited", () => {
  withFixture({ "reviewer.md": READ_ONLY }, (root) => {
    assert.equal(run(root).code, 0);
    assert.equal(run(root, "--check").code, 0);
    const path = join(root, ".claude/agents/reviewer.md");
    writeFileSync(path, `${readFileSync(path, "utf8")}\nhand edit\n`);
    const r = run(root, "--check");
    assert.equal(r.code, 1);
    assert.match(r.out, /DRIFT {5}\.claude\/agents\/reviewer\.md: hand-edited or stale/);
  });
});

test("--check reports a missing generated agent", () => {
  withFixture({ "reviewer.md": READ_ONLY }, (root) => {
    const r = run(root, "--check");
    assert.equal(r.code, 1);
    assert.match(r.out, /\.claude\/agents\/reviewer\.md: missing/);
  });
});

test("a hand-authored file at a generated path is a conflict and is never overwritten", () => {
  withFixture({ "reviewer.md": READ_ONLY }, (root) => {
    mkdirSync(join(root, ".claude/agents"));
    writeFileSync(join(root, ".claude/agents/reviewer.md"), "mine\n");
    const r = run(root);
    assert.equal(r.code, 1);
    assert.match(r.out, /CONFLICT {2}\.claude\/agents\/reviewer\.md/);
    assert.equal(read(root, ".claude/agents/reviewer.md"), "mine\n");
  });
});

test("a symlink where a generated agent belongs is replaced by the rendered file", () => {
  withFixture({ "reviewer.md": READ_ONLY }, (root) => {
    mkdirSync(join(root, ".claude/agents"));
    symlinkSync("../../.agents/agents/reviewer.md", join(root, ".claude/agents/reviewer.md"));
    assert.equal(run(root).code, 0);
    assert.equal(lstatSync(join(root, ".claude/agents/reviewer.md")).isSymbolicLink(), false);
    assert.match(read(root, ".claude/agents/reviewer.md"), /^---\nname: reviewer\n/);
  });
});

test("--prune removes a generated agent whose source is gone and a stray link into .agents", () => {
  withFixture(
    { "reviewer.md": READ_ONLY, "builder.md": FULL, "README.md": "# Agents\n" },
    (root) => {
      assert.equal(run(root).code, 0);
      symlinkSync("../../.agents/agents/README.md", join(root, ".claude/agents/README.md"));
      writeFileSync(join(root, ".claude/agents/mine.md"), "hand-authored\n");
      rmSync(join(root, ".agents/agents/builder.md"));

      const check = run(root, "--check");
      assert.equal(check.code, 1);
      assert.match(check.out, /\.claude\/agents\/builder\.md: stale generated agent/);
      assert.match(check.out, /\.claude\/agents\/README\.md: symlink into \.agents\//);

      assert.equal(run(root, "--prune").code, 0);
      assert.equal(existsSync(join(root, ".claude/agents/builder.md")), false);
      assert.equal(existsSync(join(root, ".claude/agents/README.md")), false);
      assert.equal(read(root, ".claude/agents/mine.md"), "hand-authored\n", "not ours — kept");
      assert.equal(run(root, "--check").code, 0);
    },
  );
});

test("assistants are auto-detected from existing directories", () => {
  withFixture(
    { "reviewer.md": READ_ONLY },
    (root) => {
      assert.equal(run(root).code, 0);
      assert.equal(existsSync(join(root, ".opencode")), false);
      assert.ok(existsSync(join(root, ".claude/agents/reviewer.md")));
    },
    [".claude"],
  );
});

// ---------------------------------------------------------------------------
// Invalid sources fail loudly (exit 2) and write nothing
// ---------------------------------------------------------------------------

const INVALID = [
  [
    "a name that differs from the filename",
    READ_ONLY.replace("name: reviewer", "name: other"),
    /must match/,
  ],
  ["a missing description", READ_ONLY.replace(/description: .*\n/, ""), /description/],
  [
    "an unknown frontmatter key",
    READ_ONLY.replace("model: sonnet", "model: sonnet\ncolour: red"),
    /unknown key 'colour'/,
  ],
  ["an invalid mode", READ_ONLY.replace("model: sonnet", "model: sonnet\nmode: boss"), /'mode'/],
  ["no frontmatter", "# reviewer\n", /missing required agent frontmatter/],
  [
    "a skill that is not vendored",
    READ_ONLY.replace("model: sonnet", "model: sonnet\nskills: [nope]"),
    /skill\(s\) nope not found/,
  ],
];

for (const [what, source, message] of INVALID) {
  test(`${what} is rejected with exit 2`, () => {
    withFixture({ "reviewer.md": source }, (root) => {
      const r = run(root);
      assert.equal(r.code, 2);
      assert.match(r.out, message);
      assert.equal(existsSync(join(root, ".claude/agents")), false);
    });
  });
}

// ---------------------------------------------------------------------------
// Constitution projection
// ---------------------------------------------------------------------------

test("the constitution is generated from the docs laws and drift is detected", () => {
  withFixture({ "reviewer.md": READ_ONLY }, (root) => {
    mkdirSync(join(root, "apps/docs/src/constitution"), { recursive: true });
    writeFileSync(
      join(root, "apps/docs/src/constitution/secrets.mdx"),
      '---\ntitle: "Secrets"\ndescription: "d"\n---\n\n<Note>\nNever print values.\n</Note>\n\n## Rule\n\nText.\n',
    );
    assert.equal(run(root).code, 0);
    const out = read(root, ".specify/memory/constitution.md");
    assert.match(out, /^# Stackra Constitution/);
    assert.match(out, /## Secrets\n\n<Note>|## Secrets\n\nNever print values\./);
    assert.doesNotMatch(out, /<Note>/);
    assert.match(out, /### Rule/);
    assert.equal(run(root, "--check").code, 0);
    writeFileSync(join(root, ".specify/memory/constitution.md"), "hand edited\n");
    const drift = run(root, "--check");
    assert.equal(drift.code, 1);
    assert.match(drift.out, /constitution\.md: stale/);
  });
});

test("oxfmt-wrapped multi-line <Step> and <Note> blocks keep titles and render as prose, not code", () => {
  withFixture({ "reviewer.md": READ_ONLY }, (root) => {
    mkdirSync(join(root, "apps/docs/src/constitution"), { recursive: true });
    writeFileSync(
      join(root, "apps/docs/src/constitution/index.mdx"),
      [
        '---\ntitle: "Constitution"\ndescription: "d"\n---\n',
        "<Steps>",
        '  <Step title="Laws">Short and normative.</Step>',
        '  <Step title="ADRs">',
        "    Record one decision each. Where an ADR and a law disagree, the law",
        "    wins.",
        "  </Step>",
        "</Steps>\n",
        "<Note>",
        "  A wrapped note that must",
        "  not become a code block.",
        "</Note>\n",
      ].join("\n"),
    );
    assert.equal(run(root).code, 0);
    const out = read(root, ".specify/memory/constitution.md");
    assert.match(out, /^- \*\*Laws\*\*: Short and normative\.$/m);
    assert.match(
      out,
      /^- \*\*ADRs\*\*: Record one decision each\. Where an ADR and a law disagree, the law wins\.$/m,
    );
    assert.match(out, /^A wrapped note that must\nnot become a code block\.$/m);
    assert.doesNotMatch(out, /<\/?(Steps?|Note)\b|^ {4}/m);
  });
});

// ---------------------------------------------------------------------------
// MCP
// ---------------------------------------------------------------------------

test(".mcp.yaml renders to a comment-free .mcp.json, and --check catches drift", () => {
  withFixture({ "reviewer.md": READ_ONLY }, (root) => {
    writeFileSync(
      join(root, ".mcp.yaml"),
      [
        "# annotated source",
        "mcpServers:",
        "  docs: { type: http, url: https://x.dev/mcp } # trailing",
        "  local:",
        "    command: ./tools/scripts/mcp.sh",
        "    args: [--api-key=$KEY]",
      ].join("\n"),
    );
    assert.equal(run(root).code, 0);
    assert.deepEqual(JSON.parse(read(root, ".mcp.json")), {
      mcpServers: {
        docs: { type: "http", url: "https://x.dev/mcp" },
        local: { command: "./tools/scripts/mcp.sh", args: ["--api-key=$KEY"] },
      },
    });
    assert.equal(run(root, "--check").code, 0);
    writeFileSync(join(root, ".mcp.json"), "{}\n");
    const drift = run(root, "--check");
    assert.equal(drift.code, 1);
    assert.match(drift.out, /\.mcp\.json: stale.*pnpm agents:sync/);
  });
});

test("--check passes without a local .mcp.json, rejects invalid servers; --mcp-only renders quietly", () => {
  withFixture({ "reviewer.md": READ_ONLY }, (root) => {
    writeFileSync(
      join(root, ".mcp.yaml"),
      "mcpServers:\n  docs: { type: http, url: https://x.dev/mcp }\n",
    );
    assert.equal(run(root).code, 0);
    rmSync(join(root, ".mcp.json"));
    assert.equal(run(root, "--check").code, 0);
    assert.equal(existsSync(join(root, ".mcp.json")), false);
    assert.equal(run(root, "--mcp-only").code, 0);
    assert.equal(existsSync(join(root, ".mcp.json")), true);
    writeFileSync(join(root, ".mcp.yaml"), "mcpServers:\n  bad: { type: http }\n");
    const bad = run(root, "--check");
    assert.equal(bad.code, 1);
    assert.match(bad.out, /server 'bad' needs a string command or url/);
  });
});
