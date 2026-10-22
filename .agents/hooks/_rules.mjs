// The agent permission rules (ADR 0293), one module for `guard-bash.mjs`, `guard-paths.mjs` and the OpenCode
// guard (`.opencode/plugins/guard/decide.ts`), so the two tools never drift. Three tiers: allow, ask (a human
// confirms; OpenCode runs unattended and maps it to deny) and deny. Settings deny and ask rules are the floor;
// these rules add only what a prefix pattern cannot see: runner wrappers (`pnpm exec`, `npx`, `mise exec --`),
// which checkout a git command targets, `agent_type`, and quoted prose.
//
// Secrets model (ADR 0173, ADR 0257): nobody reads a value. Developer, agent and CI tokens live in Infisical and
// reach a process through the pnpm script that needs them; there are no `.env` files in this repository.
//
// Accident guard, not a boundary: hooks run as the same macOS user and fail open, and text rules miss
// `node -e`, child_process and wrappers they do not know.
//
// Rules are scoped to the operand of a command, never a bare keyword. Prose is not a command: quoted text is
// blanked (`runs`), heredoc bodies are stripped, and `-m` / `--title` / `--body` values are dropped
// (`dropMessages`). Substitution bodies, `sh -c` / `eval` strings and function bodies are commands.
import { spawnSync } from "node:child_process";
import { realpathSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join, resolve, sep } from "node:path";
import {
  commandReachesInbox,
  rawSubstitutions,
  reachesInbox,
  scanShell,
  scriptStrings,
  runsOpaque,
  stripHeredocs,
} from "./_inbox.mjs";
import { REVIEWER_AGENTS } from "./_reviewer-agents.mjs";

/** The only `-c` keys an agent may set: display, identity and rerere; none runs a command or redirects a remote. */
const ALLOWED_C =
  /^(?:color\.ui|color\.diff|color\.status|color\.branch|core\.quotepath|core\.abbrev|core\.precomposeunicode|user\.name|user\.email|advice\.detachedhead|diff\.renames|diff\.algorithm|diff\.context|diff\.noprefix|log\.abbrevcommit|log\.decorate|log\.date|merge\.ff|merge\.conflictstyle|pull\.rebase|pull\.ff|push\.default|rebase\.autosquash|init\.defaultbranch|column\.ui|status\.short|status\.branch|status\.showuntrackedfiles|rerere\.enabled)$/i;
/** `git config` modes that only read; the first option must be one of them. */
const CONFIG_READ = new Set([
  "--get",
  "--get-all",
  "--get-regexp",
  "--get-urlmatch",
  "--list",
  "-l",
  "get",
  "list",
]);
const CONFIG_WRITE = new Set([
  "--add",
  "--replace-all",
  "--unset",
  "--unset-all",
  "-e",
  "--edit",
  "--rename-section",
  "--remove-section",
  "set",
  "unset",
  "edit",
]);
/** Words of a `git config` command line: stops at an unquoted separator or `#` comment; a quoted word is never a flag. */
function configWords(rest) {
  const out = [];
  let cur = null;
  let quoted = false;
  const end = () => {
    if (cur !== null) out.push(quoted ? "\0" + cur : cur);
    cur = null;
    quoted = false;
  };
  for (let i = 0; i < rest.length; i++) {
    const ch = rest[i];
    if (ch === "'" || ch === '"') {
      const close = rest.indexOf(ch, i + 1);
      const stop = close === -1 ? rest.length : close;
      cur = (cur ?? "") + rest.slice(i + 1, stop);
      quoted = true;
      i = stop;
    } else if (/\s/.test(ch) && ch !== "\n") end();
    else if (/[|;&\n]/.test(ch) || (ch === "#" && cur === null)) break;
    else cur = (cur ?? "") + ch;
  }
  end();
  return out;
}
/**
 * True when `git config` words are neither a plain read (the first option reads, no write flag follows) nor a
 * local write of one allowed key (`git config [--local] rerere.enabled true`).
 */
function configWrites(words) {
  const [first, ...rest] = words;
  const reads =
    CONFIG_READ.has(first) ||
    (["--show-origin", "--show-scope"].includes(first) && rest.some((w) => CONFIG_READ.has(w)));
  const local = words[0] === "--local" ? words.slice(1) : words;
  const allowedKey = local.length === 2 && ALLOWED_C.test(local[0]);
  return !(reads || allowedKey) || rest.some((w) => CONFIG_WRITE.has(w));
}
/** Every `git … config …` or `git -c <key>` in `d` that could write config or run a command (STA-216). */
function gitConfigUnsafe(d) {
  const re = new RegExp(String.raw`\bgit\s+(?:--\s+)?(${GIT_OPTS})`, "g");
  const opt = new RegExp(
    String.raw`-c\s+(?<v>${Q})|-C\s+(?:${Q})|--(?:git-dir|work-tree|namespace)(?:=(?:${Q})|\s+(?:${Q}))|--\S+|-[pP]`,
    "g",
  );
  for (const m of d.matchAll(re)) {
    for (const t of m[1].matchAll(opt))
      if (t.groups.v !== undefined && !ALLOWED_C.test(unquote(t.groups.v).split("=")[0]))
        return true;
    const rest = d.slice(m.index + m[0].length);
    if (/^config\b/.test(rest) && configWrites(configWords(rest.slice(6)))) return true;
  }
  return false;
}
/** An option value: a quoted string (spaces allowed) or one word. */
const Q = String.raw`"[^"]*"|'[^']*'|\S+`;
/** git's global options before the subcommand (STA-216: quoted values, the boolean options). */
const GIT_OPTS = String.raw`(?:(?:-[Cc]\s+(?:${Q})|--(?:git-dir|work-tree|namespace)(?:=(?:${Q})|\s+(?:${Q}))|--exec-path(?:=\S+)?|--(?:no-pager|paginate|bare|literal-pathspecs|no-replace-objects|glob-pathspecs|noglob-pathspecs|icase-pathspecs|no-optional-locks)|-[pP])\s+)*`;
/** `git` (or `pnpm bot:git --`) followed by any global options before the subcommand. */
const GIT = String.raw`\bgit\s+(?:--\s+)?` + GIT_OPTS;

/** Command position: start, or after a separator, optionally behind `VAR=x` assignments. */
const CMDPOS = String.raw`(?:^|[|;&(\n])\s*(?:\w+=\S*\s+)*`;

/**
 * Owner-login guard (STA-208, ADR 0230 rule 5): `gh` and `git` at command position run with the owner's
 * `gh auth` login and git credential helper. Agents use the bot wrappers instead, which fail closed when no token
 * can be minted. Wrappers like `sudo`, `env`, `xargs`, `time` are looked through; runners (`pnpm exec`, `npx`)
 * by `lookThroughRunners`.
 */
const BARE = String.raw`(?:^|[|;&(\n\x60])\s*(?:(?:sudo|command|exec|time|nohup|env|xargs(?:\s+-\S+)*)\s+|\w+=(?:\$\([^)]*\)|\S*)\s+)*(?:\S*/)?`;
const BARE_GH = new RegExp(BARE + String.raw`gh(?:\s|$)`);
const BARE_GIT = (sub) =>
  new RegExp(BARE + String.raw`git\s+` + GIT_OPTS + String.raw`(?:${sub})\b`);
/**
 * Every git subcommand that talks to a remote. All of them go through `pnpm bot:git`, public repos included.
 * `submodule status` and `submodule summary` read only the local checkout.
 */
const NETWORK_GIT = BARE_GIT(
  String.raw`push|fetch|pull|clone|ls-remote|submodule(?!\s+(?:status|summary)\b)|subtree|remote\s+(?:update|show|prune)|archive\s+[^|;&\n]*--remote`,
);

/**
 * Runners that run the command after them, like `sudo` or `env`: `pnpm [global options] [exec|dlx] <bin>` (pnpm
 * runs any binary on PATH when no script has the name), `npm exec`, `yarn`, `npx`, `pnpx`, `bunx` and
 * `mise exec … --`. `lookThroughRunners` drops them at command position, so `pnpm gh pr merge` is checked as
 * `gh pr merge`. shortcut: options that take a value are known only for pnpm (`-C`, `-F`, `--filter`, `--dir`);
 * `npx -p pkg cmd` is read as `pkg cmd` (npx asks anyway). Upgrade when a runner option hides a command.
 */
const RUNNER = String.raw`(?:(?:\S*\/)?(?:pnpm|npm|yarn)\s+(?:(?:-[CF]|--(?:filter|dir|prefix|workspace|cwd))(?:=|\s+)\S+\s+|--?[\w-]+(?:=\S+)?\s+)*(?:(?:exec|dlx|x)\s+(?:-\S+\s+)*)?|(?:\S*\/)?(?:npx|pnpx|bunx)\s+(?:-\S+\s+)*|(?:\S*\/)?mise\s+(?:exec|x)\s+(?:[^|;&\n]*?\s)?--\s+)`;
const RUNNERS = new RegExp(String.raw`(^|[|;&(\n\x60]\s*)((?:\w+=\S*\s+)*)(?:${RUNNER})+`, "g");
/** `c` with every runner prefix at command position removed (`pnpm exec infisical run` → `infisical run`). */
export const lookThroughRunners = (c) => c.replace(RUNNERS, "$1$2");

/** The text of every `$(…)` / backtick body at any depth (single quotes stay literal) and `sh -c` / `eval` string. */
function nestedRaw(c) {
  const out = scanShell(c).bodies.flatMap((b) => [b, ...nestedRaw(b)]);
  for (const s of scriptStrings(c)) out.push(s, ...nestedRaw(s));
  return out;
}
/** Texts a rule that needs the quoted values scans: the command with prose dropped, and every nested command in full. */
const scanTexts = (c) => [dropMessages(c), ...nestedRaw(c).map(dropMessages)];
/**
 * `scanTexts` paired with the directory each text starts in: the command starts in `cwd`; a nested text (a `$(…)`
 * body, an `sh -c` string) starts unknown once the command has a `cd`, because the order is lost.
 */
const scanBases = (c, cwd) => {
  const [outer, ...nested] = scanTexts(c);
  const base = /(?:^|[\s;&|(`'"])(?:cd|pushd)(?:\s|$)/.test(outer) ? null : cwd;
  return [[outer, cwd], ...nested.map((t) => [t, base])];
};
const runnableCache = new Map();
/**
 * The text a shell runs: the quote-blanked command (prose in `--body "…"` is ignored), plus every `$(…)` and
 * backtick body at any depth, inside double quotes too (`scanShell`, STA-254), and every `sh -c` / `eval` string.
 * Single-quoted text stays literal. Function, alias and piped or written-then-run script text come from
 * `scriptStrings` (STA-291); deliberate workarounds stay open. Memoised: every rule reads the same texts.
 */
function runnable(c) {
  const hit = runnableCache.get(c);
  if (hit) return hit;
  const { blanked, bodies } = scanShell(c);
  const out = [blanked, ...bodies.flatMap(runnable)];
  for (const s of scriptStrings(c)) out.push(...runnable(s));
  if (runnableCache.size > 200) runnableCache.clear(); // the OpenCode plugin is long-lived
  runnableCache.set(c, out);
  return out;
}
/** True when any runnable text has a segment matching `rx`. */
const runs = (c, rx) => runnable(c).some((t) => segments(t).some((s) => rx.test(s)));

/** `git` output in `cwd`, or "" when git fails. */
function git(cwd, ...args) {
  const r = spawnSync("git", args, { cwd, encoding: "utf8" });
  return r.status === 0 ? r.stdout.trim() : "";
}

/** Quoted strings blanked, so a word inside `node -e '...'` or `--body "..."` is not mistaken for a command. */
const blank = (c) => scanShell(c).blanked;

/** Command segments: split on separators outside quotes (a `;` inside `-c "a;b"` does not hide a push). */
function segments(c) {
  const out = [];
  let cur = "";
  let quote = "";
  for (let i = 0; i < c.length; i++) {
    const ch = c[i];
    if (quote) {
      if (ch === "\\" && quote === '"') cur += ch + (c[++i] ?? "");
      else {
        cur += ch;
        if (ch === quote) quote = "";
      }
    } else if (ch === "'" || ch === '"') {
      quote = ch;
      cur += ch;
    } else if (/[|;&\n]/.test(ch)) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}
const unquote = (w) => w.replace(/^['"]+|['"]+$/g, "");
/**
 * Prose is not a command: blank the quoted `-m` / `--message` / `--title` / `--body` value and the text of
 * `pnpm linear comment <KEY> "…"` (STA-216), so a PR body or a comment may mention `pr merge` or `push origin main`.
 */
const PROSE_BEFORE = /(?:\s(?:-m|--message|--title|--body)(?:\s+|=)|\blinear\s+comment\s+\S+\s+)$/;
const dropMessages = (c) => {
  const { spans, source } = scanShell(c);
  return spans
    .filter(([start]) => PROSE_BEFORE.test(source.slice(0, start)))
    .reduceRight((t, [start, end]) => t.slice(0, start) + "MSG" + t.slice(end), source);
};

/** The `infisical secrets` subcommand a runnable segment uses: "get", "set", "delete", "folders", or "" (bare). */
const INFISICAL_SUBCOMMANDS = new Set(["get", "set", "delete", "folders", "generate-example-env"]);
function infisicalSecrets(c) {
  const verbs = [];
  for (const t of runnable(c))
    for (const seg of segments(t)) {
      const m = seg.match(/\binfisical\s+(?:-\S+\s+)*secrets\b(.*)$/);
      if (m) verbs.push(m[1].split(/\s+/).find((w) => INFISICAL_SUBCOMMANDS.has(unquote(w))) ?? "");
    }
  return verbs;
}

/** The branch a push refspec writes to: `+src:refs/heads/dst` → `dst`. */
const refspecDest = (r) =>
  r
    .replace(/^\+/, "")
    .split(":")
    .pop()
    .replace(/^refs\/heads\//, "");

/** `~` and `$HOME` expanded; any other `$` or backtick, or an empty (blanked) word, makes the path unknown (null). */
const expandHome = (p) => {
  const e = unquote(p).replace(/^(?:~|\$HOME|\$\{HOME\})(?=\/|$)/, homedir());
  return e === "" || /[$`]/.test(e) ? null : e;
};

/** `p` with its existing ancestors resolved through symlinks (`/tmp` → `/private/tmp`); the rest kept as written. */
function realDir(p) {
  try {
    return realpathSync(p);
  } catch {
    const up = dirname(p);
    return up === p ? p : join(realDir(up), basename(p));
  }
}

/** The directory a `cd` / `pushd` operand moves `dir` to; null when unknown (`$X`, `-`, an unknown base). */
function moveTo(dir, to) {
  if (to === undefined) return homedir();
  if (to === "-") return null;
  const e = expandHome(to);
  if (e === null) return null;
  if (e.startsWith("/")) return e;
  return dir === null ? null : resolve(dir, e);
}
/** A segment that is only a `cd` (in a subshell or group too): its operand is group 1. */
const CD = /^\s*[({]?\s*(?:cd|pushd)(?:\s+(\S+))?\s*[)}]?\s*$/;
/** A `cd` buried in a script string or subshell: the base of later relative paths is unknown. */
const NESTED_CD = /(?:^|[\s;&|(`'"])(?:cd|pushd)\s/;
/** Segments whose words are search patterns or history, never a git action (`grep "git push origin main"`). */
const READER_SEGMENT =
  /^\s*(?:\S*\/)?(?:rg|grep|egrep|fgrep|ag)\b|^\s*(?:\S*\/)?git\s+(?:-\S+\s+)*(?:log|grep)\b/;
/**
 * A git invocation: its global options (1) and subcommand (2, in a lookahead so `x/.git git reset` yields both
 * `git git` and `git reset`); `pnpm bot:git --` included.
 */
const GIT_WORD = new RegExp(String.raw`\bgit\s+(?:--\s+)?(${GIT_OPTS})(?=([\w-]+))`, "g");
/** Global options that move the checkout; a `-c` value is consumed and never read as an option (STA-216). */
const TARGET_TOKENS = new RegExp(
  String.raw`(?<bare>--bare)|(?<opt>-C|--git-dir|--work-tree)(?:=|\s+)(?<value>${Q})|-c\s+(?:${Q})|--namespace(?:=(?:${Q})|\s+(?:${Q}))|--[a-z-]+(?:=\S+)?|-[pP]`,
  "g",
);

/**
 * Every git command in `text` (separators split, `cd` followed in order) with the checkout it runs in: `dir` (the
 * shell's directory, null when unknown) and `target`, the location options replayed for a `git rev-parse` there
 * (`-C`, `--git-dir`, `--work-tree`, `--bare`, and `GIT_DIR=` / `GIT_WORK_TREE=` anywhere), null when unknown.
 * `run(...args)` runs git in that checkout and returns "" when it fails or the checkout is unknown.
 */
function gitCommands(text, cwd) {
  const out = [];
  const env = [...text.matchAll(new RegExp(String.raw`\bGIT_(DIR|WORK_TREE)=(${Q})`, "g"))].map(
    ([, k, v]) => [k === "DIR" ? "--git-dir" : "--work-tree", expandHome(v)],
  );
  let dir = cwd;
  for (const seg of segments(text)) {
    const cd = CD.exec(seg);
    if (cd) {
      dir = moveTo(dir, cd[1]);
      continue;
    }
    if (NESTED_CD.test(seg)) dir = null;
    if (READER_SEGMENT.test(seg)) continue;
    // Every `git` word outside quotes (a path like `GIT_DIR=x/.git git …` holds two); quoted text is prose here,
    // and the commands nested in it are scanned as their own texts.
    const quoted = scanShell(seg).spans;
    for (const m of seg.matchAll(GIT_WORD)) {
      if (quoted.some(([a, b]) => m.index >= a && m.index < b)) continue;
      let target = [];
      for (const [opt, v] of env)
        target = v === null || target === null ? null : [...target, `${opt}=${v}`];
      for (const { groups: g } of m[1].matchAll(TARGET_TOKENS)) {
        if (target === null) break;
        if (g.bare) target.push("--bare");
        if (!g.opt) continue;
        const v = expandHome(g.value);
        if (v === null) target = null;
        else target.push(...(g.opt === "-C" ? ["-C", v] : [`${g.opt}=${v}`]));
      }
      const at = dir;
      const where = target;
      out.push({
        sub: m[2],
        args: seg
          .slice(m.index + m[0].length + m[2].length)
          .split(/\s+/)
          .filter(Boolean)
          .map(unquote),
        bot: /\bbot:git\b/.test(seg),
        gitDir: where === null || where.some((w) => /^--(?:git-dir|bare)\b/.test(w)),
        run: (...args) => (at === null || where === null ? "" : git(at, ...where, ...args)),
      });
    }
  }
  return out;
}

/**
 * The checkout a session owns: the toplevel of its cwd, whether that is the main checkout (git-dir equals
 * git-common-dir) rather than a linked worktree, and the linked worktrees nested inside it (`.claude/worktrees/*`).
 */
function ownCheckout(cwd) {
  const top = git(cwd, "rev-parse", "--show-toplevel");
  if (!top) return { root: "", main: true, nested: [] };
  const root = realDir(top);
  const [dir, common] = git(cwd, "rev-parse", "--git-dir", "--git-common-dir")
    .split("\n")
    .map((p) => realDir(resolve(cwd, p)));
  const nested = git(cwd, "worktree", "list", "--porcelain")
    .split("\n")
    .filter((l) => l.startsWith("worktree "))
    .map((l) => realDir(l.slice(9)))
    .filter((w) => w.startsWith(root + sep));
  return { root, main: dir === common, nested };
}

/** True when `rm` is given both recursive and force, in any flag spelling. */
const isRecursiveForce = (flags) =>
  (flags.some((f) => /^-[a-zA-Z]*[rR]/.test(f)) || flags.includes("--recursive")) &&
  (flags.some((f) => /^-[a-zA-Z]*f/.test(f)) || flags.includes("--force"));
/** The scratchpad root Claude Code gives a session: `/tmp/claude-<uid>` through its symlinks. */
const scratchRoot = () => realDir(`/tmp/claude-${process.getuid?.() ?? 0}`);

/**
 * `rm -rf` on anything outside the allowed roots: strictly inside this session's own checkout (never a linked
 * worktree nested in it, nor a path that contains one) or the scratchpad. `cd` segments are followed; a relative
 * operand after an unknown `cd` (`cd $X`, a `cd` in a script string), `~`, `$` expansions and a bare `*` deny.
 */
function unsafeRmRf(c, ctx) {
  for (const [text, base] of scanBases(c, ctx.cwd)) {
    let dir = base;
    for (const seg of segments(text)) {
      const cd = CD.exec(seg);
      if (cd) {
        dir = moveTo(dir, cd[1]);
        continue;
      }
      if (NESTED_CD.test(seg)) dir = null;
      const quoted = scanShell(seg).spans; // `echo "rm -rf /"` is prose; `bash -c "…"` is scanned as its own text
      for (const m of seg.matchAll(/\brm\s+([^|;&\n)]*)/g)) {
        if (quoted.some(([a, b]) => m.index >= a && m.index < b)) continue;
        const words = m[1].split(/\s+/).map(unquote).filter(Boolean);
        if (!isRecursiveForce(words.filter((w) => w.startsWith("-")))) continue;
        for (const t of words.filter((w) => !w.startsWith("-")))
          if (!rmAllowed(t, dir, ctx)) return true;
      }
    }
  }
  return false;
}
/** True when `rm -rf <t>`, run in `dir` (null when unknown), stays inside the allowed roots. */
function rmAllowed(t, dir, ctx) {
  if (/^[~$]/.test(t) || /[$`]/.test(t) || /^(\.\/)?\.?\*$/.test(t)) return false;
  if (!t.startsWith("/") && dir === null) return false;
  // The entry itself, not a symlink's target: rm removes the link.
  const path = resolve(dir ?? "/", t);
  const real = join(realDir(dirname(path)), basename(path));
  const own = ctx.own();
  const inside = [own.root, scratchRoot()].some((r) => r && real.startsWith(r + sep));
  // A glob reaches everything under its static part (`.claude/worktrees/*`).
  const probe = /[*?[]/.test(real) ? dirname(real.slice(0, real.search(/[*?[]/) + 1)) : real;
  const nested = own.nested.some(
    (w) => w === probe || w.startsWith(probe + sep) || probe.startsWith(w + sep),
  );
  return inside && !nested;
}

/**
 * `git push` whose destination is main: an explicit refspec (`main`, `HEAD:main`, `+main`, `refs/heads/main`,
 * `:main`), `--all` / `--mirror`, or no refspec (or `HEAD`) while main is checked out in the push's checkout (the
 * hook's cwd, moved by `cd`, `-C`, `--git-dir`, `--work-tree`, `GIT_DIR=`; STA-214). An unknown target counts as
 * main. A branch that merely contains "main" is fine. Search and history segments (`grep`, `rg`, `git log`,
 * `git grep`) are skipped: their words are patterns.
 */
function pushesMain(c, ctx) {
  return scanBases(c, ctx.cwd).some(([t, base]) =>
    gitCommands(t, base).some((g) => {
      if (g.sub !== "push") return false;
      if (g.args.some((a) => a === "--all" || a === "--mirror")) return true;
      const refs = pushRefs(g.args);
      if (refs.some((r) => refspecDest(r) === "main")) return true;
      const implicit = refs.length <= 1 || refs.slice(1).every((r) => r === "HEAD");
      if (!implicit) return false;
      const branch = g.run("symbolic-ref", "--short", "HEAD");
      return branch === "" || branch === "main";
    }),
  );
}
/** Push options whose value is the next word. */
const PUSH_VALUE = new Set(["-o", "--push-option", "--repo", "--receive-pack", "--exec"]);
/** The remote and refspecs of a push: its words that are neither options nor option values. */
function pushRefs(args) {
  const out = [];
  for (let i = 0; i < args.length; i++) {
    if (PUSH_VALUE.has(args[i])) i++;
    else if (!args[i].startsWith("-")) out.push(args[i]);
  }
  return out;
}
/** A tag refspec: `refs/tags/…`, or a release tag `<package>@<version>`. */
const isTagRef = (r) => /^\+?(?:refs\/tags\/|[^:]*@\d)/.test(r);

/**
 * Why a push rewrites, deletes or writes another branch, or null: `--force` without a lease (`--force-if-includes`
 * is fine), `-f` (bundled too), `--delete` / `-d`, `--mirror`, `--prune`, a `+refspec` or a `:branch`
 * delete; and for `pnpm bot:git` a refspec other than `HEAD` or the current branch (feature branches, other
 * agents' PR branches included, have no ruleset). Tag refspecs are left to the ask rule.
 */
function pushRefusal(c, ctx) {
  const forced = scanBases(c, ctx.cwd).some(([t, base]) =>
    gitCommands(t, base).some(
      (g) =>
        g.sub === "push" &&
        g.args.some(
          (f) =>
            /^--force(?!-with-lease|-if-includes)/.test(f) ||
            /^-[a-zA-Z]*[fd][a-zA-Z]*$/.test(f) ||
            /^--(?:delete|mirror|prune)$/.test(f),
        ),
    ),
  );
  if (forced)
    return "Push guard: `--force` without a lease, `-f`, `--delete` / `-d`, `--mirror` and `--prune` rewrite or delete remote branches. Use `pnpm bot:git -- push --force-with-lease origin HEAD`, and only on your own branch.";
  for (const [t, base] of scanBases(c, ctx.cwd))
    for (const g of gitCommands(t, base)) {
      if (g.sub !== "push") continue;
      const refs = pushRefs(g.args).slice(1);
      if (refs.some((r) => /^[+:]/.test(r)))
        return "Push guard: a `+refspec` force-pushes and a `:branch` refspec deletes a remote branch. Push `HEAD` with `--force-with-lease` instead.";
      if (!g.bot) continue;
      const branch = g.run("symbolic-ref", "--short", "HEAD");
      const own = new Set(branch ? [branch, `refs/heads/${branch}`] : []);
      for (const r of refs.filter((x) => !isTagRef(x))) {
        const [src, dst, ...more] = r.split(":");
        const ok =
          (src === "HEAD" || own.has(src)) && (dst === undefined || own.has(dst)) && !more.length;
        if (!ok)
          return `Push guard: \`pnpm bot:git\` pushes only \`HEAD\` or the current branch (${branch || "detached"}), never another branch. Use \`pnpm bot:git -- push origin HEAD\`.`;
      }
    }
  return null;
}

/**
 * A git command that discards uncommitted work: `reset --hard|--merge|--keep`, `checkout` / `restore` of the whole
 * tree (`.`, `./`, `:/`; `restore --staged` alone only unstages), `checkout -f`, `switch -f|--discard-changes`, and
 * `clean` unless `-n` / `--dry-run`.
 */
function discards({ sub, args }) {
  const has = (re) => args.some((a) => re.test(a));
  const tree = has(/^(?:\.\/?|:\/)$/);
  if (sub === "reset") return has(/^--(?:hard|merge|keep)$/);
  if (sub === "checkout") return tree || has(/^(?:-[a-zA-Z]*f[a-zA-Z]*|--force)$/);
  if (sub === "restore")
    return (
      tree &&
      (!has(/^(?:--staged|-[a-zA-Z]*S[a-zA-Z]*)$/) || has(/^(?:--worktree|-[a-zA-Z]*W[a-zA-Z]*)$/))
    );
  if (sub === "switch") return has(/^(?:-[a-zA-Z]*f[a-zA-Z]*|--force|--discard-changes)$/);
  if (sub === "clean") return !has(/^(?:-[a-zA-Z]*n[a-zA-Z]*|--dry-run)$/);
  return false;
}
/**
 * True when `top` (a checkout's toplevel) is this session's own linked worktree. A command that names a git
 * directory (`--git-dir`, `GIT_DIR=`, `--bare`) is never the session's own: git then uses the cwd as the worktree
 * of another repository's index.
 */
const isOwn = (top, ctx, g) => {
  const own = ctx.own();
  return Boolean(top) && !g.gitDir && !own.main && realDir(top) === own.root;
};
/** A discarding git command whose checkout is not this session's own linked worktree (`ownWorktreeOnly`). */
const discardsOutsideOwn = (c, ctx) =>
  scanBases(c, ctx.cwd).some(([t, base]) =>
    gitCommands(t, base).some(
      (g) => discards(g) && !isOwn(g.run("rev-parse", "--show-toplevel"), ctx, g),
    ),
  );
/** `git worktree remove --force|-f` of anything but this session's own worktree. */
const removesOtherWorktree = (c, ctx) =>
  scanBases(c, ctx.cwd).some(([t, base]) =>
    gitCommands(t, base).some((g) => {
      if (g.sub !== "worktree" || g.args[0] !== "remove") return false;
      if (!g.args.some((a) => /^(?:--force|-[a-zA-Z]*f[a-zA-Z]*)$/.test(a))) return false;
      const path = g.args.slice(1).find((a) => !a.startsWith("-"));
      return !path || !isOwn(g.run("-C", path, "rev-parse", "--show-toplevel"), ctx, g);
    }),
  );
/** Why a `git stash` touches the stack every worktree shares, or null. */
function stashRefusal(c, ctx) {
  for (const t of scanTexts(c))
    for (const g of gitCommands(t, ctx.cwd)) {
      if (g.sub !== "stash") continue;
      const [verb, ...rest] = g.args;
      if (["pop", "clear", "branch"].includes(verb))
        return `Stash guard: \`git stash ${verb}\` acts on \`refs/stash\`, which every worktree shares, so it can take another agent's work. Use a WIP commit (\`git commit -m "wip"\`, later \`git reset --soft HEAD~1\`).`;
      if (["apply", "drop"].includes(verb) && !rest.some((a) => !a.startsWith("-")))
        return `Stash guard: \`git stash ${verb}\` without a ref picks the top of a stack every worktree shares. Name the entry (\`git stash ${verb} stash@{1}\` or its sha from \`git stash list\`), or use a WIP commit.`;
    }
  return null;
}

/** `pnpm bot:gh` merging a PR: `pr merge`, `api …/pulls/<n>/merge` (any method), or a GraphQL merge or enqueue mutation. */
const MERGE =
  /\bpr\s+(?:(?:-R|--repo)(?:=|\s+)\S+\s+)?merge\b|\bpulls(?:\/|%2F)+\d+(?:\/|%2F)+merge\b|\b(?:mergePullRequest|enablePullRequestAutoMerge|enqueuePullRequest)\b/i;
/** A word percent-decoded (up to three layers), then slashes collapsed and `.` / `..` segments resolved (STA-216). */
function normalizeWord(w) {
  let d = w;
  for (let i = 0; i < 3; i++) {
    try {
      const n = decodeURIComponent(d);
      if (n === d) break;
      d = n;
    } catch {
      break;
    }
  }
  const out = [];
  for (const seg of d.split("/")) {
    if (seg === "" || seg === ".") continue;
    if (seg === "..") out.pop();
    else out.push(seg);
  }
  return out.join("/");
}
const botMerges = (c) =>
  [dropMessages(c), ...runnable(c)].some((t) =>
    segments(t).some(
      (s) =>
        /\bbot:gh\b/.test(blank(s)) &&
        (MERGE.test(s) || MERGE.test(s.replace(/\S+/g, normalizeWord))),
    ),
  );

/** A label write of `owner-approved` / `owner-approval`: `--add-label` / `--label`, `issues/<n>/labels`, `labels[]`. */
const LABEL_WRITE =
  /--(?:add-)?label(?:=|\s+)\S*owner-approv|\bissues\/\d+\/labels\b.*owner-approv|labels\[\]\S*owner-approv/i;
/** A `-b` / `--body` value that ends in the owner's approval token. */
const APPROVE_BODY =
  /(?:^|\s)(?:-b|--body)(?:=|\s+)(?:"[^"]*owner-approval\s*"|'[^']*owner-approval\s*'|\S*owner-approval)(?=\s|$)/i;
/**
 * ADR 0230 rule 4 tripwire: a `gh` command that writes the owner's label, or an approving `pr review` whose body
 * ends in `owner-approval`. Titles and bodies that only mention the words are prose.
 */
const writesOwnerApproval = (c) =>
  [dropMessages(c), ...nestedRaw(c)].some((t) =>
    segments(t).some((s) => /\bgh\b/.test(s) && LABEL_WRITE.test(s)),
  ) ||
  [c, ...nestedRaw(c)].some((t) =>
    segments(t).some(
      (s) =>
        /\bgh\b/.test(s) &&
        /\bpr\s+review\b/.test(s) &&
        /(?:^|\s)(?:--approve|-a)(?:\s|$)/.test(s) &&
        APPROVE_BODY.test(s),
    ),
  );

/** Running the reviewer wrapper: `pnpm bot:review`, or `bot-gh.mjs review` directly. */
const BOT_REVIEW =
  /(?:^|[\s(])(?:\S*\/)?(?:pnpm|npm|yarn)\s+(?:-\S+\s+)*(?:run\s+)?bot:review\b|\bbot-gh\.mjs\s+review\b/;

/** `ps` listing process environments (`-E`, or a BSD option cluster with `e`: `ps eww`), `launchctl procinfo`. */
const listsProcessEnv = (c) =>
  runnable(c).some((t) =>
    segments(t).some((s) => {
      if (new RegExp(BARE + String.raw`launchctl\s+procinfo\b`).test(s)) return true;
      const m = new RegExp(BARE + String.raw`ps(?:\s+(.*))?$`).exec(s);
      if (!m) return false;
      const args = (m[1] ?? "").split(/\s+/).filter(Boolean);
      return (
        args.some((a) => /^-[a-zA-Z]*E/.test(a)) || /^[a-zA-Z]*e[a-zA-Z]*$/.test(args[0] ?? "")
      );
    }),
  );

/**
 * The rules, in order. A rule denies unless it says `decision: "ask"`; any deny wins over any ask. `rx` is a regex
 * or a function of (text, ctx) that returns true, or a string that replaces `why`. `scan: "bare"` rules see the
 * text with quoted strings blanked.
 */
const RULES = [
  // --- Secrets: never print a value, never create a .env file (ADR 0173, ADR 0257) ------------
  {
    rx: (c) => runs(c, /\binfisical\s+(?:-\S+\s+)*export\b/),
    why: "Secrets guard: `infisical export` decrypts and prints every secret value. Agents never read a value; a secret reaches a process only through the pnpm script that needs it.",
  },
  {
    rx: (c) => infisicalSecrets(c).some((v) => v === "get" || v === "set"),
    why: "Secrets guard: `infisical secrets get` prints the value in every form (`--silent` too) and `infisical secrets set` writes one from the transcript. Nobody reads a value: the owner sets it, or drops it in the inbox for `pnpm secrets:import` (ADR 0257). `infisical secrets folders get` lists folders.",
  },
  {
    rx: (c) => infisicalSecrets(c).includes(""),
    why: "Secrets guard: `infisical secrets` with no subcommand prints every secret value. Agents never read a value; `infisical secrets folders get` lists folders, and the owner sets values (ADR 0257).",
  },
  {
    rx: (c) => infisicalSecrets(c).includes("delete"),
    decision: "ask",
    why: "`infisical secrets delete` removes a value nobody can restore from git; the owner confirms it.",
  },
  {
    rx: /\binfisical\s+run\b[^|;&\n]*\s--\s+(?:\w+=\S*\s+)*(?:printenv\b|env\s*(?:$|-|[|;&)\n]))/,
    why: "Secrets guard: `infisical run -- env|printenv` prints the injected secret values. Run the command that needs them instead.",
  },
  {
    rx: (c) => runs(c, /\binfisical\s+(?:-\S+\s+)*run\b/),
    decision: "ask",
    why: "Raw `infisical run` hands every /agents value to the process it starts; the owner confirms it. The pnpm scripts that need a token (`pnpm bot:gh`, `pnpm linear`) wrap it themselves.",
  },
  {
    rx: (c) => runs(c, /\bsecrets(?::import|-import(?:\.mjs)?)\b[^|;&\n]*\s--confirm\b/),
    decision: "ask",
    why: "`secrets:import … --confirm` writes a production secret. The confirm token is a process rule; this prompt is the owner's real yes (ADR 0257).",
  },
  {
    // The secrets inbox holds values a human dropped for `pnpm secrets:import` (ADR 0257). No command
    // may name it: not cat/head/grep/cp/mv/ls/find, not a `cd` into it. The importer takes file NAMES
    // (`pnpm secrets:import --list` lists them) and never prints a value, so it is safe for every caller.
    // Only path-like tokens count (grep/sed/perl/awk patterns, --title/--body/-m values and URLs are not paths);
    // globs only when rooted at home (or relative while the shell sits in home). Accident guard only.
    rx: (c, ctx) => commandReachesInbox(c, { cwd: ctx.cwd }),
    why: "Secrets guard: ~/Secrets-inbox/ (and the import confirm key) are never read, listed, copied or moved by a command. Use `pnpm secrets:import --list` for names and `pnpm secrets:import [--dry-run] [NAME]` to import; it never prints a value.",
  },
  {
    rx: (c) => runs(c, /\bencore\s+secret\s+(set|get|list\s+--values?)\b/),
    why: 'Secrets guard: `encore secret set/get` are a human\'s to run. Declare the secret with `secret("NAME")` in code and name it in your report; a human sets the value per environment (synced from Infisical).',
  },
  {
    rx: (c) => runs(c, /\bwrangler\s+secret\s+(put|bulk)\b/),
    why: "Secrets guard: `wrangler secret put/bulk` are a human's to run, same as `encore secret set`. Declare the secret and name it in your report; a human sets the value per environment.",
  },
  {
    // Reading any .env* (but not .env.example) into the transcript. The lookahead
    // accepts end-of-string so `cat .env` (no trailing space) is caught too.
    rx: /(?:^|[|;&\s])(cat|less|more|head|tail|bat|sed|awk|grep|strings)\b[^|;&\n]*\s(?:\.\/)?\.env(?:\.[A-Za-z0-9_-]+)?(?![\w-])/m,
    allow: /\.env\.example$/,
    why: "Secrets guard: there are no .env files in this repository; secrets are injected from Infisical. A token value is never read into the transcript.",
  },
  {
    rx: /(?:^|[|;&\s])(cat|less|more|head|tail|bat|sed|awk|grep)\b[^|;&\n]*\s(?:\.\/)?\.dev\.vars(?:\s|$)/m,
    why: "Secrets guard: .dev.vars (Wrangler's local secret file) holds live tokens and is never read into the transcript, same as .env.",
  },
  {
    // Creating a .env* file from the shell (redirect, tee, touch, cp/mv/ln into one).
    // Heredoc bodies are stripped first, so this only catches a shell-level write, not
    // file prose. Exempts `cp/mv .env.example <dest>.example` (propagating a template),
    // never a real .env destination.
    rx: (c) => {
      const hit =
        /(?:>|>>|\btee\b|\btouch\b|\bcp\b|\bmv\b|\bln\b)[^|;&\n]*\s(?:\.\/)?\.env(?:\.[A-Za-z0-9_-]+)?(?![\w-])/.test(
          c,
        );
      if (!hit) return false;
      // Allowed only when the SOURCE is .env.example AND the destination is .example too.
      return !/^\s*(?:cp|mv|ln)\s+(?:\.\/)?\.env\.example\s+(?:\.\/)?\S*\.example\s*$/.test(c);
    },
    why: "Secrets guard: never create a .env* file. Secrets only come from Infisical; application secrets use Encore secret().",
  },
  {
    scan: "bare",
    rx: new RegExp(CMDPOS + String.raw`(printenv|env)\s*(?:$|[|;&)\n])`),
    why: "Printing the whole environment can leak an injected token into the transcript. Echo the single variable you need, without its value if it is a secret.",
  },
  {
    rx: listsProcessEnv,
    why: "Secrets guard: `ps -E`, `ps eww` (any BSD cluster with `e`) and `launchctl procinfo` print other processes' environments, MCP tokens included. Use `ps -o pid,command` or `pgrep -fl <name>`.",
  },

  // --- Encore and deploys: the environment-touching subcommands ---------------------------------
  {
    rx: (c) => runs(c, /\bencore\s+db\s+reset\b/),
    decision: "ask",
    why: "`encore db reset` destroys the local database and re-migrates; the owner confirms it.",
  },
  {
    rx: (c) => runs(c, /\bencore\s+deploy\b/),
    why: "`encore deploy` ships to a shared environment; no agent runs it. Deploys belong to the release path.",
  },
  {
    rx: (c) => runs(c, /\bencore\s+env\s+(set|create|delete)\b/),
    decision: "ask",
    why: "`encore env set/create/delete` changes a shared environment; the owner confirms it.",
  },
  {
    rx: (c) =>
      runs(
        c,
        new RegExp(
          BARE +
            String.raw`wrangler\s+(?:[^|;&\n]*\s)?(?:deploy|rollback|delete|secret)\b|` +
            BARE +
            String.raw`wrangler\b[^|;&\n]*\s--remote\b`,
        ),
      ),
    decision: "ask",
    why: "`wrangler deploy`, `rollback`, `delete`, `secret` and `--remote` change Cloudflare with the owner's login; the owner confirms it.",
  },
  {
    rx: (c) => runs(c, new RegExp(BARE + String.raw`eas(?:\s|$)`)),
    decision: "ask",
    why: "`eas` builds, submits and updates on the owner's Expo login; the owner confirms it.",
  },
  {
    rx: (c) =>
      runs(
        c,
        new RegExp(
          BARE +
            String.raw`(?:npx|pnpx|bunx)(?:\s|$)|` +
            BARE +
            String.raw`(?:pnpm\s+(?:-\S+\s+)*dlx|npm\s+(?:-\S+\s+)*(?:exec|x))(?:\s|$)`,
        ),
      ),
    decision: "ask",
    why: "`npx`, `pnpx`, `pnpm dlx` and `npm exec` run unreviewed registry code; the owner confirms it. Use a catalog dependency with `pnpm exec <bin>`.",
  },

  // --- History, worktrees and shared local state ------------------------------------------------
  {
    rx: unsafeRmRf,
    why: "`rm -rf` is allowed only strictly inside this session's own checkout (never a linked worktree nested in it) or the scratchpad (`/tmp/claude-<uid>/`). Never /, ~, $HOME, a `$` expansion, `*`, a path outside those roots, or a relative path after an unknown `cd`.",
  },
  {
    rx: pushesMain,
    why: "Never push to main. Push your branch and open a PR; main changes only through a merged PR.",
  },
  { rx: pushRefusal, why: "" },
  {
    rx: (c) =>
      runs(c, /\bbot:git\b.*\bpush\b.*(?:\s--(?:tags|follow-tags)\b|\srefs\/tags\/|\s[^\s:]*@\d)/),
    decision: "ask",
    why: "A bot push of tags (`--tags`, `--follow-tags`, `refs/tags/*`, `<package>@x`) publishes a release marker no ruleset protects; the owner confirms it.",
  },
  {
    rx: discardsOutsideOwn,
    why: "This discards uncommitted work (`reset --hard`, `checkout`/`restore .`, `checkout -f`, `switch --discard-changes`, `clean -f`). It runs only in this session's own worktree, never in the main checkout or another agent's worktree. Name the paths, or make a WIP commit first. `git clean -n` previews anywhere.",
  },
  {
    rx: removesOtherWorktree,
    why: "`git worktree remove --force` deletes uncommitted work. It is allowed only on this session's own worktree; another worktree belongs to another agent or the owner. Use `git worktree remove <path>` (it refuses when dirty).",
  },
  { rx: stashRefusal, why: "" },
  // STA-208: agents never act with the owner's GitHub login (ADR 0230 rule 5). Accident guard: same macOS user.
  {
    rx: botMerges,
    why: "Agents merge only through `pnpm pr:merge <n>` (ADR 0119, ADR 0230), which checks the gate and the reviewer's verdict. `pnpm bot:gh -- pr merge`, `api …/pulls/<n>/merge` and the GraphQL merge and enqueue mutations are denied.",
  },
  {
    // STA-214: pack plumbing pushes or fetches without the push-to-main check; no agent needs it.
    // The binary by path (`/usr/lib/git-core/git-send-pack`) is the same plumbing as `git send-pack`.
    rx: (c) =>
      runs(c, new RegExp(GIT + String.raw`(?:send|receive|fetch|upload)-pack\b`)) ||
      runs(c, new RegExp(BARE + String.raw`git-(?:send|receive|fetch|upload)-pack\b`)),
    why: "`git send-pack`, `receive-pack`, `fetch-pack` and `upload-pack` (and the `git-*-pack` binaries) are pack plumbing that bypasses the push guard. Use `pnpm bot:git -- push origin HEAD` or `pnpm bot:git -- fetch origin`.",
  },
  {
    // STA-216: a config alias runs any git command (`-c alias.x=credential x fill`, `-c alias.p=push p origin main`);
    // an included config file or GIT_CONFIG_* env can define one too. Also `git config alias.x …` writes, the
    // config-file env (`GIT_CONFIG_GLOBAL`, `HOME=`, `XDG_CONFIG_HOME=`) and a pager other than cat or less.
    rx: (c) =>
      scanTexts(c).some(
        (d) =>
          /\b(?:git|man)\b/.test(d) &&
          (/(?:^|\s)(?:GIT_EDITOR|GIT_SEQUENCE_EDITOR)=(?!(?:true|:|cat)(?:\s|$))|(?:^|\s)(?:MANPAGER|PAGER|GIT_PAGER)=(?!(?:cat|less)(?:\s|$))|(?:^|\s)(?:--config-env\b|(?:GIT_CONFIG(?:_GLOBAL|_SYSTEM|_COUNT|_KEY_\d+|_PARAMETERS)?|HOME|XDG_CONFIG_HOME|GIT_ASKPASS|SSH_ASKPASS|GIT_EXEC_PATH|GIT_SSH(?:_COMMAND)?|GIT_PROXY_COMMAND|GIT_EXTERNAL_DIFF|GIT_TEMPLATE_DIR)=)/i.test(
            d,
          ) ||
            gitConfigUnsafe(d)),
      ),
    why: "git `-c` outside a short display/identity allow-list, any `git config` that is not a read or a local write of an allowed key, `--config-env`, and the `GIT_CONFIG*`, `HOME=`, `XDG_CONFIG_HOME=`, `GIT_ASKPASS=`, `SSH_ASKPASS=`, `GIT_EXEC_PATH=`, `GIT_SSH[_COMMAND]=` and `GIT_PROXY_COMMAND=` prefixes (and a pager other than `cat` or `less`) make git run another command, redefine a remote or alias past the push and credential guards. For an editor, `GIT_EDITOR=true` is already set in .claude/settings.json `env`.",
  },
  {
    // `man -P <cmd>` and `--pager=<cmd>` run <cmd>; plain `man git-credential` stays allowed.
    rx: (c) =>
      scanTexts(c).some((d) =>
        /\bman\b[^|;&\n]*\s-(?:[a-zA-Z]*[PHBTC]\b|-(?:pager|html|browser|troff|ditroff|config-file))/.test(
          d,
        ),
      ),
    why: "`man -P`, `-H`, `-B`, `-T`, `-C` and their long forms (`--pager`, `--html`, ...) run an arbitrary command. Read the page with plain `man <page>`.",
  },
  {
    // STA-216: a GraphQL document read from a file or a substitution cannot be checked for a merge mutation;
    // `gh alias` rewrites the owner's gh config. tools/scripts/bot-gh.mjs denies both as well.
    rx: (c) =>
      [dropMessages(c), ...runnable(c)].some((t) =>
        segments(t).some(
          (s) =>
            /\bbot:gh\b/.test(blank(s)) &&
            (/\balias\s+(?:set|import|delete)\b/.test(s) ||
              (/\bapi\s+(?:-\S+\s+)*graphql\b/.test(s) && /=@|--input\b|\$\(|`/.test(s))),
        ),
      ),
    why: "`pnpm bot:gh -- api graphql` with the query from a file (`-F query=@f`, `--input`) or a substitution, and `gh alias set`, are denied: the query cannot be checked for a merge mutation. Inline the query, or merge with `pnpm pr:merge <n>`.",
  },
  {
    // STA-291: a shell reading a pipe or a file written earlier from text the guard cannot read.
    rx: runsOpaque,
    decision: "ask",
    lookThrough: false, // _inbox reads `pnpm exec sh` itself; a script name is not a command
    why: "A shell runs text the guard cannot read (`curl … | sh`, `cat x | sh`, `cmd > f; sh f`); a human confirms it. Run the commands directly instead.",
  },
  {
    rx: (c) => runs(c, BARE_GH),
    why: "Agents never run `gh` on the owner's login, in any form (`pnpm gh`, `pnpm exec gh` and a `GH_TOKEN=` prefix included: an empty token falls back to the owner). Use `pnpm bot:gh -- <args>` (builder, stackra-bot; `-R figentra/os` for the OS repo), `pnpm bot:review -- <args>` (reviewer) or `pnpm pr:merge <n>`; in a pipe, `pnpm --silent bot:gh -- <args> | …`.",
  },
  {
    rx: (c) => runs(c, NETWORK_GIT),
    why: "Agents never run network git (push, fetch, pull, clone, ls-remote, submodule, subtree, remote update, archive --remote) on the owner's credential helper. Run it as the bot: `pnpm bot:git -- push origin HEAD`, `pnpm bot:git -- fetch origin`; another repo: `pnpm bot:git -- -C <dir> …`.",
  },
  {
    // The token belongs in the wrapper's child environment only, never in the transcript or in gh's config.
    rx: (c) =>
      runnable(c).some((t) => /\bbot:token\b/.test(t)) ||
      /\$\{?(?:GH_TOKEN|GITHUB_TOKEN)\b/.test(scanShell(dropMessages(c)).literal) ||
      runs(c, /(?:^|\s)(?:\S*\/)?(?:node|bun|deno|tsx)\b[^|;&\n]*(?:\s|\/)bot-token\.mjs\b/) ||
      runs(
        c,
        new RegExp(
          String.raw`\bbot:(?:gh|review)\s+(?:--\s+)?auth\b|\bbot:git\s+(?:--\s+)?(?:\S+\s+)*?credential\b|` +
            // STA-214: `git credential fill` and `git credential-<helper> get` answer with the owner's token.
            // `man git-credential` and similar read-only help is not a credential call (STA-216).
            String.raw`(?<!\b(?:man|help|which|whereis|type)\s+(?:-\S+\s+)*)\bgit(?:-|\s+(?:--\s+)?` +
            GIT_OPTS +
            String.raw`)credential\b`,
        ),
      ),
    why: "A token is never printed, read or handed to `gh auth`: `pnpm bot:token`, running `bot-token.mjs`, `$GH_TOKEN`, `bot:gh -- auth …`, and `git credential …` or `git credential-<helper> …` (bare or through `bot:git`) are denied. Use `pnpm bot:gh -- <args>`, which keeps the token in its child process.",
  },
  // ADR 0230: an agent never speaks for the owner, and only the reviewer identity posts verdicts. A tripwire, not
  // the control: pr-merge checks the verdict's author.
  {
    rx: writesOwnerApproval,
    why: "`owner-approval` / `owner-approved` record the owner's own decision; an agent never adds the label or submits an approving review that ends in the token. Ask the owner.",
  },
  {
    rx: /(?:^|[\s;&|(:])gh\s+(?:--\s+)?(?:pr\s+(?:comment|review)|api)\b[^\n]*\bAI-REVIEW:/i,
    why: "AI-REVIEW verdicts are posted only by the reviewer identity: `pnpm bot:review -- pr comment <n> --body-file <f>`, from a reviewer agent, never on the reviewer's own work.",
  },
  {
    rx: (c, ctx) => runs(c, BOT_REVIEW) && !REVIEWER_AGENTS.has(ctx.agentType),
    why: "`pnpm bot:review` posts as the reviewer identity, so only a reviewer agent runs it (the agents whose source sets `reviewer: true`, ADR 0230). A builder or the lead asks a reviewer agent for the verdict. Tripwire until the CI reviewer posts verdicts.",
  },
  {
    rx: (c) => runs(c, new RegExp(GIT + String.raw`tag\s+(-a\s+)?\S+@\d`)),
    why: "Release tags (`<package>@x.y.z`) are created by CI from a merged version PR, never by hand.",
  },

  // --- Database / release process ---------------------------------------------------------------
  {
    rx: (c) => runs(c, /\bDROP\s+(DATABASE|SCHEMA)\b/i),
    why: "Dropping a database is a human decision. `encore db reset <service>` resets a local one, with the owner's yes.",
  },
  {
    rx: (c) => runs(c, /\b(drizzle-kit|mikro-orm)\s+(push|migrate|migration:up|schema:update)\b/),
    why: "Encore applies migrations when the app runs. Write `<n>_<name>.up.sql` by hand, then `encore run`; never push directly to a database.",
  },
  {
    rx: (c) => runs(c, /\bchangeset(\s+|:)version\b/),
    why: "`changeset version` runs in CI (the Release workflow's version PR). Locally, add a changeset with `pnpm changeset`; the version bump is the version PR's job.",
  },
];

/** A text and its runner-free form, once each. */
const forms = (t) => [...new Set([t, lookThroughRunners(t)])];

/** The evaluation context: the shell's directory, the subagent type, and the session's own checkout (lazy). */
function context(cwd, agentType) {
  let own;
  return { cwd, agentType, own: () => (own ??= ownCheckout(cwd)) };
}

/**
 * The tier for a shell command: `{ decision: "allow" | "ask" | "deny", reason }`. Every rule runs on the command
 * and on its runner-free form (`lookThroughRunners`); any deny wins over any ask. Safety net (STA-254): deny rules
 * also run on every substitution body found with quotes ignored.
 * @param {string} raw the command as the agent wrote it
 * @param {{ cwd?: string, agentType?: string }} [options] the shell's directory and the subagent type (`agent_type`)
 */
export function decideBash(raw, { cwd = process.cwd(), agentType = "" } = {}) {
  const cmd = stripHeredocs(raw);
  const ctx = context(cwd, agentType);
  const check = (rule, text) => {
    const target = rule.scan === "bare" ? blank(text) : text;
    const hit = typeof rule.rx === "function" ? rule.rx(target, ctx) : rule.rx.test(target);
    if (!hit || (rule.allow && rule.allow.test(target))) return null;
    return typeof hit === "string" ? hit : rule.why;
  };
  let asked = null;
  for (const rule of RULES)
    for (const text of rule.lookThrough === false ? [cmd] : forms(cmd)) {
      const why = check(rule, text);
      if (why && rule.decision !== "ask") return { decision: "deny", reason: why };
      if (why) asked ??= why;
    }
  for (const body of rawSubstitutions(cmd))
    for (const text of forms(body))
      for (const rule of RULES) {
        if (rule.lookThrough === false && text !== body) continue;
        const why = rule.decision === "ask" ? null : check(rule, text);
        if (why) return { decision: "deny", reason: why };
      }
  return asked ? { decision: "ask", reason: asked } : { decision: "allow", reason: "" };
}

// ---- paths -------------------------------------------------------------------------------------------------

/** Files that hold secret values: never read, by any tool. `.env.example` and Infisical's project config are not. */
const SECRET_FILE = [
  /(^|\/)\.env(\.[^/]*)?$/i,
  /(^|\/)\.dev\.vars$/i,
  /(^|\/)\.(?:ci-env|sentryclirc)$/i,
  /(^|\/)[^/]*\.secrets[^/]*$/i,
  /\.(?:pem|key)$/i,
  /(^|\/)\.infisical([^/]*$|\/)/,
];
const SECRET_OK = /(^|\/)(\.env\.example|\.infisical\.(yaml|json))$/;
/** True when `p` names a file that holds secret values (ADR 0173). */
export function isSecretPath(p) {
  const s = p.trim().replace(/^['"]+|['"]+$/g, "");
  return !SECRET_OK.test(s) && SECRET_FILE.some((r) => r.test(s));
}

const INBOX_WHY =
  "Secrets guard: ~/Secrets-inbox/ holds secret values; no agent reads, searches, lists or writes it. Use `pnpm secrets:import --list` (names) and `pnpm secrets:import` (import, never prints a value).";

/**
 * Read tools (Read, Grep, Glob; OpenCode read, glob, grep): the secrets inbox (ADR 0257), searched recursively
 * when `recursive`, and secret files are denied; every other read is allowed.
 */
export function decideRead(path, { cwd, recursive = false } = {}) {
  if (reachesInbox(path, { recursive, cwd })) return { decision: "deny", reason: INBOX_WHY };
  if (isSecretPath(path))
    return {
      decision: "deny",
      reason: `Secrets guard: ${path} holds secret values and is never read by an agent (ADR 0173). Names only; values are set by a human.`,
    };
  return { decision: "allow", reason: "" };
}

/** Paths a tool other than the agent owns: secret files, generated output, lockfiles, changelogs, projections. */
const WRITE_RULES = [
  {
    rx: /(^|\/)\.env([./][^/]*)?$/i,
    why: "Secrets guard: .env* files are never written by an agent. Secrets only come from Infisical (developer tokens via the vault); application secrets use Encore secret().",
  },
  {
    rx: /(^|\/)(\.dev\.vars|\.ci-env|\.sentryclirc)$/i,
    why: "Secrets guard: .dev.vars (Wrangler), .ci-env and .sentryclirc hold live tokens and are never written by an agent. A human creates them from Infisical.",
  },
  {
    rx: /(^|\/)(\.secrets\.local\.[^/]+|secrets?\.(json|ya?ml|env|cue)|credentials?\.json|id_(rsa|ed25519)|[^/]+\.(pem|p12|pfx|key))$/i,
    why: "Secrets guard: files with secret-like names are never written by an agent. A human creates them.",
  },
  {
    rx: /(^|\/)pnpm-lock\.yaml$/i,
    why: "pnpm-lock.yaml is written by pnpm. Run `pnpm install` / `pnpm add` instead of editing it.",
  },
  {
    rx: /(^|\/)CHANGELOG\.md$/i,
    why: "CHANGELOG.md is written by Changesets (`pnpm changeset`, then the release job runs `changeset version`). Never hand-edit it.",
  },
  {
    rx: /(^|\/)dist\//i,
    why: "dist/ is build output. Change the source and rebuild.",
  },
  {
    // Encore's generated clients (`~encore/*`) and runtime glue are regenerated by the CLI.
    rx: /(^|\/)(encore\.gen|\.encore)\//i,
    why: "encore.gen/ and .encore/ are generated by the Encore CLI (the `~encore/*` clients resolve from here). Change the source that produces them and re-run `encore run`; never hand-edit generated output.",
  },
  {
    rx: /(^|\/)apps\/mobile\/(ios|android)\//i,
    why: "apps/mobile/ios and android are generated by `expo prebuild`. Change app.json or a config plugin instead.",
  },
  {
    rx: /(^|\/)uniwind-types\.d\.ts$/i,
    why: "uniwind-types.d.ts is generated by Uniwind. Never hand-edit it.",
  },
  {
    // agents-sync projects .agents/agents/** into these; edit the source, not the projection.
    rx: /(^|\/)(\.claude|\.opencode)\/agents\//i,
    why: ".claude/agents and .opencode/agents are generated by agents-sync. Edit the source in .agents/agents and run `pnpm agents:sync`.",
  },
  {
    rx: /(^|\/)\.agents\/hooks\/_reviewer-agents\.mjs$/i,
    why: ".agents/hooks/_reviewer-agents.mjs is generated by agents-sync from the `reviewer: true` agent sources. Edit .agents/agents and run `pnpm agents:sync`.",
  },
  {
    rx: /(^|\/)\.mcp\.json$/i,
    why: ".mcp.json is generated by agents-sync from .mcp.yaml. Edit .mcp.yaml and run `pnpm agents:sync`.",
  },
];

/** Write tools (Write, Edit, MultiEdit, NotebookEdit; OpenCode edit): the inbox, then `WRITE_RULES`. */
export function decideWrite(path, { cwd } = {}) {
  if (reachesInbox(path, { cwd })) return { decision: "deny", reason: INBOX_WHY };
  const rule = WRITE_RULES.find((r) => r.rx.test(path));
  return rule ? { decision: "deny", reason: rule.why } : { decision: "allow", reason: "" };
}
