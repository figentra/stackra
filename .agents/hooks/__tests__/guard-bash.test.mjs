import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const hook = new URL("../guard-bash.mjs", import.meta.url).pathname;
const denied = (command) => {
  const r = spawnSync("node", [hook], {
    input: JSON.stringify({ tool_name: "Bash", tool_input: { command } }),
    encoding: "utf8",
  });
  assert.equal(r.status, 0);
  return r.stdout.includes('"permissionDecision":"deny"');
};

const allowed = [
  "pnpm verify",
  "cat package.json",
  `node -e "x.env"`,
  `node -e 'console.log(v.env)'`,
  "cat apps/x/eas.json",
  "grep -n env file",
  "env FOO=1 node x.js",
  "infisical run -- encore run",
  "infisical run --env=staging -- pnpm build",
  "bash tools/scripts/mcp.sh",
  "infisical secrets get FOO --silent",
  "cat .env.example",
  "cp .env.example .env.local.example",
  "encore run",
  "encore test",
  "rm -r dist",
  "cat > a.md <<'EOF'\nrm -rf x; printenv; echo hi > .env\nEOF",
];
const blocked = [
  "cat .env",
  "cat .env.local",
  "head .env.production",
  "printenv",
  "env",
  "FOO=1 env | sort",
  "echo hi && env",
  "infisical export --format=dotenv",
  "infisical secrets get FOO",
  "encore secret get X",
  "echo TOKEN=abc > .env",
  "echo A=1 >> .env.local",
  "touch .env",
  "cp .env.example .env",
  "mv foo .env.production",
  "tee .env",
  "encore db reset",
  "encore db reset myservice",
  "encore deploy",
  "encore deploy --env=production",
  "rm -rf /",
  "git reset --hard",
];

for (const c of allowed) test(`allow: ${c}`, () => assert.equal(denied(c), false));
for (const c of blocked) test(`deny: ${c}`, () => assert.equal(denied(c), true));
