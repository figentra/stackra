// node --test .opencode/plugins/guard/__tests__/decide.test.ts   (Node >= 23.6 strips the types; no network)
import { test } from "node:test";
import assert from "node:assert/strict";
import { homedir } from "node:os";
import { decideEdit, decidePath, decideShell } from "../decide.ts";

const kind = (c: string) => decideShell(c).kind;

test("denies reading secret files", () => {
  for (const c of [
    "cat .env",
    "cat ./.env.local",
    "head -5 apps/mobile/.env.production",
    "grep KEY services/foo.secrets.local",
    "cat ~/.ci-env",
    "less /Users/me/.sentryclirc",
    "cp .env /tmp/x",
    "ls && cat .env",
    "source .env",
    "cat .infisical/credentials",
    "cat ~/.infisical-token",
  ])
    assert.equal(kind(c), "deny", c);
  assert.equal(kind("cat .env.example"), "allow");
  assert.equal(kind("cat README.md"), "allow");
});

test("the secrets inbox is never read; the importer is allowed", () => {
  for (const c of [
    "cat ~/Secrets-inbox/STACKRA_REVIEWER_PRIVATE_KEY.pem",
    "head $HOME/Secrets-inbox/X",
    "ls ~/Secrets-inbox",
    "cp /Users/me/Secrets-inbox/X /tmp",
    "cat ~/.stackra/secrets-confirm.key",
    "cat ~/Secrets-inbo?/*",
    "cat ~/S*inbox/X",
  ])
    assert.equal(kind(c), "deny", c);
  assert.equal(decidePath("/Users/me/Secrets-inbox/X").kind, "deny");
  assert.equal(kind("pnpm secrets:import --list"), "allow");
  assert.equal(kind("pnpm secrets:import --dry-run STACKRA_X"), "allow");
});

// STA-194: the same matcher as guard-bash (shared _inbox.mjs), so the same precision both ways (STA-207).
test("inbox matcher parity with guard-bash: recursive reads from home, home-rooted globs", () => {
  for (const c of [
    "grep -r BEGIN ~",
    "grep -rn BEGIN $HOME",
    "find ~ -name '*.pem'",
    "cat ~/*/X",
    "cd ~ && cat S*inbox/X",
    'bash -c "cat ~/Secrets-inbox/X"',
  ])
    assert.equal(kind(c), "deny", c);
  assert.equal(decideShell("cat S*inbox/X", homedir()).kind, "deny");
  assert.equal(decideShell("cat S*inbox/X", "/tmp").kind, "allow");
  assert.equal(decidePath("~/Secrets-inbo?/X").kind, "deny");
  // M1: a relative glob resolves against the session directory
  assert.equal(decidePath("S*inbox/X", homedir()).kind, "deny");
  assert.equal(decidePath("S*inbox/X", "/tmp").kind, "allow");
  // STA-207 review probes (H1-H3, L1, L2): the same matcher denies them here too
  for (const c of [
    "grep -v '^#' ~/Secrets-inbox/X",
    "grep -F x ~/*/X",
    "grep -f ~/Secrets-inbox/X notes",
    "rg -f ~/Secrets-inbox/X .",
    "sed -f ~/Secrets-inbox/X notes",
    "awk -f ~/Secrets-inbox/X notes",
    `perl -e 'open F, "<$ENV{HOME}/Secrets-inbox/X"; print <F>'`,
    `sed '1r ${homedir()}/Secrets-inbox/X' notes`,
    'pnpm linear create --title "$(cat ~/Secrets-inbox/X)"',
    "x=~/Secrets-inbo?; cat $x/X",
    "grep -e x -e ~/Secrets-inbox/X file",
    "cd ~ && rg BEGIN",
  ])
    assert.equal(kind(c), "deny", c);
  for (const c of [
    "grep -o '<title>[^<]*</title>' page.html",
    "grep '^[+-]' file",
    "perl -ne 'print if /^[+-]/' file",
    'pnpm linear create --title "Secrets-inbox guard false positives"',
    "for w in $(git worktree list --porcelain | awk '/^worktree/ {print $2}'); do git -C $w status; done",
    'cd ~/.claude/skills && for d in encore-*; do mv "$d" ~/.claude/skills-archive/; done',
    "grep -n foo ~",
    "ls ~",
  ])
    assert.equal(kind(c), "allow", c);
});

test("committed Infisical config stays readable", () => {
  assert.equal(kind("cat .infisical.yaml"), "allow");
  assert.equal(kind("cat .infisical.yaml"), "allow");
  assert.equal(decidePath(".infisical.yaml").kind, "allow");
  assert.equal(decidePath(".infisical.yaml").kind, "allow");
  assert.equal(decidePath(".infisical").kind, "deny");
});

test("read/edit tool paths", () => {
  assert.equal(decidePath(".env").kind, "deny");
  assert.equal(decidePath("/Users/me/.ci-env").kind, "deny");
  assert.equal(decidePath("db.secrets.json").kind, "deny");
  assert.equal(decidePath(".env.example").kind, "allow");
  assert.equal(decidePath("apps/console/src/env.ts").kind, "allow");
});

test("denies environment dumps, secret CLIs and owner-only scripts", () => {
  for (const c of [
    "printenv",
    "printenv | grep TOKEN",
    "env",
    "infisical export --env=prod",
    "infisical secrets get FOO --plain",
    "encore secret get StripeKey",
    "encore secret set --type prod StripeKey",
    "bash .agents/plans/subagent-tasks/04-infisical-setup.sh",
    "sh -x .agents/plans/subagent-tasks/08-infisical-config.sh",
    "git clean -fd",
    "rm -rf node_modules",
  ])
    assert.equal(kind(c), "deny", c);
  for (const c of [
    "infisical secrets get FOO --silent",
    "infisical profile list",
    "env FOO=1 node x.js",
    "echo $HOME",
    "git status",
  ])
    assert.equal(kind(c), "allow", c);
});

test("executors never run owner-only CLIs, ship, or touch git history", () => {
  for (const c of [
    "gh pr merge 1",
    "gh api repos/x",
    "/usr/local/bin/gh pr list",
    "wrangler deploy",
    "curl https://example.com",
    "FOO=1 wget https://example.com",
    "infisical secrets",
    "infisical secrets --env=prod",
    "infisical secrets set FOO=bar",
    "infisical secrets get FOO",
    "encore deploy",
    "encore env create staging",
    "encore secret list",
    "git push origin feature/x",
    'git commit -m "docs: never read .env"',
    "git merge main",
    "git rebase main",
    "git tag v1",
    "git worktree add ../x",
    "git -C . push",
    "git branch -D feature/x",
    "pnpm changeset:version",
    "pnpm changeset version",
    "pnpm test && git push",
    // STA-208: no owner login (gh with any token, network git) and no bot wrappers for executors
    "GH_TOKEN=$(pnpm bot:token) gh pr view 1",
    "env GH_TOKEN=x gh pr list",
    "git fetch origin",
    "git -C ../os pull",
    "git clone https://github.com/figentra/os",
    "git ls-remote origin",
    "pnpm bot:gh -- pr view 1",
    "pnpm bot:git -- push origin HEAD",
    "pnpm bot:review -- pr comment 1 --body-file f",
    "pnpm pr:merge 1",
    "pnpm bot:token",
    // #80 review: substitutions inside double quotes, sh -c, eval; every network git
    'echo "$(gh auth token)"',
    'BODY="$(gh pr view 80)"',
    'echo "`gh pr list`"',
    "bash -c 'gh pr list'",
    "eval 'git push'",
    "git remote update",
    "git remote show origin",
    "git archive --remote=https://github.com/figentra/os HEAD",
    "git subtree pull --prefix x https://github.com/figentra/os main",
  ])
    assert.equal(kind(c), "deny", c);
  for (const c of [
    "infisical secrets get FOO --silent",
    "encore run",
    "encore test",
    "git status",
    "git diff --stat",
    "git branch --show-current",
    "git log --oneline -5",
    "pnpm changeset",
    "pnpm verify",
  ])
    assert.equal(kind(c), "allow", c);
});

test("heredoc bodies are content, not commands", () => {
  assert.equal(kind("cat > notes.md <<'EOF'\nnever run printenv or cat .env\nEOF"), "allow");
});

test("edits are refused in the main checkout unless STACKRA_ALLOW_MAIN=1", () => {
  const main = { root: "/repo", inMainCheckout: true, allowMain: false };
  assert.equal(decideEdit("apps/mobile/src/main.ts", main).kind, "deny");
  assert.equal(decideEdit("apps/mobile/src/main.ts", { ...main, allowMain: true }).kind, "allow");
  assert.equal(
    decideEdit("apps/mobile/src/main.ts", { ...main, inMainCheckout: false }).kind,
    "allow",
  );
  // secrets stay denied even with the override
  assert.equal(
    decideEdit(".env", { ...main, inMainCheckout: false, allowMain: true }).kind,
    "deny",
  );
});

test("edits must resolve inside the session's worktree root", () => {
  const wt = { root: "/repo/.claude/worktrees/a", inMainCheckout: false, allowMain: false };
  assert.equal(decideEdit("/repo/.claude/worktrees/a/src/x.ts", wt).kind, "allow");
  assert.equal(decideEdit("src/x.ts", wt).kind, "allow");
  // absolute path into the main checkout, a sibling worktree, a parent escape, the root itself
  assert.equal(decideEdit("/repo/src/x.ts", wt).kind, "deny");
  assert.equal(decideEdit("/repo/.claude/worktrees/ab/x.ts", wt).kind, "deny");
  assert.equal(decideEdit("../../../src/x.ts", wt).kind, "deny");
  assert.equal(decideEdit("/repo/.claude/worktrees/a", wt).kind, "deny");
  assert.equal(decideEdit("/etc/hosts", wt).kind, "deny");
});
