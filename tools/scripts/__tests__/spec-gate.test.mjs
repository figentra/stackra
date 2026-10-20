/**
 * @module tools/scripts/spec-gate.test
 *
 * Purpose: hold the clarify-before-build gate and the Linear task parser to their contract.
 * Boundary: pure functions plus one dry-run child process; no network, no repository writes.
 * Runtime: node — node:test and node:assert.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { checkSpec, checkStage, specDir, tripwire, WRAPPED } from "../spec-gate.mjs";
import { specLinks, unlinkedTasks } from "../spec-linear.mjs";

const SCRIPTS = join(dirname(fileURLToPath(import.meta.url)), "..");
const impact = (v = "none") =>
  [
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
  ]
    .map((f) => `- **${f}**: ${v}`)
    .join("\n");
const ROOT = join(SCRIPTS, "../..");
const spec = ({ status = "complete", linear = "STA-12", body = impact(), stage = "Draft" } = {}) =>
  `# Feature Specification: X\n\n**Status**: ${stage}\n\n**Linear**: ${linear}\n\n**Clarifications status**: ${status}\n\n## Impact\n\n${body}\n\n## Requirements\n`;

test("a Draft spec passes with open questions; later stages need the plan rules and their artifacts", () => {
  const draft = spec({ status: "pending", linear: "STA-n", body: impact("[open]") });
  assert.deepEqual(checkStage("sta-12-x", draft), []);
  assert.match(checkStage("001-x", draft)[0], /sta-<n>-<slug>/);
  assert.match(checkStage("sta-12-x", spec({ linear: "STA-13" })).join(), /does not match/);
  assert.match(checkStage("sta-12-x", spec({ stage: "Bogus" }))[0], /Status/);
  assert.match(
    checkStage("sta-12-x", spec({ status: "pending", stage: "Clarified" })).join(),
    /Clarifications/,
  );
  assert.deepEqual(checkStage("sta-12-x", spec({ stage: "Clarified" })), []);
  assert.match(checkStage("sta-12-x", spec({ stage: "Planned" })).join(), /plan\.md/);
  assert.deepEqual(checkStage("sta-12-x", spec({ stage: "Planned" }), { files: ["plan.md"] }), []);
  assert.match(
    checkStage("sta-12-x", spec({ stage: "Implementing" }), { files: ["plan.md"] }).join(),
    /tasks\.md/,
  );
  const both = { files: ["plan.md", "tasks.md"], tasks: "- [x] T001\n- [ ] T002\n" };
  assert.deepEqual(checkStage("sta-12-x", spec({ stage: "Implementing" }), both), []);
  assert.match(checkStage("sta-12-x", spec({ stage: "Verified" }), both).join(), /unticked/);
  assert.deepEqual(checkStage("sta-12-x", spec({ stage: "Abandoned", status: "pending" })), []);
});

test("specDir names the folder from the branch key, reuses an existing one, and refuses without a key", () => {
  const root = mkdtempSync(join(tmpdir(), "spec-dir-"));
  try {
    assert.deepEqual(specDir({ root, branch: "figentra/sta-7-foo", slug: "foo" }), {
      dir: ".agents/specs/sta-7-foo",
    });
    assert.match(specDir({ root, branch: "figentra/sta-7-foo" }).error, /--slug/);
    assert.match(specDir({ root, branch: "main", slug: "foo" }).error, /no STA key/);
    mkdirSync(join(root, ".agents/specs/sta-7-bar"), { recursive: true });
    assert.deepEqual(specDir({ root, key: "STA-7" }), { dir: ".agents/specs/sta-7-bar" });
    assert.deepEqual(specDir({ root, branch: "delegate/sta-7-t1" }), {
      dir: ".agents/specs/sta-7-bar",
    });
  } finally {
    rmSync(root, { recursive: true });
  }
});

test("tripwire: the repository passes, and an upgrade that drops the wrap or resets numbering fails", () => {
  assert.deepEqual(tripwire(ROOT), []);
  const root = mkdtempSync(join(tmpdir(), "spec-trip-"));
  try {
    for (const p of [
      ".specify/scripts/bash",
      ".specify/init-options.json",
      ...WRAPPED.flatMap((n) => [
        `.claude/skills/speckit-${n}/SKILL.md`,
        `.opencode/commands/speckit.${n}.md`,
      ]),
    ])
      cpSync(join(ROOT, p), join(root, p), { recursive: true });
    assert.deepEqual(tripwire(root), []);
    // The wrap stays, but the core resolution rule changed.
    const skill = join(root, ".claude/skills/speckit-specify/SKILL.md");
    writeFileSync(
      skill,
      readFileSync(skill, "utf8").replace(
        /explicitly provided `SPECIFY_FEATURE_DIRECTORY`/,
        "set the dir",
      ),
    );
    assert.match(tripwire(root).join(), /SKILL\.md: core specify/);
    rmSync(join(root, ".claude/skills/speckit-plan"), { recursive: true });
    assert.match(tripwire(root).join(), /speckit-plan\/SKILL\.md is missing/);
    writeFileSync(join(root, ".specify/init-options.json"), '{"feature_numbering":"sequential"}');
    writeFileSync(join(root, ".opencode/commands/speckit.specify.md"), "vanilla core text\n");
    writeFileSync(join(root, ".specify/scripts/bash/setup-plan.sh"), "#!/bin/sh\n");
    const problems = tripwire(root).join("\n");
    assert.match(problems, /feature_numbering/);
    assert.match(problems, /speckit\.specify\.md lost the Stackra wrap/);
    assert.match(problems, /as-is/);
    assert.match(problems, /setup-plan\.sh/);
  } finally {
    rmSync(root, { recursive: true });
  }
});

test("a clarified, linked, fully answered spec passes", () => {
  assert.deepEqual(checkSpec(spec()), []);
});

test("pending clarifications, a placeholder Linear key and open markers each block planning", () => {
  assert.match(checkSpec(spec({ status: "pending" }))[0], /Clarifications status/);
  assert.match(checkSpec(spec({ linear: "STA-n" }))[0], /Linear/);
  assert.match(checkSpec(`${spec()}[NEEDS CLARIFICATION: x]`).join(), /NEEDS CLARIFICATION/);
});

test("an unanswered or missing Impact line blocks planning", () => {
  assert.match(checkSpec(spec({ body: impact("[apps]") })).join(), /unanswered/);
  assert.match(checkSpec(spec({ body: "- **Secrets**: none" })).join(), /Apps touched.*missing/);
  assert.match(
    checkSpec("**Linear**: STA-1\n**Clarifications status**: complete\n").join(),
    /Impact/,
  );
});

test("HTML comments are ignored", () => {
  assert.match(checkSpec(spec({ status: "pending" }) + "<!-- complete -->").join(), /Clarif/);
});

test("spec-linear parses links and finds unlinked tasks", () => {
  assert.deepEqual(specLinks(`# Feature Specification: Foo\n**Linear**: STA-7\n`), {
    key: "STA-7",
    project: undefined,
    title: "Foo",
  });
  const tasks = unlinkedTasks("- [ ] T001 One\n- [x] T002 Two [STA-9]\n- [ ] T003 [P] Three\nnote");
  assert.deepEqual(
    tasks.map((t) => t.id),
    ["T001", "T003"],
  );
});

test("spec-gate plan exits 1 on a pending spec, and spec-linear --dry-run needs no token", () => {
  const dir = mkdtempSync(join(tmpdir(), "spec-gate-"));
  try {
    writeFileSync(join(dir, "spec.md"), spec({ status: "pending" }));
    writeFileSync(join(dir, "tasks.md"), "- [ ] T001 One\n");
    const gate = spawnSync(process.execPath, [
      join(SCRIPTS, "spec-gate.mjs"),
      "plan",
      join(dir, "spec.md"),
    ]);
    assert.equal(gate.status, 1);
    const env = { ...process.env, LINEAR_API_KEY: "" };
    const dry = spawnSync(
      process.execPath,
      [join(SCRIPTS, "spec-linear.mjs"), "tasks", join(dir, "tasks.md"), "--dry-run"],
      { encoding: "utf8", env },
    );
    assert.equal(dry.status, 0);
    assert.match(dry.stdout, /would create sub-issue of STA-12: T001 One/);
  } finally {
    rmSync(dir, { recursive: true });
  }
});
