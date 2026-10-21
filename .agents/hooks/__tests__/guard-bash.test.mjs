import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
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
  // ADR 0230: the reviewer identity posts verdicts; reading and grepping for them is fine
  "pnpm bot:review -- pr comment 47 --body-file /tmp/review.md",
  "grep -n owner-approval tools/scripts/pr-merge.mjs",
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
  // the secrets inbox: only the importer, which takes names and never prints a value
  "pnpm secrets:import --list",
  "ls ~",
  "grep -r foo .",
  "cat ~/Projects/notes.md",
  "find . -name '*.ts'",
  "grep -rn foo ~/Projects/notes.md",
  "grep -n foo ~",
  "cp -r dist /tmp/x",
  "pnpm secrets:import --dry-run STACKRA_REVIEWER_APP_ID",
  "pnpm secrets:import STACKRA_X --env prod --path /ci --confirm abc-123",
  'git commit -m "feat: import from ~/Secrets-inbox"',
  "cat > doc.md <<'EOF'\ncat ~/Secrets-inbox/X\nEOF",
  // STA-207: patterns, prose values, URLs and globs away from home are not inbox paths
  "curl -s https://docs.stackra.figentra.com | grep -o '<title>[^<]*</title>'",
  "grep '^[+-]' file",
  "grep -rn 'Secrets-inbox' .agents/hooks",
  "perl -ne 'print if /^[+-]/' file",
  "perl -pi -e 's/[A-Z]{3,}\\w*//g' notes.txt",
  "sed -n '/^[a-z]*$/p' file",
  "awk '/^worktree/ {print $2}' file",
  'pnpm linear create --title "Secrets-inbox guard false positives" --labels agent',
  'gh pr create --title "fix: ~/Secrets-inbox guard" --body "globs like ~/Secrets-inbo? are caught"',
  "for w in $(git worktree list --porcelain | awk '/^worktree/ {print $2}'); do git -C $w status; done",
  'cd ~/.claude/skills && for d in encore-*; do mv "$d" ~/.claude/skills-archive/; done',
  "ls -d ~/.claude/skills/encore-*",
  "cat ~/Projects/*/README.md",
];
const blocked = [
  // ADR 0230: no agent writes the owner's approval or posts a verdict as a non-reviewer identity
  "pnpm bot:gh -- pr edit 47 --add-label owner-approved",
  'gh pr comment 47 --body "AI-REVIEW: PASS abc1234 owner-approval"',
  'gh pr comment 47 --body "AI-REVIEW: PASS abc1234"',
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
  // the secrets inbox, any reader, any spelling of home
  "cat ~/Secrets-inbox/STACKRA_REVIEWER_PRIVATE_KEY.pem",
  "head -c 10 $HOME/Secrets-inbox/X",
  "grep -r BEGIN /Users/me/Secrets-inbox",
  "cp ~/Secrets-inbox/X /tmp/x",
  "mv ~/Secrets-inbox/X .",
  "ls -la ~/Secrets-inbox",
  "cd ~/Secrets-inbox && cat *",
  "base64 < ~/secrets-inbox/X",
  `node -e 'require("fs").readFileSync(process.env.HOME+"/Secrets-inbox/X")'`,
  "cat ~/.stackra/secrets-confirm.key",
  "pnpm secrets:import && cat ~/Secrets-inbox/X",
  // globs and home-wide recursive reads (accident guard)
  "cat ~/Secrets-inbo?/*",
  "cat ~/S*inbox/X",
  "cat ~/*/STACKRA_X",
  "grep -r BEGIN ~",
  "find ~ -name '*.pem'",
  "rg PRIVATE $HOME",
  // every recursive grep / cp spelling (STA-192)
  "grep -rn BEGIN ~",
  "grep -ril private $HOME",
  "grep -Rn BEGIN ~",
  "grep --recursive BEGIN ~",
  "grep -d recurse BEGIN ~",
  "grep --directories=recurse BEGIN ~",
  "grep -n -r BEGIN ~",
  "cp -a ~ /tmp/h",
  "cp -R ~ /tmp/h",
  "cp -r ~/ /tmp/h",
  "cp --archive ~ /tmp/h",
  // STA-207: still caught after the narrowing
  "cd ~ && cat Secrets-inbo?/X",
  "cd && ls S*inbox",
  "cd ~ && grep -r BEGIN .",
  'bash -c "cat ~/Secrets-inbox/X"',
  "grep -e BEGIN ~/Secrets-inbox/X",
  "perl -ne print ~/Secrets-inbo?/X",
  "cat ~/{Secrets-inbox,x}/X",
];

for (const c of allowed) test(`allow: ${c}`, () => assert.equal(denied(c), false));
for (const c of blocked) test(`deny: ${c}`, () => assert.equal(denied(c), true));

// A relative glob is an inbox path only when the shell sits in home.
test("relative globs are denied from home, allowed elsewhere", () => {
  for (const c of ["cat S*inbox/X", "ls */X", "grep -r BEGIN ."])
    assert.equal(decision(c, homedir()), "deny", c);
  for (const c of ["cat S*inbox/X", "ls */X", "grep '^[+-]' *"])
    assert.equal(decision(c, root), "allow", c);
  assert.equal(decision("grep '^[+-]' notes.md", homedir()), "allow");
});

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
