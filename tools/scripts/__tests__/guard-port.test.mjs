import { after, test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { portFiles } from "../guard-port.mjs";

const TOOL = fileURLToPath(new URL("../guard-port.mjs", import.meta.url));
const HOOKS = fileURLToPath(new URL("../../../.agents/hooks/", import.meta.url));
const S = "/Users/akouta/Projects/stackra";
const read = (f) => readFileSync(join(HOOKS, f), "utf8");

// A temporary repository: main, and the session's own worktree `a` on feature/x (the cwd).
const root = mkdtempSync(join(tmpdir(), "guard-port-"));
after(() => rmSync(root, { recursive: true, force: true }));
const main = join(root, "repo");
const wt = join(main, ".claude", "worktrees", "a");
const env = { ...process.env, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@t" };
Object.assign(env, { GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@t" });
spawnSync("git", ["init", "-q", "-b", "main", main]);
spawnSync("git", ["commit", "-q", "--allow-empty", "-m", "x"], { cwd: main, env });
spawnSync("git", ["worktree", "add", "-q", "-b", "feature/x", wt], { cwd: main });

/** Ports the guard for `repo` into a fresh folder; returns the hooks directory. */
function port(repo) {
  const dir = join(root, repo, ".agents", "hooks");
  for (let run = 0; run < 2; run++) {
    const r = spawnSync(process.execPath, [TOOL, dir, repo], { encoding: "utf8" });
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, new RegExp(`ported for figentra/${repo}`));
  }
  return dir;
}
const hooks = { os: port("os"), muslin: port("muslin") };
const rules = {
  os: await import(join(hooks.os, "_rules.mjs")),
  muslin: await import(join(hooks.muslin, "_rules.mjs")),
};

test("guard-port: usage exits 2; a drifted anchor throws before anything is written", () => {
  assert.equal(spawnSync(process.execPath, [TOOL]).status, 2);
  assert.throws(
    () => portFiles("os", (f) => (f === "guard-bash.mjs" ? "" : read(f))),
    /guard-bash/,
  );
});

test("guard-port: the bot scripts name this checkout, the repository, --head and absolute files", () => {
  const cases = [
    [`(cd ${main} && pnpm --silent bot:git -- -C ${wt} push origin HEAD)`, "allow"],
    [
      `(cd ${main} && pnpm --silent bot:git -- -C "${wt}" push --force-with-lease origin HEAD)`,
      "allow",
    ],
    [`pnpm --silent -C ${S} bot:git -- push origin HEAD`, "deny"],
    [`pnpm --silent -C ${S} bot:git -- -C ${S} push origin HEAD`, "deny"],
    [`(cd ${main} && pnpm --silent bot:git -- -C ${wt} push origin master)`, "deny"],
    [`(cd ${main} && pnpm --silent bot:git -- -C ${wt} push encore HEAD)`, "deny"],
    [
      `pnpm --silent -C ${S} bot:gh -- pr create -R "figentra/muslin" --head x --base main --title t --body-file /tmp/b.md`,
      "allow",
    ],
    [
      `pnpm --silent -C ${S} bot:gh -- pr create -R figentra/muslin --base main --title t --body x`,
      "deny",
    ],
    [
      `pnpm --silent -C ${S} bot:gh -- pr create -R figentra/muslin --head x --body-file body.md`,
      "deny",
    ],
    [`pnpm --silent -C ${S} bot:gh -- pr view https://github.com/figentra/muslin/pull/5`, "allow"],
    [`pnpm --silent -C ${S} bot:gh -- pr view 5`, "deny"],
    [`x=$(pnpm --silent bot:gh -- pr view 5 --json url)`, "deny"],
    [
      `pnpm --silent -C ${S} bot:gh -- api repos/figentra/muslin/issues -F body=@/tmp/b.md -F t=x`,
      "allow",
    ],
    [`pnpm --silent -C ${S} bot:gh -- api repos/figentra/muslin/issues -F body=@b.md`, "deny"],
    [`pnpm --silent -C ${S} pr:merge -R figentra/os 5`, "allow"],
    [`pnpm --silent -C ${S} pr:merge 5`, "deny"],
    [`(cd ${S} && pnpm --silent bot:gh -- pr view 5 -R figentra/os > /tmp/out.json 2>&1)`, "allow"],
    ["grep -rn bot:gh docs", "allow"],
  ];
  const wrong = cases
    .map(([c, want]) => [c, want, rules.muslin.decideBash(c, { cwd: wt }).decision])
    .filter(([, want, got]) => got !== want);
  assert.deepEqual(wrong, []);
});

test("guard-port: the owner's config and the Stackra checkout are never written; reads stay open", () => {
  const cases = [
    ["git checkout origin/main -- .claude/settings.json", "deny"],
    ["git restore --source=HEAD~1 .agents/hooks", "deny"],
    ["git rm -r .agents/hooks", "deny"],
    ["git mv .claude/settings.json x.json", "deny"],
    ["sed --in-place s/a/b/ .claude/settings.json", "deny"],
    ["cp /tmp/settings.json .claude", "deny"],
    ["cp -t .agents/hooks /tmp/x.mjs", "deny"],
    ["mv .claude/settings.json /tmp/x", "deny"],
    ["echo {} > .claude/settings.json", "deny"],
    ["pnpm exec tee .mcp.json", "deny"],
    [`cd ${S} && echo x > package.json`, "deny"],
    [`sed -i '' s/a/b/ ${S}/tools/scripts/bot-gh.mjs`, "deny"],
    ["git checkout -b feature/z", "allow"],
    ["sed -n 1,5p .claude/settings.json", "allow"],
    ["cp .claude/settings.json /tmp/settings.bak", "allow"],
    [`cat ${S}/package.json`, "allow"],
  ];
  const wrong = cases
    .map(([c, want]) => [c, want, rules.muslin.decideBash(c, { cwd: wt }).decision])
    .filter(([, want, got]) => got !== want);
  assert.deepEqual(wrong, []);
  const writes = [
    [rules.muslin, join(wt, ".claude/settings.json"), "deny"],
    [rules.muslin, `${S}/package.json`, "deny"],
    [rules.muslin, "/Users/akouta/Projects/academorix/x.md", "deny"],
    [rules.muslin, join(wt, "AuthKey_X.p8"), "deny"],
    [rules.muslin, join(wt, "src/x.ts"), "allow"],
    [rules.os, join(wt, "docs/catalogue/commerce.md"), "deny"],
    [rules.os, join(wt, "docs/catalogue/README.md"), "allow"],
  ];
  for (const [r, p, want] of writes) assert.equal(r.decideWrite(p, { cwd: wt }).decision, want, p);
});

test(
  "guard-port: a Stackra checkout's git writes are denied",
  { skip: !existsSync(`${S}/.git`) },
  () => {
    assert.equal(rules.muslin.decideBash(`git -C ${S} pull`, { cwd: wt }).decision, "deny");
    assert.equal(rules.muslin.decideBash(`git -C ${S} log -1`, { cwd: wt }).decision, "allow");
  },
);

test("guard-port: deploys deny; paid or signed builds ask; stash, signing keys and owner scripts deny", () => {
  const cases = [
    ["encore deploy", "deny"],
    ["git stash", "deny"],
    ["git stash list", "allow"],
    ["cat AuthKey_ABC.p8", "deny"],
    ["cat android/app/release.keystore", "deny"],
    ["bash -x tools/scripts/secrets/sync.sh", "deny"],
    ["./register.sh", "deny"],
    ["cat tools/scripts/secrets/sync.sh", "allow"],
    ["eas build --platform ios", "ask"],
    ["eas build:list", "allow"],
    ["pnpm tauri build", "ask"],
    ["pnpm tauri signer generate -w /tmp/out", "ask"],
    ["pnpm --filter @muslin/desktop app:build", "ask"],
    [`pnpm --silent -C ${S} bot:gh -- workflow enable ci.yml -R figentra/muslin`, "ask"],
    ["rm -rf apps/web/.next", "allow"],
  ];
  const wrong = cases
    .map(([c, want]) => [c, want, rules.muslin.decideBash(c, { cwd: wt }).decision])
    .filter(([, want, got]) => got !== want);
  assert.deepEqual(wrong, []);
});

/** The reason the ported guard-bash hook gives for `gh pr create`. */
function reason(repo) {
  const input = JSON.stringify({
    tool_name: "Bash",
    tool_input: { command: "gh pr create" },
    cwd: wt,
  });
  const r = spawnSync(process.execPath, [join(hooks[repo], "guard-bash.mjs")], {
    input,
    encoding: "utf8",
  });
  return JSON.parse(r.stdout).hookSpecificOutput.permissionDecisionReason;
}
test("guard-port: a GitHub refusal ends with the repo's route in the subshell form", () => {
  const os = reason("os");
  assert.ok(
    os.includes(`(cd ${S} && pnpm --silent bot:git -- -C <absolute path of this checkout>`),
    os,
  );
  assert.ok(os.includes("-R figentra/os --head <branch>") && os.includes("owner-approval"), os);
  assert.ok(os.includes("silent exit 1"), os);
  assert.ok(reason("muslin").includes("merges are the owner's here"));
});
