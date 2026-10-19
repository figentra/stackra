import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const hook = new URL("../guard-bash.mjs", import.meta.url).pathname;
/** The hook's permissionDecision ("deny", "ask"), or "allow" when it prints nothing. */
const decision = (command, cwd) => {
  const r = spawnSync("node", [hook], {
    input: JSON.stringify({ tool_name: "Bash", tool_input: { command }, cwd }),
    encoding: "utf8",
  });
  assert.equal(r.status, 0);
  return r.stdout ? JSON.parse(r.stdout).hookSpecificOutput.permissionDecision : "allow";
};
const denied = (command) => decision(command) === "deny";
const root = spawnSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).stdout.trim();

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
  "rm -rf node_modules",
  "rm -rf dist .turbo .stackra",
  "rm -fr packages/x/dist",
  "rm --recursive --force node_modules",
  `rm -rf ${root}/node_modules`,
  'git commit -m "chore: drop the rm -rf / guard text"',
  "git commit -m 'docs: never rm -rf ~'",
  "infisical secrets get FOO --silent --env=dev",
  "infisical secrets set FOO=bar",
  "infisical secrets --env=dev set FOO=bar",
  "infisical run -- env FOO=1 node x.js",
  "infisical run -- pnpm test",
  "gh pr merge 12 --squash",
  "git push origin chore/permissions-hardening",
  "git push -u origin feature/main-menu",
  "git push origin maintenance",
  "git push origin domain:domain",
  'git commit -m "docs: never git push origin main"',
  "pnpm changeset",
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
  "rm -rf /",
  "git reset --hard",
  // `infisical secrets` with no subcommand lists values
  "infisical secrets",
  "infisical secrets --env=prod",
  "infisical secrets --env prod --path /ci",
  // `infisical run` dumping the injected environment
  "infisical run -- env",
  "infisical run --env=dev -- printenv",
  "infisical run -- printenv TOKEN",
  "infisical run -- env | grep KEY",
  // `gh pr merge --admin` in any flag order
  "gh pr merge --admin 12",
  "gh pr merge 12 --squash --admin",
  "gh pr merge --admin --squash",
  // `git push` to main, any form
  "git push origin main",
  "git push -u origin main",
  "git push origin HEAD:main",
  "git push origin refs/heads/main",
  "git push origin feature:refs/heads/main",
  "git push origin +main",
  "git push origin :main",
  "git push --all origin",
  "git -C . push origin main",
  // `changeset version`, script form too
  "pnpm changeset:version",
  "pnpm changeset version",
  // `rm -rf` outside the repo, or with an unknown base
  'bash -c "rm -rf /"',
  "rm -rf ~",
  "rm -rf ~/projects",
  "rm -rf $HOME/x",
  'rm -rf "$DIR"',
  "rm -rf /tmp/foo",
  "rm -rf ../other-repo",
  "rm -rf .",
  "rm -rf *",
  "rm -Rf /usr",
  "rm --force --recursive /etc",
  "cd /tmp && rm -rf build",
  `rm -rf ${root}`,
];

for (const c of allowed) test(`allow: ${c}`, () => assert.equal(denied(c), false));
for (const c of blocked) test(`deny: ${c}`, () => assert.equal(denied(c), true));

for (const c of [
  "encore deploy",
  "encore deploy --env=production",
  "encore env set prod",
  "encore env create staging",
  "encore env delete preview",
])
  test(`ask: ${c}`, () => assert.equal(decision(c), "ask"));
test("deny beats ask in the same command", () =>
  assert.equal(decision("encore deploy && git reset --hard"), "deny"));

// A bare `git push` (or `git push origin HEAD`) targets main only when main is checked out.
test("bare git push is denied on main, allowed on a branch", () => {
  const dir = mkdtempSync(join(tmpdir(), "guard-bash-"));
  const env = { ...process.env, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@t" };
  Object.assign(env, { GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@t" });
  spawnSync("git", ["init", "-q", "-b", "main"], { cwd: dir });
  spawnSync("git", ["commit", "-q", "--allow-empty", "-m", "x"], { cwd: dir, env });
  assert.equal(decision("git push", dir), "deny");
  assert.equal(decision("git push origin HEAD", dir), "deny");
  spawnSync("git", ["switch", "-q", "-c", "feature/x"], { cwd: dir });
  assert.equal(decision("git push", dir), "allow");
  assert.equal(decision("git push -u origin HEAD", dir), "allow");
  rmSync(dir, { recursive: true, force: true });
});
