import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const hook = new URL("./guard-paths.mjs", import.meta.url).pathname;
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
  "",
];
const blocked = [
  "/r/.env",
  "/r/.env.local",
  "/r/apps/x/.env.example",
  "/r/pnpm-lock.yaml",
  "/r/apps/x/dist/index.js",
  "/r/apps/mobile/ios/Podfile",
  "/r/apps/mobile/android/build.gradle",
  "/r/apps/mobile/uniwind-types.d.ts",
  "/r/.claude/agents/a.md",
  "/r/.opencode/agents/a.md",
  "/r/certs/server.pem",
  "/r/services/x/.secrets.local.cue",
  "/r/credentials.json",
];

for (const p of allowed) test(`allow: ${p}`, () => assert.equal(denied(p), false));
for (const p of blocked) test(`deny: ${p}`, () => assert.equal(denied(p), true));
test("deny: notebook_path", () => assert.equal(denied("/r/.env", "notebook_path"), true));
