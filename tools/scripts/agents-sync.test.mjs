/**
 * @module tools/scripts/agents-sync.test
 *
 * Purpose: hold `agents-sync.mjs` to the Claude Code / OpenCode dialects and its safety
 *          guarantees (never clobber, --check reports drift, empty and non-agent sources are fine).
 * Boundary: runs the real script as a child process against a throwaway repo in the OS temp dir.
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
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), "agents-sync.mjs");

const READ_ONLY = `---
name: reviewer
description: Reviews changes for correctness and regressions
tools: Read, Grep, Glob
tier: standard
---

# reviewer

Body text.
`;

const FULL = `---
description: Builds things
tools: Read, Write, Edit, Bash, WebFetch, WebSearch, Agent
model: anthropic/claude-opus-4
---

# builder
`;

const MODELS = JSON.stringify({
  tiers: ["economy", "standard"],
  assistants: {
    claude: { economy: "haiku", standard: "sonnet" },
    opencode: { economy: null, standard: "amazon-bedrock/test-model" },
  },
});

const RULE = (extra = "") => `---
title: Versions
description: Pinned toolchain
${extra}---

# Versions

Use pnpm.
`;

/** Throwaway repo root with the script and the given `.agents/` files ({ "agents/x.md": text }). */
function withRepo(files, fn) {
  const root = mkdtempSync(join(tmpdir(), "agents-sync-"));
  try {
    mkdirSync(join(root, "tools/scripts"), { recursive: true });
    copyFileSync(SCRIPT, join(root, "tools/scripts/agents-sync.mjs"));
    mkdirSync(join(root, ".agents"), { recursive: true });
    for (const [rel, content] of Object.entries({ "models.json": MODELS, ...files })) {
      mkdirSync(dirname(join(root, ".agents", rel)), { recursive: true });
      writeFileSync(join(root, ".agents", rel), content);
    }
    fn(root);
  } finally {
    rmSync(root, { recursive: true });
  }
}

function run(root, ...args) {
  const r = spawnSync(process.execPath, [join(root, "tools/scripts/agents-sync.mjs"), ...args], {
    encoding: "utf8",
  });
  return { code: r.status, out: r.stdout + r.stderr };
}

const read = (root, path) => readFileSync(join(root, path), "utf8");
const frontmatter = (text) => text.slice(4, text.indexOf("\n---", 4));

test("Claude Code gets name, description, tools and the tier's model", () => {
  withRepo({ "agents/reviewer.md": READ_ONLY }, (root) => {
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

test("OpenCode denies every action the tools do not reach and maps the tier", () => {
  withRepo({ "agents/reviewer.md": READ_ONLY }, (root) => {
    run(root);
    const fm = frontmatter(read(root, ".opencode/agents/reviewer.md"));
    assert.match(fm, /^description: "Reviews/);
    assert.match(fm, /mode: subagent\nmodel: "amazon-bedrock\/test-model"\npermissions:/);
    for (const action of ["edit", "shell", "webfetch", "websearch", "subagent"])
      assert.match(fm, new RegExp(`action: "${action}"\\n {4}resource: "\\*"\\n {4}effect: deny`));
  });
});

test("an anthropic/<id> override reaches Claude bare and OpenCode verbatim; full grant allows all", () => {
  withRepo({ "agents/builder.md": FULL }, (root) => {
    run(root);
    assert.match(read(root, ".claude/agents/builder.md"), /\nmodel: claude-opus-4\n/);
    const oc = read(root, ".opencode/agents/builder.md");
    assert.match(oc, /\nmodel: "anthropic\/claude-opus-4"\n/);
    assert.match(oc, /action: "\*"\n {4}resource: "\*"\n {4}effect: allow/);
  });
});

test("an empty or missing .agents/agents passes sync and --check with nothing to do", () => {
  withRepo({}, (root) => {
    assert.equal(run(root).code, 0);
    assert.equal(run(root, "--check").code, 0);
    mkdirSync(join(root, ".agents/agents"));
    assert.equal(run(root, "--check").code, 0);
    assert.equal(existsSync(join(root, "AGENTS.md")), false);
  });
});

test("non-agent files (README, notes, markdown without frontmatter) are ignored, not fatal", () => {
  withRepo(
    {
      "agents/reviewer.md": READ_ONLY,
      "agents/README.md": "# Agents\n",
      "agents/MIGRATION-NOTES.md": "---\nfoo: bar\n---\n",
      "agents/COMPLETE.md": "# All done\n\nNo frontmatter here.\n",
    },
    (root) => {
      assert.equal(run(root).code, 0);
      assert.equal(run(root, "--check").code, 0);
      assert.deepEqual(
        ["README.md", "MIGRATION-NOTES.md", "COMPLETE.md"].filter((f) =>
          existsSync(join(root, ".claude/agents", f)),
        ),
        [],
      );
    },
  );
});

test("--check passes after sync and names the file once it is hand-edited or missing", () => {
  withRepo({ "agents/reviewer.md": READ_ONLY }, (root) => {
    run(root);
    assert.equal(run(root, "--check").code, 0);
    const path = join(root, ".claude/agents/reviewer.md");
    writeFileSync(path, `${readFileSync(path, "utf8")}\nedited\n`);
    const drift = run(root, "--check");
    assert.equal(drift.code, 1);
    assert.match(drift.out, /DRIFT\s+\.claude\/agents\/reviewer\.md: hand-edited or stale/);
    rmSync(join(root, ".opencode/agents/reviewer.md"));
    assert.match(run(root, "--check").out, /\.opencode\/agents\/reviewer\.md: missing/);
    assert.equal(run(root).code, 0, "a normal run repairs drift");
    assert.equal(run(root, "--check").code, 0);
  });
});

test("a hand-authored file at a generated path is a conflict and is never overwritten", () => {
  withRepo({ "agents/reviewer.md": READ_ONLY }, (root) => {
    mkdirSync(join(root, ".claude/agents"), { recursive: true });
    writeFileSync(join(root, ".claude/agents/reviewer.md"), "mine\n");
    const r = run(root);
    assert.equal(r.code, 1);
    assert.match(r.out, /CONFLICT/);
    assert.equal(read(root, ".claude/agents/reviewer.md"), "mine\n");
  });
});

test("a generated agent whose source is gone is pruned; hand-written siblings stay", () => {
  withRepo({ "agents/reviewer.md": READ_ONLY }, (root) => {
    run(root);
    writeFileSync(join(root, ".claude/agents/mine.md"), "hand written\n");
    rmSync(join(root, ".agents/agents/reviewer.md"));
    assert.match(run(root, "--check").out, /reviewer\.md: stale/);
    assert.equal(run(root).code, 0);
    assert.equal(existsSync(join(root, ".claude/agents/reviewer.md")), false);
    assert.equal(existsSync(join(root, ".claude/agents/mine.md")), true);
  });
});

test("invalid frontmatter, unknown tier and unknown keys exit 2", () => {
  withRepo({ "agents/x.md": "---\nname: y\ndescription: d\n---\n" }, (root) =>
    assert.match(run(root).out, /'name' is 'y'/),
  );
  withRepo({ "agents/x.md": "---\ndescription: d\ntier: nope\n---\n" }, (root) => {
    const r = run(root);
    assert.equal(r.code, 2);
    assert.match(r.out, /'tier' is 'nope'/);
  });
  withRepo({ "agents/x.md": "---\ndescription: d\ncolor: red\n---\n" }, (root) =>
    assert.match(run(root).out, /unknown key 'color'/),
  );
});

test("--lint flags missing paths and commands without Bash, skips forbidden ones, writes nothing", () => {
  const body = (text) => `---\ndescription: d\ntools: Read\n---\n${text}\n`;
  withRepo({ "agents/a.md": body("Read `packages/nope/x.ts`.") }, (root) => {
    const r = run(root, "--lint");
    assert.equal(r.code, 1);
    assert.match(r.out, /`packages\/nope\/x\.ts`, which does not exist/);
    assert.equal(existsSync(join(root, ".claude")), false);
  });
  withRepo({ "agents/a.md": body("Run `pnpm verify` now.\nNever run `git push`.") }, (root) => {
    const r = run(root, "--lint");
    assert.match(r.out, /run `pnpm verify`/);
    assert.doesNotMatch(r.out, /git push/);
  });
});

test("rules render into a marked AGENTS.md block; hand-written text is kept", () => {
  withRepo(
    {
      "rules/versions.md": RULE(),
      "rules/layout.md": RULE('applies_to: ["packages/**"]\n').replace("Versions", "Layout"),
      "rules/tenancy.md": RULE("manual: true\n").replace("Versions", "Tenancy"),
      "rules/README.md": "# rules index\n",
    },
    (root) => {
      writeFileSync(join(root, "AGENTS.md"), "# Hand table\n\nKeep me.\n");
      assert.equal(run(root).code, 0);
      const out = read(root, "AGENTS.md");
      assert.match(out, /^# Hand table\n\nKeep me\.\n\n<!-- BEGIN generated/);
      assert.match(out, /<!-- source: \.agents\/rules\/versions\.md -->\n\n#### Versions/);
      assert.match(out, /- \*\*Layout\*\* — `packages\/\*\*`: read `\.agents\/rules\/layout\.md`/);
      assert.match(out, /### On request\n\n- Tenancy/);
      assert.equal(existsSync(join(root, ".claude/rules")), false, "no double-loading projection");
      assert.equal(run(root, "--check").code, 0);

      writeFileSync(join(root, ".agents/rules/versions.md"), RULE().replace("Use pnpm", "Use npm"));
      assert.match(run(root, "--check").out, /AGENTS\.md: generated rules block stale/);
      run(root);
      assert.match(read(root, "AGENTS.md"), /Use npm/);
      assert.match(read(root, "AGENTS.md"), /Keep me\./);
    },
  );
});

test("unbalanced rules-block markers are a conflict, never rewritten", () => {
  withRepo({ "rules/versions.md": RULE() }, (root) => {
    const broken = "# Doc\n\n<!-- BEGIN generated from .agents/rules by x -->\nstuff\n";
    writeFileSync(join(root, "AGENTS.md"), broken);
    const r = run(root);
    assert.equal(r.code, 1);
    assert.match(r.out, /unbalanced/);
    assert.equal(read(root, "AGENTS.md"), broken);
  });
});

test("skills are linked into .claude/skills as relative symlinks; --check sees a missing link", () => {
  withRepo(
    { "skills/stackra-scaffold/SKILL.md": "# skill\n", "skills/README.md": "# list\n" },
    (root) => {
      assert.match(run(root, "--check").out, /\.claude\/skills\/stackra-scaffold: missing/);
      assert.equal(run(root).code, 0);
      const link = join(root, ".claude/skills/stackra-scaffold");
      assert.equal(lstatSync(link).isSymbolicLink(), true);
      assert.match(read(root, ".claude/skills/stackra-scaffold/SKILL.md"), /# skill/);
      assert.equal(existsSync(join(root, ".claude/skills/README.md")), false);
      assert.equal(run(root, "--check").code, 0);
      rmSync(join(root, ".agents/skills/stackra-scaffold"), { recursive: true });
      assert.match(run(root, "--check").out, /stale, source no longer exists/);
    },
  );
});
