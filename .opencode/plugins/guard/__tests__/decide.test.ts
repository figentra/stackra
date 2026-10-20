// node --test .opencode/plugins/guard/__tests__/decide.test.ts   (Node >= 23.6 strips the types; no network)
import { test } from "node:test";
import assert from "node:assert/strict";
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
