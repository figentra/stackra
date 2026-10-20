import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const hook = new URL("../guard-paths.mjs", import.meta.url).pathname;
const denied = (file_path, key = "file_path") => {
  const r = spawnSync("node", [hook], {
    input: JSON.stringify({ tool_name: "Write", tool_input: { [key]: file_path } }),
    encoding: "utf8",
  });
  assert.equal(r.status, 0);
  return r.stdout.includes('"permissionDecision":"deny"');
};

const allowed = [
  "/r/.agents/rules/secrets.md",
  "/r/apps/mobile/src/main.ts",
  "/r/apps/mobile/app.json",
  "/r/.agents/agents/code-standards-steward.md",
  "/r/packages/data/foo/src/distance.ts",
  "/r/.envrc.md.txt",
  "/r/AGENTS.md", // hand-written parts stay editable; the generated block is caught below
  "",
];
const blocked = [
  "/r/.env",
  "/r/.env.local",
  "/r/apps/x/.env.example",
  "/r/pnpm-lock.yaml",
  "/r/CHANGELOG.md",
  "/r/packages/x/CHANGELOG.md",
  "/r/apps/x/dist/index.js",
  "/r/apps/mobile/ios/Podfile",
  "/r/apps/mobile/android/build.gradle",
  "/r/apps/mobile/uniwind-types.d.ts",
  "/r/.claude/agents/a.md",
  "/r/.opencode/agents/a.md",
  "/r/services/x/encore.gen/clients.ts",
  "/r/services/x/.encore/cache",
  "/r/certs/server.pem",
  "/r/services/x/.secrets.local.cue",
  "/r/credentials.json",
  "/r/apps/worker/.dev.vars",
  "/r/.ci-env",
  "/Users/me/.sentryclirc",
];

for (const p of allowed) test(`allow: ${p}`, () => assert.equal(denied(p), false));
for (const p of blocked) test(`deny: ${p}`, () => assert.equal(denied(p), true));
test("deny: notebook_path", () => assert.equal(denied("/r/.env", "notebook_path"), true));

// The generated rules block in AGENTS.md is denied only when the edit touches the markers.
const editIntoAgentsMd = (oldString) => {
  const r = spawnSync("node", [hook], {
    input: JSON.stringify({
      tool_name: "Edit",
      tool_input: { file_path: "/r/AGENTS.md", old_string: oldString, new_string: "x" },
    }),
    encoding: "utf8",
  });
  assert.equal(r.status, 0);
  return r.stdout.includes('"permissionDecision":"deny"');
};
test("deny: AGENTS.md generated rules block", () =>
  assert.equal(
    editIntoAgentsMd("<!-- BEGIN generated from .agents/rules by tools/scripts/agents-sync.mjs"),
    true,
  ));
test("allow: AGENTS.md hand-written section", () =>
  assert.equal(editIntoAgentsMd("# stackra"), false));

// The secrets inbox: denied for every tool, read tools included; other reads stay allowed.
const decide = (tool_name, tool_input) => {
  const r = spawnSync("node", [hook], {
    input: JSON.stringify({ tool_name, tool_input }),
    encoding: "utf8",
  });
  assert.equal(r.status, 0);
  return r.stdout.includes('"permissionDecision":"deny"');
};
for (const [tool, input] of [
  ["Read", { file_path: "/Users/me/Secrets-inbox/STACKRA_REVIEWER_PRIVATE_KEY.pem" }],
  ["Read", { file_path: "~/Secrets-inbox/X" }],
  ["Grep", { pattern: "BEGIN", path: "/Users/me/Secrets-inbox" }],
  ["Glob", { pattern: "~/Secrets-inbox/*" }],
  ["Glob", { pattern: "*", path: "/Users/me/Secrets-inbox/" }],
  ["Write", { file_path: "/Users/me/Secrets-inbox/X", content: "v" }],
  ["Edit", { file_path: "/Users/me/Secrets-inbox/X", old_string: "a", new_string: "b" }],
  ["Read", { file_path: "/Users/me/.stackra/secrets-confirm.key" }],
])
  test(`deny ${tool}: ${JSON.stringify(input)}`, () => assert.equal(decide(tool, input), true));
for (const [tool, input] of [
  ["Read", { file_path: "/r/pnpm-lock.yaml" }],
  ["Read", { file_path: "/r/CHANGELOG.md" }],
  ["Grep", { pattern: "Secrets-inbox", path: "/r/apps/docs" }],
  ["Glob", { pattern: "**/*.md" }],
  ["Write", { file_path: "/r/apps/docs/src/runbooks/secrets.mdx", content: "~/Secrets-inbox/" }],
])
  test(`allow ${tool}: ${JSON.stringify(input)}`, () => assert.equal(decide(tool, input), false));
