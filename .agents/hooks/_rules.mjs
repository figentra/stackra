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
import { readdirSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join, resolve, sep } from "node:path";
import {
  cached,
  clearCaches,
  memoTable,
  WRAPPERS,
  WRAPPER_VALUE,
  XARGS_VALUE,
  commandAt,
  commandReachesInbox,
  gitRunsProgram,
  rawSubstitutions,
  reachesInbox,
  scanShell,
  scriptStrings,
  simpleCommands,
  runsOpaque,
  stripHeredocs,
} from "./_inbox.mjs";
import { REVIEWER_AGENTS } from "./_reviewer-agents.mjs";

/** The home directory, read once: `homedir()` is a system call, and every word is checked against it. */
const HOME_DIR = homedir();

/** The only `-c` keys an agent may set: display, identity and rerere; none runs a command or redirects a remote. */
const ALLOWED_C =
  /^(?:color\.ui|color\.diff|color\.status|color\.branch|core\.quotepath|core\.abbrev|core\.precomposeunicode|user\.name|user\.email|advice\.detachedhead|diff\.renames|diff\.algorithm|diff\.context|diff\.noprefix|log\.abbrevcommit|log\.decorate|log\.date|merge\.ff|merge\.conflictstyle|pull\.rebase|pull\.ff|push\.default|rebase\.autosquash|init\.defaultbranch|column\.ui|status\.short|status\.branch|status\.showuntrackedfiles|rerere\.enabled)$/i;
/** `-c key=value` pairs that are safe only with this value: a no-op editor, signing off. */
const SAFE_C_VALUE =
  /^(?:(?:core|sequence)\.editor=(?:true|:|cat)|(?:commit|tag)\.gpgsign=false)$/i;
const allowedC = (kv) => ALLOWED_C.test(kv.split("=")[0]) || SAFE_C_VALUE.test(kv);
/** `git config` modes that only read; the first option after the scope must be one of them. */
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
/** `git config` options before the mode that only pick a scope or an output format; `-f` / `--file` take a value. */
const CONFIG_SCOPE =
  /^(?:--(?:local|global|system|worktree|show-origin|show-scope|includes|no-includes|null|name-only|bool|int|path|(?:file|blob|type|default)=\S*)|-z)$/;
const CONFIG_SCOPE_VALUE = new Set(["-f", "--file", "--blob", "--type", "--default"]);
/**
 * True when `git config` words are neither a read (past the scope options: a read mode, or one key alone,
 * `git config --global user.name`; no write flag anywhere) nor a local write of one allowed key
 * (`git config [--local] rerere.enabled true`).
 */
function configWrites(words) {
  let i = 0;
  let shared = false; // a scope other than the repository's own config: --global, --system, --worktree, a file
  for (; i < words.length; i++) {
    const w = words[i];
    if (CONFIG_SCOPE_VALUE.has(w)) shared ||= ["-f", "--file", "--blob"].includes(words[i++]);
    else if (CONFIG_SCOPE.test(w)) shared ||= /^--(?:global|system|worktree|file=|blob=)/.test(w);
    else break;
  }
  const rest = words.slice(i);
  if (rest.some((w) => CONFIG_WRITE.has(w))) return true;
  if (CONFIG_READ.has(rest[0]) || (rest.length === 1 && !rest[0].startsWith("-"))) return false;
  return !(rest.length === 2 && ALLOWED_C.test(rest[0]) && !shared);
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
      if (t.groups.v !== undefined && !allowedC(unquote(t.groups.v))) return true;
    const rest = d.slice(m.index + m[0].length);
    if (/^config\b/.test(rest) && configWrites(configWords(rest.slice(6)))) return true;
  }
  return false;
}
/** An option value: one word, quoted parts allowed (`"a b"c`); one parse only, so a failed match never backtracks. */
const Q = String.raw`(?:"[^"]*"|'[^']*'|[^\s"'])\S*`;
/** git's global options before the subcommand (STA-216: quoted values, the boolean options). */
const GIT_OPTS = String.raw`(?:(?:-[Cc]\s+(?:${Q})|--(?:git-dir|work-tree|namespace)(?:=(?:${Q})|\s+(?:${Q}))|--exec-path(?:=\S+)?|--(?:no-pager|paginate|bare|literal-pathspecs|no-replace-objects|glob-pathspecs|noglob-pathspecs|icase-pathspecs|no-optional-locks)|-[pP])\s+)*`;
/** `git` (or `pnpm bot:git --`) followed by any global options before the subcommand. */
const GIT = String.raw`\bgit\s+(?:--\s+)?` + GIT_OPTS;

/** Words that run the command after them, and the shell keywords that open a command. */
const LEAD_WORDS = new Set([...WRAPPERS, "xargs", "caffeinate", "watch", "script", "arch"]);
const KEYWORDS = new Set([
  "if",
  "elif",
  "while",
  "until",
  "then",
  "do",
  "else",
  "!",
  "{",
  "coproc",
]);
/** Wrapper options whose value is the next word (`sudo -u x`, `nice -n 5`, `xargs -I {}`, `arch -arch x`). */
const VALUE_FLAGS = new Set([...WRAPPER_VALUE, ...XARGS_VALUE, "-arch"]);
/**
 * Indexes of the words of a simple command that may be its command name, by one linear walk (STA-330 review: the
 * old nested regex backtracked exponentially): past assignments, keywords and wrappers with their options,
 * durations and option values (`timeout 5`, `nice -n 5`, `sudo -u x`, `env -i A=1`, `script -q <file>`). A word a
 * wrapper option may have taken as its value is tried as the name too (`sudo -s gh` runs gh), so no reading of
 * the words is missed. `command -v x` only looks a name up.
 */
function nameIndexes(words) {
  const out = [];
  let wrapped = false;
  let value = false; // the word may be the value of the option before it
  let file = false; // `script`'s file operand, before its command
  for (let k = 0; k < words.length; k++) {
    const w = words[k];
    const b = w.split("/").pop();
    out.push(k);
    if (b === "command" && /^-[a-zA-Z]*[vV]/.test(words[k + 1] ?? "")) break;
    if (KEYWORDS.has(w) || /^\w+=/.test(w)) continue;
    if (LEAD_WORDS.has(b)) {
      [wrapped, value, file] = [true, false, b === "script"];
    } else if (wrapped && w.startsWith("-")) value = VALUE_FLAGS.has(w);
    else if (wrapped && /^\d+(?:\.\d+)?[smhd]?$/.test(w)) value = false;
    else if (wrapped && value) value = false;
    else if (wrapped && file) file = false;
    else break;
  }
  return out;
}
const namesCache = memoTable();
/** Offsets in `t` where a command name may start, over every simple command (`nameIndexes`); memoised. */
const nameOffsets = (t) =>
  cached(namesCache, t, () =>
    simpleCommands(t).flatMap((s) => nameIndexes(s.words).map((k) => s.at[k])),
  );
/**
 * A test that a command of a text, from its name on, matches `tail` (a path before the name allowed). Wrappers
 * and keywords are walked by `nameIndexes`; runners (`pnpm exec`, `npx`) are dropped by `lookThroughRunners`.
 */
const atName = (tail) => {
  const rx = new RegExp(String.raw`(?:[^\s;&|()<>]*/)?(?:${tail})`, "y");
  return (t) =>
    nameOffsets(t).some((i) => {
      rx.lastIndex = i;
      return rx.test(t);
    });
};
/** The end of a command name: a space, an operator or the end. */
const END = String.raw`(?=[\s;&|()<>]|$)`;

/**
 * Owner-login guard (STA-208, ADR 0230 rule 5): `gh` and `git` as a command name run with the owner's `gh auth`
 * login and git credential helper. Agents use the bot wrappers instead, which fail closed when no token can be
 * minted.
 */
const BARE_GH = atName("gh" + END);
/**
 * Every git subcommand that talks to a remote. All of them go through `pnpm bot:git`, public repos included.
 * `submodule status` and `submodule summary` read only the local checkout.
 */
const NETWORK_GIT = atName(
  String.raw`git\s+${GIT_OPTS}(?:push|fetch|pull|clone|ls-remote|submodule(?!\s+(?:status|summary)\b)|subtree|remote\s+(?:update|show|prune)|archive\s+[^|;&\n]*--remote)\b`,
);

/** A character of a word that is not a separator, redirection, group or backtick. */
const W = String.raw`[^\s|;&()<>\x60]`;
/**
 * Runners that run the command after them, like `sudo` or `env`: `pnpm [global options] [exec|dlx] <bin>` (pnpm
 * runs any binary on PATH when no script has the name), `npm exec`, `yarn`, `npx`, `pnpx`, `bunx` and
 * `mise exec … --`. `lookThroughRunners` drops them at command position, so `pnpm gh pr merge` is checked as
 * `gh pr merge`. shortcut: options that take a value are known only for pnpm (`-C`, `-F`, `--filter`, `--dir`);
 * `npx -p pkg cmd` is read as `pkg cmd` (npx asks anyway). Upgrade when a runner option hides a command.
 * `mise exec` ends at its own first `--`, never at the command's (`mise exec -- rm -rf -- /`, STA-330 review).
 */
const RUNNER = String.raw`(?:(?:${W}*\/)?(?:pnpm|npm|yarn)\s+(?:(?:-[CF]|--(?:filter|dir|prefix|workspace|cwd))(?:=|\s+)${W}+\s+|--?[\w-]+(?:=${W}+)?\s+)*(?:(?:exec|dlx|x)\s+(?:-${W}+\s+)*)?|(?:${W}*\/)?(?:npx|pnpx|bunx)\s+(?:-${W}+\s+)*|(?:${W}*\/)?mise\s+(?:exec|x)\s+(?:(?!--\s)[^|;&\n]*?\s)?--\s+)`;
/**
 * A runner at command position: a lookbehind, so a match starts only at a command's first word, and words that stop
 * at a separator (`W`, a `$(…)` or a backtick in an assignment), so no match scans past its own command: a run of
 * separators or blank lines stays linear (STA-330 review).
 */
const RUNNERS = new RegExp(
  String.raw`(?=[\w./])(?<=(?:^|[|;&(\n\x60])\s*)((?:\w+=(?:${W}|\$\([^()]*\)|\x60[^\x60]*\x60)*\s+)*)(?:${RUNNER})+`,
  "g",
);
/** `c` with every runner prefix at command position removed (`pnpm exec infisical run` → `infisical run`). */
export const lookThroughRunners = (c) => c.replace(RUNNERS, "$1");

/** The text of every `$(…)` / backtick body at any depth (single quotes stay literal) and `sh -c` / `eval` string. */
const nestedCache = memoTable();
const nestedRaw = (c) =>
  cached(nestedCache, c, () =>
    nesting(() => {
      const out = scanShell(c).bodies.flatMap((b) => [b, ...nestedRaw(b)]);
      for (const s of scriptStrings(c)) out.push(s, ...nestedRaw(s));
      return out;
    }),
  );
/**
 * Script strings nest at most this deep (`sh -c "eval '…'"`): each level is a new text to scan, and a chain like
 * `eval x eval x …` peels one level per two words, which made a decision quadratic (STA-330 review).
 */
const MAX_SCRIPTS = 8;
let scriptDepth = 0;
let tooDeep = false;
/** `f()` one script level deeper; past `MAX_SCRIPTS` it reads nothing and the decision denies (`TOO_DEEP`). */
function nesting(f) {
  if (scriptDepth >= MAX_SCRIPTS) {
    tooDeep = true;
    return [];
  }
  scriptDepth++;
  try {
    return f();
  } finally {
    scriptDepth--;
  }
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
const runnableCache = memoTable();
/**
 * The text a shell runs: the quote-blanked command (prose in `--body "…"` is ignored), plus every `$(…)` and
 * backtick body at any depth, inside double quotes too (`scanShell`, STA-254), and every `sh -c` / `eval` string.
 * Single-quoted text stays literal. Function, alias and piped or written-then-run script text come from
 * `scriptStrings` (STA-291); deliberate workarounds stay open. Memoised: every rule reads the same texts.
 */
const runnable = (c) =>
  cached(runnableCache, c, () =>
    nesting(() => {
      const { blanked, bodies } = scanShell(c);
      const out = [blanked, ...bodies.flatMap(runnable)];
      for (const s of scriptStrings(c)) out.push(...runnable(s));
      return out;
    }),
  );
/** True when any runnable text has a segment matching `rx`, or passes `rx` when it is a test (`atName`). */
const runs = (c, rx) =>
  runnable(c).some((t) => (typeof rx === "function" ? rx(t) : segments(t).some((s) => rx.test(s))));

/**
 * At most this many git processes run for one decision (about 20 ms each; the hook is killed, and fails open, at
 * 5 s). Past it `git` answers "" (an unknown checkout, which every rule reads deny-leaning) and the decision denies
 * (`TOO_MANY_GIT`; STA-330 review).
 */
const MAX_GIT = 48;
let gitRuns = 0;
/** `git` output in `cwd`, or "" when git fails; memoised for one decision. */
const gitCache = memoTable();
const git = (cwd, ...args) =>
  cached(gitCache, JSON.stringify([cwd, args]), () => {
    if (++gitRuns > MAX_GIT) return "";
    const r = spawnSync("git", args, { cwd, encoding: "utf8" });
    return r.status === 0 ? r.stdout.trim() : "";
  });

/** Quoted strings blanked, so a word inside `node -e '...'` or `--body "..."` is not mistaken for a command. */
const blank = (c) => scanShell(c).blanked;

/** Command segments: split on separators outside quotes (a `;` inside `-c "a;b"` does not hide a push). */
const segmentCache = memoTable();
const segments = (c) => cached(segmentCache, c, () => splitSegments(c));
function splitSegments(c) {
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
    } else if (/[|;\n]/.test(ch) || (ch === "&" && !/[<>]/.test(c[i - 1]) && c[i + 1] !== ">")) {
      out.push(cur);
      cur = "";
    } else cur += ch; // `2>&1`, `>&2` and `&>f` are redirections, not separators
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
const messageCache = memoTable();
const dropMessages = (c) =>
  cached(messageCache, c, () => {
    const { spans, source } = scanShell(c);
    return spans
      .filter(([start]) => PROSE_BEFORE.test(source.slice(Math.max(0, start - 300), start)))
      .reduceRight((t, [start, end]) => t.slice(0, start) + "MSG" + t.slice(end), source);
  });

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

/** The branch a push refspec writes to: `+src:refs/heads/dst` (or `heads/dst`) → `dst`. */
const refspecDest = (r) =>
  r
    .replace(/^\+/, "")
    .split(":")
    .pop()
    .replace(/^(?:refs\/)?heads\//, "");

/** `~` and `$HOME` expanded; any other `$` or backtick, or an empty (blanked) word, makes the path unknown (null). */
const expandHome = (p) => {
  const e = unquote(p).replace(/^(?:~|\$HOME|\$\{HOME\})(?=\/|$)/, HOME_DIR);
  return e === "" || /[$`]/.test(e) ? null : e;
};

/**
 * `p` with its existing ancestors resolved through symlinks (`/tmp` → `/private/tmp`); the rest kept as written.
 * Memoised, the result as its own key too, so a deep path walked one segment at a time (`physical`) stays linear.
 */
const realCache = memoTable();
function realDir(p) {
  return cached(realCache, p, () => {
    let out;
    try {
      out = realpathSync(p);
    } catch {
      const up = dirname(p);
      out = up === p ? p : join(realDir(up), basename(p));
    }
    realCache.set(out, out);
    return out;
  });
}

/** The directory a `cd` / `pushd` operand moves `dir` to; null when unknown (`$X`, `-`, an unknown base). */
function moveTo(dir, to) {
  if (to === undefined) return HOME_DIR;
  if (to === "-") return null;
  const e = expandHome(to);
  if (e === null) return null;
  if (e.startsWith("/")) return e;
  return dir === null ? null : resolve(dir, e);
}
/** A `cd` buried in a word (`$(cd x)`, `sh -c "cd x"`, `then cd x`): the directory after it is unknown. */
const NESTED_CD = /(?:^|[\s;&|(`'"])(?:cd|pushd)\s/;
/** At most this many possible directories are followed; past it the directory is unknown. */
const MAX_DIRS = 16;
const union = (a, b) => {
  const u = [...new Set([...a, ...b])];
  return u.length > MAX_DIRS ? [null] : u;
};
/**
 * The simple commands of `text` in order (`simpleCommands`), each with its own text (`src`) and every directory it
 * may run in (`dirs`, null when unknown; STA-330 review). `cd` / `pushd` are followed: a command right after
 * `cd x &&` runs in x; after `cd x;` or `cd x ||` in x, or where it was when the `cd` failed. A `( … )` subshell's
 * `cd` ends at its `)`. A `cd` in a pipeline or in the background, `popd`, `env -C` / `--chdir`, and a `cd` nested
 * in a word make the directory unknown.
 */
function walk(text, cwd) {
  const out = [];
  const saved = [];
  let dirs = [cwd];
  let back = null; // the directories if a `cd` earlier in this `&&` chain failed
  let prev = "";
  let start = 0;
  for (const s of simpleCommands(text, { all: true })) {
    const src = text.slice(start, s.end - s.op.length);
    const from = start;
    start = s.end;
    const words = s.words[0] === "{" ? s.words.slice(1) : s.words;
    if (words[0] === "cd" || words[0] === "pushd") {
      const to = words.slice(1).find((w) => w !== "--" && !/^-[LPe@]+$/.test(w));
      const forked = prev === "|" || s.op === "|" || s.op === "&";
      const moved = forked ? [null] : dirs.map((d) => moveTo(d, to));
      if (s.op === "&&" && !forked && prev !== "||") {
        back ??= dirs;
        dirs = moved;
      } else dirs = union(dirs, moved);
    } else if (words[0] === "popd") dirs = [null];
    else if (words.length) {
      if (NESTED_CD.test(src)) dirs = [null];
      const env = words.some((w) => ["env", "sudo"].includes(w.split("/").pop()));
      const chdir = words.some((w) => /^--chdir\b/.test(w) || (env && /^-[a-zA-Z]*[CD]/.test(w)));
      const at = s.at.map((i) => i - from); // word offsets in `src`
      out.push({ src, words: s.words, at, dirs: chdir ? [null] : dirs });
    }
    if (s.op === "(") {
      saved.push([dirs, back]);
      back = null;
    } else if (s.op === ")") [dirs, back] = saved.pop() ?? [[null], null];
    else if (s.op !== "&&" && back) {
      dirs = union(dirs, back);
      back = null;
    }
    prev = s.op;
  }
  return out;
}
/**
 * The arguments that follow a command word, as the shell passes them: quotes removed, redirections dropped
 * (`--hard>/dev/null`, `<<<x`, `2>&1`, `&>f`), stopping at a separator or a `)` / `}` that closes a group.
 */
const argWords = (tail) => simpleCommands(tail)[0]?.words.filter((w) => w !== "}") ?? [];
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
 * Every git command in `text` (`walk`: separators, groups and `cd` followed) with the checkout it runs in, once per
 * directory it may run in: `args` (`argWords`), and `run(...args)`, which runs git with the location options
 * replayed (`-C`, `--git-dir`, `--work-tree`, `--bare`, and `GIT_DIR=` / `GIT_WORK_TREE=` anywhere) and returns ""
 * when it fails or the checkout is unknown.
 */
const gitCommands = (text, cwd) =>
  cached(gitCommandCache, `${cwd}\0${text}`, () => readGitCommands(text, cwd));
/** Seven rules read the same git commands. */
const gitCommandCache = memoTable();
function readGitCommands(text, cwd) {
  const out = [];
  const env = [...text.matchAll(new RegExp(String.raw`\bGIT_(DIR|WORK_TREE)=(${Q})`, "g"))].map(
    ([, k, v]) => [k === "DIR" ? "--git-dir" : "--work-tree", expandHome(v)],
  );
  for (const { src, words, at, dirs } of walk(text, cwd)) {
    if (READER_SEGMENT.test(src)) continue;
    let next = 0; // the word the next match's subcommand starts, when it is a word of this command
    // Every `git` word outside quotes (a path like `GIT_DIR=x/.git git …` holds two); quoted text is prose here,
    // and the commands nested in it are scanned as their own texts.
    const quoted = scanShell(src).spans;
    for (const m of src.matchAll(GIT_WORD)) {
      if (quoted.some(([a, b]) => m.index >= a && m.index < b)) continue;
      let where = [];
      for (const [opt, v] of env)
        where = v === null || where === null ? null : [...where, `${opt}=${v}`];
      for (const { groups: g } of m[1].matchAll(TARGET_TOKENS)) {
        if (where === null) break;
        if (g.bare) where.push("--bare");
        if (!g.opt) continue;
        const v = expandHome(g.value);
        if (v === null) where = null;
        else where.push(...(g.opt === "-C" ? ["-C", v] : [`${g.opt}=${v}`]));
      }
      const target = where;
      const subAt = m.index + m[0].length;
      while (next < at.length && at[next] < subAt) next++;
      // A subcommand that is a word of this command takes the words after it; one inside a substitution or a
      // quoted script is tokenised from its own text.
      const args =
        at[next] === subAt && words[next].startsWith(m[2])
          ? words.slice(next + 1)
          : argWords(src.slice(subAt + m[2].length));
      const bot = /\bbot:git\b|\bbot-gh\.mjs\s+git\b/.test(src);
      const gitDir = target === null || target.some((w) => /^--(?:git-dir|bare)\b/.test(w));
      for (const dir of dirs)
        out.push({
          sub: m[2],
          args,
          bot,
          gitDir,
          run: (...a) => (dir === null || target === null ? "" : git(dir, ...target, ...a)),
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
  const [top, ...dirs] = git(cwd, "rev-parse", "--show-toplevel", "--git-dir", "--git-common-dir")
    .split("\n")
    .filter(Boolean);
  if (!top || dirs.length !== 2) return { root: "", main: true, nested: [] };
  const root = realDir(top);
  const [dir, common] = dirs.map((p) => realDir(resolve(cwd, p)));
  const nested = git(cwd, "worktree", "list", "--porcelain")
    .split("\n")
    .filter((l) => l.startsWith("worktree "))
    .map((l) => realDir(l.slice(9)))
    .filter((w) => w.startsWith(root + sep));
  return { root, main: dir === common, nested };
}

/** A long option `f` names `name`, GNU unique prefixes included (`--recu` for `--recursive`). */
const longFlag = (f, name) => f.length >= 3 && name.startsWith(f.split("=")[0]);
/** True when `rm` is given both recursive and force, in any flag spelling (`-rf`, `-r -f`, `--recursive --force`). */
const isRecursiveForce = (flags) =>
  flags.some((f) => /^-[a-zA-Z]*[rR]/.test(f) || longFlag(f, "--recursive")) &&
  flags.some((f) => /^-[a-zA-Z]*f/.test(f) || longFlag(f, "--force"));
/** The scratchpad root Claude Code gives a session: `/tmp/claude-<uid>` through its symlinks. */
const scratchRoot = () => realDir(`/tmp/claude-${process.getuid?.() ?? 0}`);
const FIND_EXEC = new Set(["-exec", "-execdir", "-ok", "-okdir"]);
const baseName = (w) => w.split("/").pop();
/** At most this many `rm` and `find` words of one simple command are read; past it the command denies. */
const MAX_DELETERS = 32;
/**
 * What a simple command deletes recursively. Deny-leaning, like a text rule: every word named `rm` or `find` is
 * read as a command, so no wrapper hides one, known or not (`sudo`, `setsid`, `flock f`, `direnv exec .`,
 * `op run --`; STA-330 review). The operands of `rm` (or `git rm`) with recursive and force (after `--`, every
 * word), and the start paths of `find … -delete` or `find … -exec rm` (as `{ under }`: find deletes what is below
 * them); null for operands the guard cannot read (`xargs` and `parallel` take them from their input; `git -C x rm`
 * pathspecs are not from here).
 */
function deletedPaths(words) {
  const out = [];
  const at = [];
  words.forEach((w, k) => ["rm", "find"].includes(baseName(w)) && at.push(k));
  if (at.length > MAX_DELETERS) return [null];
  for (const k of at) {
    const head = words.slice(0, k);
    if (baseName(words[k]) === "rm") {
      const rest = words.slice(k + 1);
      const dash = rest.indexOf("--");
      const before = dash < 0 ? rest : rest.slice(0, dash);
      if (!isRecursiveForce(before.filter((x) => x.startsWith("-")))) continue;
      const fed = head.some((x) => ["xargs", "parallel"].includes(baseName(x)));
      const moved = head.some((x) => /^-C$|^--(?:git-dir|work-tree)/.test(x));
      if (fed || (moved && head.some((x) => baseName(x) === "git"))) out.push(null);
      out.push(
        ...before.filter((x) => !x.startsWith("-")),
        ...(dash < 0 ? [] : rest.slice(dash + 1)),
      );
    } else {
      let j = k + 1;
      while (/^-(?:[HLP]|O\d*|D)$/.test(words[j] ?? "")) j += words[j] === "-D" ? 2 : 1;
      const from = j;
      while (j < words.length && !/^[-(!)]/.test(words[j])) j++;
      const rest = words.slice(j);
      const rm = (x, i) => FIND_EXEC.has(x) && baseName(rest[i + 1] ?? "") === "rm";
      if (rest.includes("-delete") || rest.some(rm))
        out.push(...(j > from ? words.slice(from, j) : ["."]).map((under) => ({ under })));
    }
  }
  return out;
}

/**
 * Where each recursive delete (`deletedPaths`) lands (`rmPlace`), memoised per command. `walk` follows `cd`; a
 * relative operand where the directory is unknown denies.
 */
const rmPlaces = (c, ctx) => ctx.memo(`rm\0${c}`, () => rmScan(c, ctx));
function rmScan(c, ctx) {
  const out = [];
  for (const [text, start] of scanBases(c, ctx.cwd))
    for (const { words, dirs } of walk(text, start))
      for (const t of deletedPaths(words))
        for (const dir of dirs)
          out.push(
            t === null ? "deny" : t.under ? rmPlace(t.under, dir, ctx, true) : rmPlace(t, dir, ctx),
          );
  return out;
}
/** Build output and caches, regenerated by a build or `pnpm install`: removable in any worktree. */
const REGENERABLE = /^(?:node_modules|dist|\.turbo|\.stackra|coverage|\.cache)$/;
/** `w` with its brace expansions (`{a,b}`, nested too), or null past 64 words. */
function braces(w) {
  const m = /\{([^{}]*,[^{}]*)\}/.exec(w);
  if (!m) return [w];
  const out = [];
  for (const alt of m[1].split(",")) {
    const more = braces(w.slice(0, m.index) + alt + w.slice(m.index + m[0].length));
    if (more === null || out.push(...more) > 64) return null;
  }
  return out;
}
/**
 * A glob segment as a regex: `*`, `?` and `[…]`. `dots` lets a wildcard match a leading dot (deny-leaning for
 * `rm`); the shell's own globbing does not. `any` is what one wildcard character may be.
 */
function globRx(seg, { dots = true, any = "." } = {}) {
  const body = seg
    .replace(/\[\^/g, "[!")
    .replace(/[.+^${}()|\\]/g, "\\$&")
    .replace(/\*+/g, `${any}*`)
    .replace(/\?/g, any)
    .replace(/\[!/g, "[^");
  try {
    return new RegExp(`^${dots || seg.startsWith(".") ? "" : "(?!\\.)"}${body}$`);
  } catch {
    return new RegExp(`^${seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`); // an unclosed `[` is literal
  }
}
/**
 * The paths a word's glob expands to from `dir`, one segment at a time with `readdirSync` (symlinks followed, as
 * the shell does); null past 1000. shortcut: zsh `**` is read as `*`, one level; deeper zsh matches never follow a
 * symlink and stay under a checked one.
 */
function expandGlob(dir, t) {
  if (!/[*?[]/.test(t)) return [t];
  let found = [""];
  const segs = t.split("/");
  for (let k = 0; k < segs.length; k++) {
    const slash = k === 0 ? "" : "/";
    if (!/[*?[]/.test(segs[k])) {
      found = found.map((p) => p + slash + segs[k]);
      continue;
    }
    const rx = globRx(segs[k]);
    const next = [];
    for (const p of found) {
      let names = [];
      try {
        names = readdirSync(physical(dir, p ? `${p}/` : t.startsWith("/") ? "/" : "./"));
      } catch {
        // an unreadable directory matches nothing, as in the shell
      }
      next.push(...names.filter((n) => rx.test(n)).map((n) => p + slash + n));
    }
    if (next.length > 1000) return null;
    found = next;
  }
  return found;
}
/**
 * Where path `t` lands from `dir` as the kernel walks it: every symlink before the last segment followed (`l/..`
 * is the parent of l's target, not `.`), and the last one too when `t` ends in `/`, `/.` or `/..`; rm removes a
 * final symlink itself.
 */
function physical(dir, t) {
  let cur = t.startsWith("/") ? "/" : dir;
  for (const seg of t.split("/")) {
    if (seg === "" || seg === ".") continue;
    cur = seg === ".." ? dirname(realDir(cur)) : join(realDir(cur), seg);
  }
  return /(?:^|\/)(?:\.\.?)?$/.test(t) ? realDir(cur) : join(realDir(dirname(cur)), basename(cur));
}
/**
 * Where `rm -rf <t>`, run in `dir` (null when unknown), lands: "ok" strictly inside this session's own checkout or
 * the scratchpad; "nested" strictly inside a linked worktree nested in that checkout (another agent's, or this
 * session's reached by `cd` from the main checkout), unless it is build output; "deny" anywhere else, a nested
 * worktree itself, or a path that contains one. Braces and globs are expanded first; `~`, `$` and a bare `*` deny.
 * `under`: only what is below `t` goes (`find t -delete`), so `t` may be the checkout or scratchpad root itself.
 */
function rmPlace(t, dir, ctx, under = false) {
  if (/^[~$]/.test(t) || /[$`]/.test(t) || /^(\.\/)?\.?\*$/.test(t)) return "deny";
  if (!t.startsWith("/") && dir === null) return "deny";
  const paths = [];
  for (const w of braces(t) ?? [null]) {
    const found = w === null ? null : expandGlob(dir ?? "/", w);
    if (found === null) return "deny";
    paths.push(...found);
  }
  const places = paths.map((p) => landing(physical(dir ?? "/", p), ctx, under));
  return places.includes("deny") ? "deny" : places.includes("nested") ? "nested" : "ok";
}
/** The place (`rmPlace`) of one physical path. */
function landing(real, ctx, under) {
  const own = ctx.own();
  const inside = (r) => r && (real.startsWith(r + sep) || (under && real === r));
  if (![own.root, scratchRoot()].some(inside)) return "deny";
  // `.git` holds the history and every linked worktree's admin directory (a worktree's `.git` file links it).
  if (real.split(sep).includes(".git")) return "deny";
  if (own.nested.some((w) => w === real || w.startsWith(real + sep))) return "deny";
  if (!own.nested.some((w) => real.startsWith(w + sep))) return "ok";
  return REGENERABLE.test(basename(real)) ? "ok" : "nested";
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
      if (g.args.some((a) => /^--(?:all|branches|mirror)$/.test(a))) return true;
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
          (src === "HEAD" || src === "@" || own.has(src)) &&
          (dst === undefined || own.has(dst.replace(/^heads\//, ""))) &&
          !more.length;
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
 * Where a checkout (`top`, its toplevel) sits for this session: "own" (the session's own linked worktree),
 * "nested" (a linked worktree nested in the session's checkout, reached by `cd` or `-C` from the main checkout:
 * an orchestrated subagent's shell starts there) or "other". A command that names a git directory (`--git-dir`,
 * `GIT_DIR=`, `--bare`) is "other": git then uses the cwd as the worktree of another repository's index.
 */
function placeOf(top, ctx, g) {
  if (!top || g.gitDir) return "other";
  const own = ctx.own();
  const real = realDir(top);
  if (!own.main && real === own.root) return "own";
  return own.nested.includes(real) ? "nested" : "other";
}
/**
 * The place (`placeOf`) of every git command that discards work: a discarding command (`discards`) and
 * `git worktree remove --force|-f` (its path's checkout). Memoised per command: two rules read it.
 */
const discardPlaces = (c, ctx) =>
  ctx.memo(`discard\0${c}`, () =>
    scanBases(c, ctx.cwd).flatMap(([t, base]) =>
      gitCommands(t, base).flatMap((g) => {
        if (discards(g)) return [placeOf(g.run("rev-parse", "--show-toplevel"), ctx, g)];
        if (g.sub !== "worktree" || g.args[0] !== "remove") return [];
        if (!g.args.some((a) => /^(?:--force|-[a-zA-Z]*f[a-zA-Z]*)$/.test(a))) return [];
        const path = g.args.slice(1).find((a) => !a.startsWith("-"));
        return [
          path ? placeOf(g.run("-C", path, "rev-parse", "--show-toplevel"), ctx, g) : "other",
        ];
      }),
    ),
  );
/**
 * `git branch -D` (or `-d --force`) of a branch whose commits exist only here: no remote-tracking ref holds its
 * tip and its upstream is not gone (a squash-merged PR branch deleted on GitHub is gone after a fetch).
 */
const deletesUnpushedBranch = (c, ctx) =>
  scanBases(c, ctx.cwd).some(([t, base]) =>
    gitCommands(t, base).some((g) => {
      if (g.sub !== "branch") return false;
      const flag = (re) => g.args.some((a) => re.test(a));
      const force =
        flag(/^-[a-zA-Z]*D/) ||
        (flag(/^(?:-[a-zA-Z]*d[a-zA-Z]*|--delete)$/) && flag(/^(?:-[a-zA-Z]*f[a-zA-Z]*|--force)$/));
      if (!force || flag(/^(?:-[a-zA-Z]*r[a-zA-Z]*|--remotes)$/)) return false;
      return g.args
        .filter((a) => !a.startsWith("-"))
        .some((name) => {
          const tip = g.run("rev-parse", "--verify", "--quiet", `refs/heads/${name}`);
          if (!tip) return !g.run("rev-parse", "--git-dir"); // an unknown checkout asks; git refuses a missing branch
          if (g.run("branch", "-r", "--contains", tip)) return false;
          return (
            g.run("for-each-ref", "--format=%(upstream:track)", `refs/heads/${name}`) !== "[gone]"
          );
        });
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

/**
 * `pnpm bot:gh` merging or moving a branch outside `pr:merge`: `pr merge`, `api …/pulls/<n>/merge` (any method),
 * `api repos/<o>/<r>/merges`, and the GraphQL merge, enqueue, commit-on-branch and ref mutations.
 */
const MERGE =
  /\bpr\s+(?:(?:-R|--repo)(?:=|\s+)\S+\s+)?merge\b|\bpulls(?:\/|%2F)+\d+(?:\/|%2F)+merge\b|\brepos(?:\/|%2F)+[^/\s%]+(?:\/|%2F)+[^/\s%]+(?:\/|%2F)+merges\b|\b(?:mergePullRequest|enablePullRequestAutoMerge|enqueuePullRequest|mergeBranch|createCommitOnBranch|updateRefs?|deleteRef)\b/i;
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

/** gh flags whose value is prose (a title, a body, a description), and the label flags (`-l`, `--add-label`). */
const GH_PROSE = /^(?:-t|--title|-b|--body|-d|--description)$/;
const GH_PROSE_JOINED = /^--(?:title|body|description)=/;
const GH_LABEL = /^(?:-l|--label|--add-label)$/;
const GH_LABEL_JOINED = /^(?:--label=|--add-label=|-l.)/;
/** An `api` path, field or GraphQL document that writes labels. */
const API_LABELS =
  /(?:^|\/|%2F)labels\b|\blabels(?:\[\])?=|\blabelIds\b|Labels?\w*Labelable\b|\b(?:create|update)Label\b/i;
const OWNER_LABEL = /owner-approv/i;
/** The method of a `gh api` call: `-X x`, `-Xx`, `--method x`, `--method=x`; GET when a field-less call names none. */
function apiWrites(args) {
  let method = "";
  args.forEach((w, k) => {
    const m = /^(?:-X|--method=?)(.*)$/.exec(w);
    if (m) method = (m[1] || args[k + 1] || "").toUpperCase();
  });
  const fields = args.some((w) => /^-[a-zA-Z]*[fF]|^--(?:field|raw-field|input)\b/.test(w));
  return method ? method !== "GET" : fields;
}
/**
 * ADR 0230 rule 4 tripwire (STA-330 review): a gh command that writes labels (`pr|issue create|edit`, `label
 * create|edit|clone`, an `api` label write) and names `owner-approved` anywhere but in a title, body or
 * description (`-l`, `--label`, `--add-label`, `=` joined, comma lists, quoted, `labels[]=`, a GraphQL document),
 * or whose label value is computed (`$(…)`, backticks, a variable). pr-merge checks who added the label.
 */
function writesOwnerLabel(c) {
  for (const t of [dropMessages(c), ...nestedRaw(c).map(dropMessages)])
    for (const { words, dyn } of simpleCommands(t)) {
      const g = words.findIndex((w) => baseName(w) === "gh" || /^bot:(?:gh|review)$/.test(w));
      if (g < 0) continue;
      let j = g + 1;
      while (j < words.length && /^(?:--|-R|--repo(?:=.*)?)$/.test(words[j]))
        j += /^(?:-R|--repo)$/.test(words[j]) ? 2 : 1;
      const [sub, verb] = words.slice(j, j + 2);
      const args = words.slice(j + 2);
      const adyn = dyn.slice(j + 2);
      const edits =
        (["pr", "issue"].includes(sub) && ["create", "edit"].includes(verb)) ||
        (sub === "label" && ["create", "edit", "clone"].includes(verb));
      if (sub === "api") {
        const all = words.slice(j + 1);
        if (apiWrites(all) && all.some((w) => API_LABELS.test(w)))
          if (all.some((w, k) => OWNER_LABEL.test(w) || dyn[j + 1 + k])) return true;
        continue;
      }
      if (!edits) continue;
      for (let k = 0; k < args.length; k++) {
        const w = args[k];
        if (GH_PROSE.test(w)) k++;
        else if (GH_PROSE_JOINED.test(w)) continue;
        else if (OWNER_LABEL.test(w)) return true;
        else if (GH_LABEL.test(w) && adyn[k + 1]) return true;
        else if ((GH_LABEL_JOINED.test(w) || sub === "label") && adyn[k]) return true;
      }
    }
  return false;
}
/** A `-b` / `--body` value that ends in the owner's approval token. */
const APPROVE_BODY =
  /(?:^|\s)(?:-b|--body)(?:=|\s+)(?:"[^"]*owner-approval\s*"|'[^']*owner-approval\s*'|\S*owner-approval)(?=\s|$)/i;
/**
 * ADR 0230 rule 4 tripwire: a gh command that writes the owner's label (`writesOwnerLabel`), or an approving
 * `pr review` whose body ends in `owner-approval`. Titles and bodies that only mention the words are prose.
 */
const writesOwnerApproval = (c) =>
  writesOwnerLabel(c) ||
  [c, ...nestedRaw(c)].some((t) =>
    segments(t).some(
      (s) =>
        /\bgh\b/.test(s) &&
        /\bpr\s+review\b/.test(s) &&
        /(?:^|\s)(?:--approve|-a)(?:\s|$)/.test(s) &&
        APPROVE_BODY.test(s),
    ),
  );

/** A GraphQL label mutation: it takes label ids, so the label it writes cannot be read from the command. */
const LABEL_MUTATION =
  /\b(?:add|remove|replace|clear)Labels\w*Labelable\b|\b(?:create|update|delete)Label\b/;
const botLabelMutation = (c) =>
  [dropMessages(c), ...runnable(c)].some((t) =>
    segments(t).some((s) => /\bbot:gh\b/.test(blank(s)) && LABEL_MUTATION.test(s)),
  );
/** A `pnpm bot:gh` write: `api` with a method or a field (pflag bundles: `-iX`), a repo edit, a release, a variable or secret. */
const BOT_GH_WRITE =
  /\bbot:gh\s+(?:--\s+)?(?:(?:-R|--repo)(?:=|\s+)\S+\s+)?(?:api\b[^|;&\n]*\s(?:-(?!-)[a-zA-Z]*[XfF]|--(?:method|field|raw-field|input)\b)|repo\s+(?:edit|delete|rename|archive)\b|release\s+(?:create|edit|delete|upload)\b|(?:variable|secret)\b)/;
/**
 * A `pnpm bot:git` command that runs a program in the bot's environment, which holds every /agents value:
 * `--upload-pack`, `--receive-pack`, `--exec`, `clone -u`, `rebase -x`, `bisect run`, `submodule foreach`,
 * `difftool`, `mergetool`, `filter-branch`, `grep -O` (`gitRunsProgram`).
 */
const botGitRunsProgram = (c) =>
  scanTexts(c).some((t) =>
    gitCommands(t, null).some((g) => g.bot && gitRunsProgram([g.sub, ...g.args])),
  );
/**
 * A simple command whose name is computed (`$x pr merge`, `$(echo gh) …`, `env -S`): no text rule can read it.
 * Script strings (`eval "$(mise activate zsh)"`) are `runsOpaque`'s, which trusts the toolchain's setup.
 */
const substitutionTexts = (c) => scanShell(c).bodies.flatMap((b) => [b, ...substitutionTexts(b)]);
const computedName = (c) =>
  [c, ...substitutionTexts(c)].some((t) =>
    simpleCommands(t).some((s) => {
      const i = commandAt(s.words);
      // `$HOME/.local/bin/mise` is a path the text rules still read (`(?:\S*/)?gh`).
      const name = (s.words[i] ?? "").replace(/^(?:\$HOME|\$\{HOME\})(?=\/)/, "");
      return i < 0 || (i < s.words.length && s.dyn[i] && /[$`]/.test(name));
    }),
  );

/** Package-manager options whose value is the next word (`pnpm -C dir`, `pnpm --filter x`). */
const PM_VALUE = /^(?:-C|-F|--filter|--dir|--prefix|-w|--workspace|--cwd)$/;
/**
 * Running the reviewer wrapper: `bot:review` as the script a package manager runs (`pnpm [options] [run]
 * bot:review`) wherever the package manager stands, so no wrapper hides it, known or not (`setsid`, `mise exec --`,
 * `$(…)`; STA-330 review), or `bot-gh.mjs review` directly. One pass over the words.
 */
const runsBotReview = (t) =>
  /\bbot-gh\.mjs\s+review\b/.test(t) ||
  simpleCommands(t).some(({ words }) => {
    let script = false; // the word may be the script a package manager before it runs
    for (let k = 0; k < words.length; k++) {
      const w = words[k];
      if (["pnpm", "npm", "yarn"].includes(baseName(w))) script = true;
      else if (script && w === "bot:review") return true;
      else if (script && PM_VALUE.test(w)) k++;
      else script &&= w.startsWith("-") || ["run", "run-script"].includes(w);
    }
    return false;
  });

/** A command that prints the whole environment: `printenv`, `env`, `export -p`, `declare -x`, bare `set`. */
const PRINTS_ENV = atName(
  String.raw`(?:printenv|env(?:\s+-[0v]+|\s+-u\s+\S+)*|set|(?:export|declare|typeset)(?:\s+-[a-zA-Z]*[xp][a-zA-Z]*)?)\s*(?:$|[|;&)\n<>]|\d+>|&>)`,
);
/** `ps` listing process environments (`-E`, or a BSD option cluster with `e`: `ps eww`), `launchctl procinfo`. */
const listsProcessEnv = (c) =>
  runnable(c).some((t) =>
    simpleCommands(t).some((s) =>
      nameIndexes(s.words).some((k) => {
        const [name, ...args] = s.words.slice(k);
        const b = name.split("/").pop();
        if (b === "launchctl") return args[0] === "procinfo";
        if (b !== "ps") return false;
        return (
          args.some((a) => /^-[a-zA-Z]*E/.test(a)) || /^[a-zA-Z]*e[a-zA-Z]*$/.test(args[0] ?? "")
        );
      }),
    ),
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
    rx: (c) =>
      runs(c, /\binfisical\s+run\b[^|;&\n]*\s--\s+(?:\w+=\S*\s+)*(?:printenv\b|env\s*(?:$|-|\)))/),
    why: "Secrets guard: `infisical run -- env|printenv` prints the injected secret values. Run the command that needs them instead.",
  },
  {
    rx: (c) =>
      runs(c, (t) =>
        simpleCommands(t).some((s) => {
          const k = s.words.findIndex((w) => w.split("/").pop() === "infisical");
          const rest = s.words.slice(k + 1);
          const line = ` ${rest.join(" ")} `;
          return (
            k >= 0 &&
            (/ user get token | token renew /.test(line) ||
              (rest.includes("login") && rest.some((w) => /^--plain(?:=|$)/.test(w))))
          );
        }),
      ),
    why: "Secrets guard: `infisical user get token`, `infisical token renew` and `infisical login --plain` print an Infisical access token, which reads every secret. Nobody reads a token; the pnpm scripts that need one run under `infisical run` themselves.",
  },
  {
    rx: (c) =>
      runs(
        c,
        atName(
          String.raw`security\s+(?:find-(?:generic|internet)-password|dump-keychain|export)\b`,
        ),
      ),
    why: "Secrets guard: `security find-generic-password`, `find-internet-password`, `dump-keychain` and `export` read the owner's keychain, in any form (`/usr/bin/security`, `timeout`, `pnpm exec`). Agents never read a credential.",
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
    // Any word of the text the shell runs that names a secret file (`namesSecret`): `cat x/.env`, `base64 .env`,
    // `< .env cat`, `source .env`, `cp a .env`, `cat key.pem`, `cat ~/.git-credentials`, `cat .env*`. A quoted
    // argument is checked whole (`cat "$HOME/.npmrc"`), so a grep pattern `"no .env files"` is no path; only
    // message values (`-m`, `--title`, `--body`, a `linear comment`) and heredoc bodies are prose (STA-330 review).
    // `.env.example` and `*.example` are templates.
    rx: (c) => {
      const words = [dropMessages(c), ...nestedRaw(c).map(dropMessages)].flatMap((t) =>
        simpleCommands(t).flatMap((s) => [...s.words, ...s.redirects.map((r) => r.target)]),
      );
      const hit = [
        ...new Set([
          ...runnable(c).flatMap((t) => t.split(/[\s=<>()|;&\x60'"]+/)),
          ...words.flatMap((w) => [w, ...w.split("=").slice(1)]),
        ]),
      ].find(namesSecret);
      return hit
        ? `Secrets guard: \`${hit}\` holds secret values; a command never reads, copies, writes or prints it, and never creates a .env file. Secrets come from Infisical (ADR 0173); application secrets use Encore secret().`
        : false;
    },
    why: "",
  },
  {
    // A redirection ends it too: `printenv > f` writes every value where a later `cat` reads it.
    rx: (c) => runs(c, PRINTS_ENV),
    why: "Printing the whole environment (`printenv`, `env`, `export -p`, `declare -x`, bare `set`) can leak an injected token into the transcript. Echo the single variable you need, without its value if it is a secret.",
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
        atName(
          String.raw`wrangler\s+(?:[^|;&\n]*\s)?(?:deploy|rollback|delete|secret)\b|wrangler\b[^|;&\n]*\s--remote\b`,
        ),
      ),
    decision: "ask",
    why: "`wrangler deploy`, `rollback`, `delete`, `secret` and `--remote` change Cloudflare with the owner's login; the owner confirms it.",
  },
  {
    rx: (c) => runs(c, atName("eas" + END)),
    decision: "ask",
    why: "`eas` builds, submits and updates on the owner's Expo login; the owner confirms it.",
  },
  {
    rx: (c) =>
      runs(
        c,
        atName(
          String.raw`(?:npx|pnpx|bunx|pnpm\s+(?:-\S+\s+)*dlx|npm\s+(?:-\S+\s+)*(?:exec|x))` + END,
        ),
      ),
    decision: "ask",
    why: "`npx`, `pnpx`, `pnpm dlx` and `npm exec` run unreviewed registry code; the owner confirms it. Use a catalog dependency with `pnpm exec <bin>`.",
  },

  // --- History, worktrees and shared local state ------------------------------------------------
  {
    rx: (c, ctx) => rmPlaces(c, ctx).includes("deny"),
    why: "`rm -rf` is allowed only strictly inside this session's own checkout or the scratchpad (`/tmp/claude-<uid>/`), and inside a nested linked worktree with the owner's yes. Never /, ~, $HOME, a `$` expansion, `*`, `.git`, a worktree itself, a path outside those roots, or a relative path after an unknown `cd`.",
  },
  {
    rx: (c, ctx) => rmPlaces(c, ctx).includes("nested"),
    decision: "ask",
    why: "`rm -rf` inside a linked worktree nested in this checkout: it may be another agent's. The owner confirms it; build output (`node_modules`, `dist`, `.turbo`, `.stackra`, `coverage`, `.cache`) needs no yes. Run from inside your own worktree instead.",
  },
  {
    rx: pushesMain,
    why: "Never push to main. Push your branch and open a PR; main changes only through a merged PR.",
  },
  { rx: pushRefusal, why: "" },
  {
    rx: (c, ctx) =>
      scanBases(c, ctx.cwd).some(([t, start]) =>
        gitCommands(t, start).some(
          (g) =>
            g.bot &&
            g.sub === "push" &&
            (g.args.some((a) => /^--(?:tags|follow-tags)$/.test(a)) ||
              pushRefs(g.args).slice(1).some(isTagRef)),
        ),
      ),
    decision: "ask",
    why: "A bot push of tags (`--tags`, `--follow-tags`, `refs/tags/*`, `<package>@x`) publishes a release marker no ruleset protects; the owner confirms it.",
  },
  {
    rx: (c, ctx) => discardPlaces(c, ctx).includes("other"),
    why: "This discards uncommitted work (`reset --hard`, `checkout`/`restore .`, `checkout -f`, `switch --discard-changes`, `clean -f`, `worktree remove --force`). It runs only in this session's own worktree (a worktree nested in this checkout with the owner's yes), never in the main checkout or another repository. Name the paths, or make a WIP commit first; `git worktree remove <path>` refuses when dirty and `git clean -n` previews anywhere.",
  },
  {
    rx: (c, ctx) => discardPlaces(c, ctx).includes("nested"),
    decision: "ask",
    why: "This discards uncommitted work in a linked worktree nested in this checkout, reached by `cd` or `-C`: it may be another agent's. The owner confirms it. Run it from inside your own worktree (the session's working directory) instead.",
  },
  {
    rx: deletesUnpushedBranch,
    decision: "ask",
    why: "`git branch -D` of a branch whose commits no remote holds (its upstream is not gone) deletes work git cannot fetch back; the owner confirms it. After a merged PR, `pnpm bot:git -- fetch --prune origin` marks the upstream gone.",
  },
  { rx: stashRefusal, why: "" },
  // STA-208: agents never act with the owner's GitHub login (ADR 0230 rule 5). Accident guard: same macOS user.
  {
    rx: botMerges,
    why: "Agents merge only through `pnpm pr:merge <n>` (ADR 0119, ADR 0230), which checks the gate and the reviewer's verdict. `pnpm bot:gh -- pr merge`, `api …/pulls/<n>/merge`, `api …/merges` and the GraphQL merge, enqueue, `createCommitOnBranch` and ref mutations are denied.",
  },
  {
    rx: botLabelMutation,
    decision: "ask",
    why: "A GraphQL label mutation takes label ids, so the guard cannot tell whether it writes `owner-approved`; the owner confirms it. Use `pnpm bot:gh -- pr edit <n> --add-label <name>`.",
  },
  {
    rx: (c) => runs(c, BOT_GH_WRITE),
    decision: "ask",
    why: "A `pnpm bot:gh` write (`api` with `-X`, `--method`, `-f`, `-F`, `--field`, `--raw-field` or `--input`; `repo edit|delete|rename|archive`; `release create|edit|delete|upload`; `variable`; `secret`) acts with the bot's write access beyond a PR; the owner confirms it.",
  },
  {
    rx: botGitRunsProgram,
    why: "`pnpm bot:git` runs git with every /agents value in its environment, so an option that runs a program (`--upload-pack`, `--receive-pack`, `--exec`, `clone -u`, `rebase -x`, `bisect run`, `submodule foreach`, `difftool`, `mergetool`, `filter-branch`, `grep -O`) is denied. Run local git without the bot; use `pnpm bot:git` for fetch and push only.",
  },
  {
    rx: computedName,
    decision: "ask",
    why: "The command name is computed (`$x …`, `$(…) …`, `env -S`), so the guard cannot read what runs; a human confirms it. Write the command name out.",
  },
  {
    // STA-214: pack plumbing pushes or fetches without the push-to-main check; no agent needs it.
    // The binary by path (`/usr/lib/git-core/git-send-pack`) is the same plumbing as `git send-pack`.
    rx: (c) =>
      runs(c, new RegExp(GIT + String.raw`(?:send|receive|fetch|upload)-pack\b`)) ||
      runs(c, atName(String.raw`git-(?:send|receive|fetch|upload)-pack\b`)),
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
      /\$\{?\w*(?:TOKEN|_API_KEY|_SECRET|_PASSWORD|_PRIVATE_KEY)\b/.test(
        scanShell(dropMessages(c)).literal,
      ) ||
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
    why: "A token is never printed, read or handed to `gh auth`: `pnpm bot:token`, running `bot-token.mjs`, `$GH_TOKEN` (any `$…_TOKEN`, `$…_API_KEY`, `$…_SECRET`), `bot:gh -- auth …`, and `git credential …` or `git credential-<helper> …` (bare or through `bot:git`) are denied. Use `pnpm bot:gh -- <args>`, which keeps the token in its child process.",
  },
  // ADR 0230: an agent never speaks for the owner, and only the reviewer identity posts verdicts. A tripwire, not
  // the control: pr-merge checks the verdict's author.
  {
    rx: writesOwnerApproval,
    why: "`owner-approval` / `owner-approved` record the owner's own decision; an agent never adds the label or submits an approving review that ends in the token. Ask the owner.",
  },
  {
    // Only a write whose body starts with the token: a builder's reply or a `--jq` read may mention it.
    rx: /(?:^|[\s;&|(:])gh\s+(?:--\s+)?(?:pr\s+(?:comment|review)\b[^\n]*\s(?:-b|--body)(?:=|\s+)["']?\s*AI-REVIEW:|api\b[^\n]*\s(?:-[fF]|--(?:raw-)?field)(?:=|\s+)["']?body=["']?\s*AI-REVIEW:)/i,
    why: "AI-REVIEW verdicts are posted only by the reviewer identity: `pnpm bot:review -- pr comment <n> --body-file <f>`, from a reviewer agent, never on the reviewer's own work.",
  },
  {
    rx: (c, ctx) => !REVIEWER_AGENTS.has(ctx.agentType) && runs(c, runsBotReview),
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

/** A word re-quoted for the shell: plain words bare, an assignment's value quoted, an expansion double-quoted. */
function requote(w, dynamic) {
  if (/^[\w./:@%+,~{}!^-]*$/.test(w) && w) return w;
  const eq = /^(\w+=)(.*)$/s.exec(w);
  if (eq) return eq[1] + requote(eq[2], dynamic);
  if (dynamic) return w.includes('"') ? w : `"${w}"`;
  return `'${w.replaceAll("'", "'\\''")}'`;
}
/**
 * `c` re-serialised from its unquoted words (`"gh"`, `g''h`, `\gh` → `gh`; `"a; b"` → `'a; b'`), so a quoted or
 * escaped command name meets every rule. Null when `c` has no quote or backslash.
 */
function dequoted(c) {
  if (!/['"\\]/.test(c)) return null;
  return simpleCommands(c)
    .map(
      (s) =>
        [
          ...s.words.map((w, k) => requote(w, s.dyn[k])),
          ...s.redirects.map((r) => r.op + requote(r.target, r.dynamic)),
        ].join(" ") + (s.op ? ` ${s.op} ` : ""),
    )
    .join("");
}
/** A text, its runner-free form and its dequoted forms, once each. */
function forms(t) {
  const d = dequoted(t);
  return [...new Set([t, lookThroughRunners(t), ...(d ? [d, lookThroughRunners(d)] : [])])];
}

/**
 * Substitutions nested deeper than this are not read: every level is scanned again, so a deeper command would
 * cost more than the hook's time limit, and the hook fails open when it is killed (STA-330 review).
 */
const MAX_DEPTH = 16;
const TOO_MANY_GIT = `The command needs more than ${MAX_GIT} git lookups (checkouts, branches, push targets) to decide, more than the guard runs in its time limit. Split it into smaller commands.`;
const TOO_DEEP = `The command nests \`$(…)\`, \`<(…)\` or backtick substitutions more than ${MAX_DEPTH} levels deep, or script strings (\`sh -c\`, \`eval\`) more than ${MAX_SCRIPTS}, which the guard does not read. Split it into plain commands.`;
/** The deepest nesting of `$(`, `<(`, `>(` and backtick bodies in `c`, quotes ignored (deny-leaning). */
function substitutionDepth(c) {
  const stack = []; // true for a substitution's `(`, false for a plain one
  let depth = 0;
  let max = 0;
  let tick = false;
  for (let i = 0; i < c.length; i++) {
    const ch = c[i];
    if (ch === "\\") i++;
    else if (ch === "`") tick = !tick;
    else if (ch === "(") {
      const sub = "$<>".includes(c[i - 1] ?? "");
      stack.push(sub);
      if (sub) depth++;
    } else if (ch === ")" && stack.pop()) depth--;
    max = Math.max(max, depth + (tick ? 1 : 0));
  }
  return max;
}

/** The evaluation context: the shell's directory, the subagent type, the session's own checkout (lazy) and a memo. */
function context(cwd, agentType) {
  let own;
  const cache = new Map();
  const memo = (key, f) => {
    if (!cache.has(key)) cache.set(key, f());
    return cache.get(key);
  };
  return { cwd, agentType, memo, own: () => (own ??= ownCheckout(cwd)) };
}

/**
 * The tier for a shell command: `{ decision: "allow" | "ask" | "deny", reason }`. Every rule runs on the command
 * and on its runner-free form (`lookThroughRunners`); any deny wins over any ask. Safety net (STA-254): deny rules
 * also run on every substitution body found with quotes ignored.
 * @param {string} raw the command as the agent wrote it
 * @param {{ cwd?: string, agentType?: string }} [options] the shell's directory and the subagent type (`agent_type`)
 */
export function decideBash(raw, { cwd = process.cwd(), agentType = "" } = {}) {
  clearCaches();
  gitRuns = 0;
  if (substitutionDepth(raw) > MAX_DEPTH) return { decision: "deny", reason: TOO_DEEP };
  const cmd = stripHeredocs(raw);
  const ctx = context(cwd, agentType);
  tooDeep = false;
  for (const text of forms(cmd)) {
    runnable(text);
    nestedRaw(text);
  }
  if (tooDeep) return { decision: "deny", reason: TOO_DEEP };
  const check = (rule, text) => {
    const target = rule.scan === "bare" ? blank(text) : text;
    const hit = typeof rule.rx === "function" ? rule.rx(target, ctx) : rule.rx.test(target);
    if (!hit) return null;
    return typeof hit === "string" ? hit : rule.why;
  };
  // Past `MAX_GIT` a rule may have decided on an unknown checkout: the reason is the cap, not the rule.
  const done = (d) => (gitRuns > MAX_GIT ? { decision: "deny", reason: TOO_MANY_GIT } : d);
  let asked = null;
  const all = forms(cmd);
  for (const rule of RULES)
    for (const text of rule.lookThrough === false ? [cmd] : all) {
      const why = check(rule, text);
      if (why && rule.decision !== "ask") return done({ decision: "deny", reason: why });
      if (why) asked ??= why;
    }
  for (const body of rawSubstitutions(cmd)) {
    const texts = forms(body);
    for (const text of texts)
      for (const rule of RULES) {
        if (rule.lookThrough === false && text !== body) continue;
        const why = rule.decision === "ask" ? null : check(rule, text);
        if (why) return done({ decision: "deny", reason: why });
      }
  }
  return done(asked ? { decision: "ask", reason: asked } : { decision: "allow", reason: "" });
}

// ---- paths -------------------------------------------------------------------------------------------------

/** Files that hold secret values: never read, by any tool. `.env.example` and Infisical's project config are not. */
const SECRET_FILE = [
  /(^|\/)\.env(\.[^/]*)?$/i,
  /(^|\/)\.dev\.vars$/i,
  /(^|\/)\.(?:ci-env|sentryclirc)$/i,
  /(^|\/)[^/]*\.secrets[^/]*$/i,
  /\.(?:pem|key)$/i,
  /(^|\/)id_(?:rsa|dsa|ecdsa|ed25519)(?:_[^/.]*)?$/,
  /(^|\/)\.infisical([^/]*$|\/)/,
];
const SECRET_OK = /(^|\/)(\.env(\.[^/]*)?\.example|\.infisical\.(yaml|json))$/;
/** A file name per `SECRET_FILE` and `HOME_SECRET` entry, for globs (`namesSecret`). */
const SECRET_NAMES = [".env", ".env.local", ".dev.vars", ".ci-env", ".sentryclirc"];
SECRET_NAMES.push("app.secrets.json", "tls.pem", "tls.key", ".infisical", "id_rsa", "id_ed25519");
const HOME_SECRETS = [".config/gh/hosts.yml", ".git-credentials", ".ssh/id_rsa", ".ssh/id_ed25519"];
HOME_SECRETS.push(
  ".aws/credentials",
  ".npmrc",
  ".netrc",
  ".docker/config.json",
  ".expo/state.json",
);
HOME_SECRETS.push(".wrangler/config/default.toml", ".stackra/secrets-confirm.key");
/** Credential files under home (the settings Read denies): gh, git, ssh, cloud, registry and CLI logins. */
const HOME_SECRET =
  /^(?:\.config\/gh\/|\.git-credentials$|\.ssh\/id_|\.aws\/|\.npmrc$|\.netrc$|\.docker\/config\.json$|\.wrangler\/|Library\/Preferences\/\.wrangler\/|\.expo\/|Library\/Application Support\/encore\/|\.stackra\/secrets-confirm\.key$)/;
/**
 * True when a command word names a secret file (`isSecretPath`), after brace expansion, or is a glob that could
 * match one (`.env*`, `.e?v`, `*.pem`, `~/.ssh/id_*`).
 */
function namesSecret(w) {
  for (const b of braces(w) ?? [w]) {
    if (isSecretPath(b)) return true;
    const p = unquote(b).replace(/^(?:~|\$HOME|\$\{HOME\})(?=\/)/, HOME_DIR);
    if (!/[*?[]/.test(p)) continue;
    const cut = p.lastIndexOf("/") + 1;
    const shell = { dots: false, any: "[^/]" };
    const last = globRx(p.slice(cut), shell);
    // A last segment of wildcards only (`*`) matches every name: it names no secret by itself.
    const named = /[^*?]/.test(p.slice(cut));
    if (named && SECRET_NAMES.some((n) => last.test(n) && isSecretPath(p.slice(0, cut) + n)))
      return true;
    const whole = new RegExp(
      `^${p
        .split("/")
        .map((seg) => globRx(seg, shell).source.slice(1, -1))
        .join("/")}$`,
    );
    if (HOME_SECRETS.some((h) => whole.test(`${HOME_DIR}/${h}`))) return true;
  }
  return false;
}

/** True when `p` names a file that holds secret values (ADR 0173). */
export function isSecretPath(p) {
  const s = p.trim().replace(/^['"]+|['"]+$/g, "");
  const home = s.replace(/^(?:~|\$HOME|\$\{HOME\})(?=\/)/, HOME_DIR);
  if (home.startsWith(HOME_DIR + "/") && HOME_SECRET.test(home.slice(HOME_DIR.length + 1)))
    return true;
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
