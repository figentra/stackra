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

test("committed Infisical config stays readable", () => {
  assert.equal(kind("cat .infisical.yaml"), "allow");
  assert.equal(kind("cat .infisical.json"), "allow");
  assert.equal(decidePath(".infisical.yaml").kind, "allow");
  assert.equal(decidePath(".infisical.json").kind, "allow");
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
    'git commit -m "docs: never read .env"',
    "git status",
  ])
    assert.equal(kind(c), "allow", c);
});

test("heredoc bodies are content, not commands", () => {
  assert.equal(kind("cat > notes.md <<'EOF'\nnever run printenv or cat .env\nEOF"), "allow");
});

test("edits are refused in the main checkout unless STACKRA_ALLOW_MAIN=1", () => {
  const main = { inMainCheckout: true, allowMain: false };
  assert.equal(decideEdit("apps/mobile/src/main.ts", main).kind, "deny");
  assert.equal(decideEdit("apps/mobile/src/main.ts", { ...main, allowMain: true }).kind, "allow");
  assert.equal(
    decideEdit("apps/mobile/src/main.ts", { inMainCheckout: false, allowMain: false }).kind,
    "allow",
  );
  // secrets stay denied even with the override
  assert.equal(decideEdit(".env", { inMainCheckout: false, allowMain: true }).kind, "deny");
});
