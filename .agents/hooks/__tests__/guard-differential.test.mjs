// The differential test (STA-330 review round 4): the guard's decision for a generated matrix of wrappers and guarded
// commands, a hand-written list of ordinary agent commands that must stay allowed, and a time bound per decision, so
// CI catches a regression instead of a review round. In-process (`decideBash`) in a temporary repository: main, the
// session's own linked worktree `a` (feature/x, the cwd) and another agent's `b` (feature/y). Test data holds no real
// secret, token or private path: `$MAIN`, `$WT`, `$OTHER` and `$SCRATCH` are filled in from the temporary repository.
import { after, test } from "node:test";
import assert from "node:assert/strict";
import childProcess from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { WRAPPERS } from "../_inbox.mjs";
import { decideBash } from "../_rules.mjs";

/**
 * Every case decides in less than this of the guard's own time: the wall clock minus the time git takes to answer
 * its lookups, which a loaded machine stretches (the guard caps those at 48 and 2 s itself). A slow path in the
 * reader, the walk or the globbing fails here long before the hook's five seconds run out.
 */
const LIMIT_MS = 250;
let gitMs = 0;
const { spawnSync } = childProcess;
childProcess.spawnSync = (...args) => {
  const t = performance.now();
  try {
    return spawnSync(...args);
  } finally {
    gitMs += performance.now() - t;
  }
};
syncBuiltinESMExports(); // the guard's `spawnSync` binding now points at the timed one

const main = mkdtempSync(join(tmpdir(), "guard-differential-"));
const env = { ...process.env, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@t" };
Object.assign(env, { GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@t" });
spawnSync("git", ["init", "-q", "-b", "main"], { cwd: main });
spawnSync("git", ["commit", "-q", "--allow-empty", "-m", "x"], { cwd: main, env });
const wt = join(main, ".claude", "worktrees", "a");
const other = join(main, ".claude", "worktrees", "b");
spawnSync("git", ["worktree", "add", "-q", "-b", "feature/x", wt], { cwd: main });
spawnSync("git", ["worktree", "add", "-q", "-b", "feature/y", other], { cwd: main });
mkdirSync(join(wt, "dist"));
mkdirSync(join(wt, "packages", "a", "node_modules"), { recursive: true });
after(() => rmSync(main, { recursive: true, force: true }));

const fill = (c) =>
  c
    .replaceAll("$MAIN", main)
    .replaceAll("$WT", wt)
    .replaceAll("$OTHER", other)
    .replaceAll("$SCRATCH", `/tmp/claude-${process.getuid?.() ?? 0}`);
decideBash("git status", { cwd: wt }); // warm the module before anything is timed

/** Every case `[command, want]` that decides otherwise or too slowly, as readable lines. */
function wrong(cases, cwd = wt) {
  const out = [];
  for (const [c, want] of cases) {
    const [t, git] = [performance.now(), gitMs];
    const { decision, reason } = decideBash(fill(c), { cwd });
    const ms = performance.now() - t - (gitMs - git);
    if (decision !== want) out.push(`${decision} (want ${want}) ${c}  [${reason.slice(0, 60)}]`);
    if (ms >= LIMIT_MS) out.push(`${ms.toFixed(0)} ms (limit ${LIMIT_MS}) ${c}`);
  }
  return out;
}

// ---- wrapper x guarded command ------------------------------------------------------------------------------

/** `c` as one single-quoted shell word. */
const sq = (c) => `'${c.replaceAll("'", `'\\''`)}'`;
/** A typical option for a wrapper that takes one (`_inbox.mjs` `WRAPPER_VALUE`). */
const OPTION = {
  sudo: "sudo -u x",
  doas: "doas -u x",
  env: "env A=1",
  nice: "nice -n 5",
  timeout: "timeout 5",
  stdbuf: "stdbuf -oL",
  exec: "exec -a x",
};
/** `[name, wrap, asks]`: `asks` when the wrapper itself is an ask (unreviewed registry code). */
const WRAPPED = [
  ["bare", (c) => c],
  ...[...WRAPPERS].flatMap((w) => [
    [w, (c) => `${w} ${c}`],
    ...(OPTION[w] ? [[OPTION[w], (c) => `${OPTION[w]} ${c}`]] : []),
  ]),
  ["caffeinate -i", (c) => `caffeinate -i ${c}`],
  ["arch -arm64", (c) => `arch -arm64 ${c}`],
  ["script -q /dev/null", (c) => `script -q /dev/null ${c}`],
  // runners
  ["pnpm exec", (c) => `pnpm exec ${c}`],
  ["pnpm --filter x exec", (c) => `pnpm --filter x exec ${c}`],
  ["pnpm <bin>", (c) => `pnpm ${c}`],
  ["mise exec --", (c) => `mise exec -- ${c}`],
  ["mise x node@22 --", (c) => `mise x node@22 -- ${c}`],
  ["npx", (c) => `npx ${c}`, true],
  ["npm exec --", (c) => `npm exec -- ${c}`, true],
  // shell structure
  ["( )", (c) => `(${c})`],
  ["{ }", (c) => `{ ${c}; }`],
  ["&&", (c) => `true && ${c}`],
  ["||", (c) => `false || ${c}`],
  ["if", (c) => `if true; then ${c}; fi`],
  ["for", (c) => `for i in 1; do ${c}; done`],
  ["$( )", (c) => `x=$(${c})`],
  ['"$( )"', (c) => `echo "$(${c})"`],
  ["<( )", (c) => `cat <(${c})`],
  ["backticks", (c) => `echo \`${c}\``],
  ["sh -c", (c) => `sh -c ${sq(c)}`],
  ["bash -c", (c) => `bash -c ${sq(c)}`],
  ["eval", (c) => `eval ${sq(c)}`],
  // one quoted string that another program runs
  ["watch", (c) => `watch ${sq(c)}`],
  ["watch -n 1", (c) => `watch -n 1 ${sq(c)}`],
  ["script -c", (c) => `script -c ${sq(c)} /dev/null`],
  ["su -c", (c) => `su -c ${sq(c)}`],
  ["ssh", (c) => `ssh host ${sq(c)}`],
  ["trap", (c) => `trap ${sq(c)} EXIT`],
  ["tmux new -d", (c) => `tmux new -d ${sq(c)}`],
  ["at now <<<", (c) => `at now <<< ${sq(c)}`],
  ["parallel", (c) => `parallel ${sq(c)} ::: a`],
  ["flock -c", (c) => `flock /tmp/l -c ${sq(c)}`],
];
/** Guarded commands and their decision from the session's own worktree. */
const GUARDED = [
  ["rm -rf /", "deny"],
  ["rm -rf ~", "deny"],
  ["rm -rf $HOME", "deny"],
  ["rm -rf .git", "deny"],
  ["rm -rf $MAIN", "deny"],
  ["rm -rf $OTHER/src", "deny"],
  ["find . -path './.git/*' -delete", "deny"],
  ["git -C $MAIN reset --hard", "deny"],
  ["git -C $MAIN checkout .", "deny"],
  ["git -C $MAIN clean -fd", "deny"],
  ["git push origin main", "deny"],
  ["pnpm bot:git -- push origin main", "deny"],
  ["pnpm bot:git -- push --force origin HEAD", "deny"],
  ["pnpm bot:git -- push -f origin HEAD", "deny"],
  ["pnpm bot:git -- push origin +HEAD:feature/x", "deny"],
  ["git stash pop", "deny"],
  ["git stash clear", "deny"],
  ["infisical export", "deny"],
  ["infisical secrets get FOO", "deny"],
  ["encore deploy", "deny"],
  ["encore secret set FOO", "deny"],
  ["wrangler secret put FOO", "deny"],
  ["changeset version", "deny"],
  ["drizzle-kit push", "deny"],
  ["git tag @stackra/logger@1.0.0", "deny"],
  ["psql -c 'DROP DATABASE app'", "deny"],
  ["cat .env", "deny"],
  ["cat apps/x/.dev.vars", "deny"],
  ["cat ~/.git-credentials", "deny"],
  ["cat tls.pem", "deny"],
  ["wrangler deploy", "ask"],
  ["infisical run -- node x.js", "ask"],
  ["encore db reset", "ask"],
  ["git config user.email t@t", "ask"],
  ["rm -rf node_modules dist", "allow"],
  ["git reset --hard", "allow"],
  ["git checkout .", "allow"],
  ["git clean -fd", "allow"],
  ["pnpm bot:git -- push origin HEAD", "allow"],
  ["pnpm bot:git -- push --force-with-lease origin HEAD", "allow"],
];
const strictest = (a, b) =>
  a === "deny" || b === "deny" ? "deny" : a === "ask" || b === "ask" ? "ask" : "allow";

for (const [name, wrap, asks] of WRAPPED)
  test(`differential: ${name} x every guarded command`, () =>
    assert.deepEqual(
      wrong(GUARDED.map(([c, want]) => [wrap(c), strictest(want, asks ? "ask" : "allow")])),
      [],
    ));

test("differential: the matrix covers every wrapper _inbox.mjs knows", () => {
  for (const w of WRAPPERS)
    assert.ok(
      WRAPPED.some(([name]) => name === w),
      w,
    );
  assert.ok(WRAPPED.length * GUARDED.length > 1500);
});

// ---- ordinary agent work stays allowed ----------------------------------------------------------------------

const ALLOWED = [
  // reading git
  "git status",
  "git status --short",
  "git status -sb",
  "git diff",
  "git diff --stat",
  "git diff --cached",
  "git diff origin/main...HEAD",
  "git diff HEAD~1 -- .agents/hooks/_rules.mjs",
  "git diff -- '*.json'",
  "git log --oneline -10",
  "git log -1 --format=%H",
  "git log --oneline origin/main..HEAD",
  'git log --grep "push origin main" --oneline',
  "git show HEAD",
  "git show --stat HEAD",
  "git show HEAD:package.json",
  "git blame .agents/hooks/_rules.mjs",
  "git branch --show-current",
  "git branch -a",
  "git rev-parse HEAD",
  "git rev-parse --show-toplevel",
  "git merge-base HEAD origin/main",
  "git ls-files",
  "git ls-files '*.json'",
  "git ls-files -m",
  'git grep -n "git reset --hard"',
  "git worktree list",
  "git remote -v",
  "git config user.email",
  "git config --get remote.origin.url",
  "git stash list",
  "git shortlog -sn",
  "git describe --tags --always",
  "git reflog -5",
  "git cat-file -p HEAD",
  "git -C $WT status",
  "git -C $WT log -1",
  "git -C $MAIN status",
  "git -C $MAIN log --oneline -3",
  // substitutions and process substitutions (STA-330 review round 4)
  "diff <(git show HEAD:a.txt) a.txt",
  "cmp <(git diff A B) <(git diff C D)",
  "sort <(git ls-files) | head",
  'x=$(git log -1 --format="%an (%ae)")',
  "for p in $(git ls-files | grep -E '^(a|b)/'); do echo $p; done",
  "for f in $(find . \\( -name a \\)); do :; done",
  "y=$(find . -name '*(1)*')",
  "for f in $(git ls-files); do wc -l $f; done",
  "branch=$(git branch --show-current)",
  "echo `git rev-parse HEAD`",
  // local git writes in the session's own worktree
  "git add -A",
  "git add .agents/hooks/_rules.mjs",
  "git add *.json",
  'git commit -m "fix(hooks): read quoted command lines"',
  "git commit --amend --no-edit",
  "git commit -F - <<'EOF'\nfix(hooks): never rm -rf / or git push origin main\n\nRefs: STA-1\nEOF",
  "git commit -m \"$(cat <<'EOF'\nfix(hooks): x\n\nnever infisical export; never cat .env\nEOF\n)\"",
  "git rebase origin/main",
  "git rebase --continue",
  "git rebase --abort",
  "git cherry-pick abc123",
  "git merge --ff-only origin/main",
  "git switch -c feature/z",
  "git checkout -b feature/z",
  "git checkout feature/x",
  "git restore --staged .",
  "git restore .agents/hooks/_rules.mjs",
  "git reset --soft HEAD~1",
  "git reset HEAD~1",
  "git reset --hard",
  "git reset --hard origin/main",
  "git clean -n",
  "git clean -fd",
  "git checkout .",
  "git stash",
  "git stash push -m wip",
  "git stash apply stash@{0}",
  "git stash show -p stash@{1}",
  "git tag v1",
  "git branch -d feature/old",
  "git worktree add .claude/worktrees/sta-1 -b figentra/sta-1-x origin/main",
  'git config --worktree user.name "Stackra Agent"',
  "git -c core.editor=true rebase --continue",
  "git -c commit.gpgsign=false commit -m wip",
  "git apply fix.diff",
  "git format-patch -1",
  // GitHub, pushes and Linear through the wrappers
  "pnpm bot:gh pr view 113",
  "pnpm bot:gh pr checks 113",
  'pnpm bot:gh pr create --title "fix(hooks): x" --body "Refs STA-330; never git push origin main"',
  'pnpm bot:gh pr create --title "x" --body-file /tmp/body.md',
  "pnpm bot:gh pr list --state open",
  "pnpm bot:gh pr diff 113",
  "pnpm bot:gh pr edit 113 --body-file body.md",
  'pnpm bot:gh pr comment 113 --body "Addressed the findings"',
  "pnpm bot:gh run list --limit 5",
  "pnpm bot:gh run view 123 --log-failed",
  "pnpm bot:gh api repos/figentra/stackra/pulls/113",
  "pnpm --silent bot:gh pr view 113 --json headRefOid | jq -r .headRefOid",
  "pnpm bot:gh issue view 12",
  "pnpm bot:git -- fetch origin",
  "pnpm bot:git -- fetch origin main",
  "pnpm bot:git -- push origin HEAD",
  "pnpm bot:git -- push --force-with-lease origin HEAD",
  "pnpm bot:git -- -C $WT push origin HEAD",
  "pnpm bot:git -- -C $WT push --force-with-lease origin HEAD",
  "pnpm bot:git -- -C $WT fetch origin",
  'pnpm linear comment STA-330 "Round 4 fixed; never infisical export or git push origin main"',
  "pnpm linear start STA-330",
  "pnpm linear review STA-330 https://github.com/figentra/stackra/pull/113",
  "pnpm linear mine",
  'pnpm linear create --title "guard: x" --labels agent',
  "pnpm pr:merge 113",
  // the repository's scripts and tools
  "pnpm verify",
  "pnpm test",
  "pnpm test:hooks",
  "pnpm build",
  "pnpm lint",
  "pnpm typecheck",
  "pnpm format",
  "pnpm format:check",
  "pnpm validate",
  "pnpm boundaries",
  "pnpm knip",
  "pnpm install",
  "pnpm install --frozen-lockfile",
  "pnpm add -D vitest",
  "pnpm --filter @stackra/logger test",
  "pnpm -F @figentra/docs build",
  "pnpm run build",
  "pnpm exec oxfmt *.json",
  "pnpm exec oxfmt --check .",
  "pnpm exec oxfmt .agents/hooks/_rules.mjs",
  "pnpm exec oxlint .agents/hooks",
  "pnpm exec vitest run",
  "pnpm exec tsc --noEmit",
  "pnpm changeset",
  "pnpm agents:sync",
  "pnpm agents:check",
  "pnpm secrets:import --list",
  "pnpm docs",
  "mise exec -- pnpm verify",
  "mise exec -- pnpm test:hooks",
  "mise exec -- node --version",
  "mise install",
  "node --test .agents/hooks/__tests__/guard-bash.test.mjs",
  "node tools/scripts/validate-repository.mjs",
  'node -e "console.log(process.version)"',
  "timeout 600 pnpm verify",
  "turbo run build --filter=@stackra/logger",
  "encore run",
  "encore test",
  "encore check",
  "psql -c 'select 1'",
  "infisical secrets folders get --env=dev",
  "wrangler dev",
  "docker ps",
  // files and search
  "cat package.json",
  "cat src/*.json",
  "jq . *.json",
  "jq -r .version package.json",
  "ls *.json",
  "ls -la",
  "ls .*",
  "cat a*",
  "cat .env.example",
  "cat *.md",
  "head -50 .agents/hooks/_rules.mjs",
  "wc -l .agents/hooks/*.mjs",
  'grep -rn "infisical export" .agents',
  'rg -n "DROP DATABASE" apps/docs',
  "rg --files -g '*.json'",
  "find . -name '*.ts' -not -path './node_modules/*'",
  "find . -name '*.tsbuildinfo' -delete",
  "find dist -delete",
  "find . -name node_modules -prune -exec rm -rf {} +",
  "sed -n '1,80p' .agents/hooks/_rules.mjs",
  "awk '/^worktree/ {print $2}' list.txt",
  "diff -u a.txt b.txt",
  "mkdir -p tmp/x && touch tmp/x/a",
  "cp README.md /tmp/readme.md",
  "mv a.txt b.txt",
  // removing your own build output
  "rm -rf node_modules",
  "rm -rf node_modules dist",
  "rm -rf .turbo .stackra coverage",
  "rm -rf */node_modules",
  "rm -rf **/node_modules",
  "rm -rf packages/*/node_modules",
  "rm -rf packages/a/node_modules",
  "rm -rf $SCRATCH/x",
  "rm -f a.txt",
  // prose, output and quoted lines that run nothing guarded
  'echo "rm -rf / is denied; so is git stash pop"',
  "printf '%s\\n' \"git push origin main\"",
  "cat > notes.md <<'EOF'\nrm -rf ~; infisical export; git push origin main; cat .env\nEOF",
  "tmux new -d 'pnpm test'",
  "watch 'git status'",
  "ssh host 'ls -la'",
  "sh -c 'pnpm test'",
  'bash -c "git status && git log -1"',
  "(cd packages && pnpm test)",
  "which node",
  "command -v gh",
  "curl -s https://docs.stackra.figentra.com | head",
  "ps aux",
  "pgrep -fl node",
  "du -sh node_modules",
  "date",
];

test("differential: at least 150 ordinary agent commands stay allowed", () => {
  assert.ok(ALLOWED.length >= 150, `${ALLOWED.length} commands`);
  assert.equal(new Set(ALLOWED).size, ALLOWED.length);
  assert.deepEqual(wrong(ALLOWED.map((c) => [c, "allow"])), []);
});

// ---- the settings floor ---------------------------------------------------------------------------------------

test("differential: the settings floor denies bot:token and changeset version behind pnpm run / --filter / -F", () => {
  const root = new URL("../../..", import.meta.url).pathname;
  const { deny } = JSON.parse(
    readFileSync(join(root, ".claude", "settings.json"), "utf8"),
  ).permissions;
  for (const rule of [
    "Bash(pnpm run bot:token*)",
    "Bash(pnpm --filter * bot:token*)",
    "Bash(pnpm -F * bot:token*)",
    "Bash(pnpm run changeset:version*)",
    "Bash(pnpm run changeset version*)",
    "Bash(pnpm --filter * changeset:version*)",
    "Bash(pnpm -F * changeset:version*)",
  ])
    assert.ok(deny.includes(rule), rule);
});
