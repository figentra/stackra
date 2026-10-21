#!/usr/bin/env node
/**
 * PreToolUse (Bash): refuse commands that destroy history, print or write secrets, or
 * bypass the release / migration process. Patterns are scoped to the *operand* of the
 * command, not to a bare keyword.
 *
 * Secrets model (see .agents/rules/secrets.md): application secrets reach the generated
 * `.stackra` Encore app through Encore `secret()`, synced from Infisical; developer, agent
 * and CI tokens live in Infisical (dev: `/agents`, staging|prod: `/ci`) and reach a process
 * through `infisical run -- <cmd>` (MCP servers launch through tools/scripts/mcp.sh by
 * convention; no hook enforces that). There are no `.env` files in this repository — so
 * the rules below deny (a) dumping a secret value into the transcript and (b) creating a
 * `.env*` file from the shell.
 *
 * Decisions: a rule denies unless it says `decision: "ask"`; any deny wins over any ask.
 *
 * `rm -rf` rule: the quoted text of a `-m`/`--message` argument is dropped first, so a
 * commit message may mention it; every other quoted string is still scanned, so
 * `bash -c "rm -rf /"` is caught. A recursive force delete is then allowed only when every
 * operand resolves strictly inside the repository / worktree root (`node_modules`, `dist`,
 * `.turbo`, `.stackra`, an absolute path under the root). It is denied for `/`, `~`,
 * `$HOME` or any other `$` expansion, a path outside the root, the root itself, a bare
 * `*`, and for any relative operand when the command also `cd`s (the base is then unknown).
 * The `env`/`printenv` rule only looks at command position (quoted strings are blanked
 * first), so `node -e 'v.env'` or `cat apps/x/eas.json` are fine.
 */
import { spawnSync } from "node:child_process";
import { homedir } from "node:os";
import { resolve, sep } from "node:path";
import { readStdin, deny, ask, failOpen } from "./_io.mjs";
import { commandReachesInbox, scanShell, stripHeredocs } from "./_inbox.mjs";

const EVENT = "PreToolUse";

/** The only `-c` keys an agent may set: display and identity, none runs a command or redirects a remote (STA-216). */
const ALLOWED_C =
  /^(?:color\.ui|color\.diff|color\.status|color\.branch|core\.quotepath|core\.abbrev|core\.precomposeunicode|user\.name|user\.email|advice\.detachedhead|diff\.renames|diff\.algorithm|diff\.context|diff\.noprefix|log\.abbrevcommit|log\.decorate|log\.date|merge\.ff|merge\.conflictstyle|pull\.rebase|pull\.ff|push\.default|rebase\.autosquash|init\.defaultbranch|column\.ui|status\.short|status\.branch|status\.showuntrackedfiles)$/i;
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
/** True when `git config` words are not a plain read: the first option reads, and no write flag follows. */
function configWrites(words) {
  const [first, ...rest] = words;
  const reads =
    CONFIG_READ.has(first) ||
    (["--show-origin", "--show-scope"].includes(first) && rest.some((w) => CONFIG_READ.has(w)));
  return !reads || rest.some((w) => CONFIG_WRITE.has(w));
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
 * can be minted. Wrappers like `sudo`, `env`, `xargs`, `time` are looked through.
 */
const BARE = String.raw`(?:^|[|;&(\n\x60])\s*(?:(?:sudo|command|exec|time|nohup|env|xargs(?:\s+-\S+)*)\s+|\w+=(?:\$\([^)]*\)|\S*)\s+)*(?:\S*/)?`;
const BARE_GH = new RegExp(BARE + String.raw`gh(?:\s|$)`);
const BARE_GIT = (sub) =>
  new RegExp(BARE + String.raw`git\s+` + GIT_OPTS + String.raw`(?:${sub})\b`);
/** Every git subcommand that talks to a remote. All of them go through `pnpm bot:git`, public repos included. */
const NETWORK_GIT = BARE_GIT(
  String.raw`push|fetch|pull|clone|ls-remote|submodule|subtree|remote\s+(?:update|show|prune)|archive\s+[^|;&\n]*--remote`,
);

/** The text of every `$(…)` / backtick body at any depth (single quotes stay literal) and `sh -c` / `eval` string. */
function nestedRaw(c) {
  const out = scanShell(c).bodies.flatMap((b) => [b, ...nestedRaw(b)]);
  for (const m of c.matchAll(/\b(?:(?:ba|z|da)?sh\s+-c|eval)\s+(["'])((?:\\.|(?!\1)[^\\])*)\1/g))
    out.push(m[2], ...nestedRaw(m[2]));
  return out;
}
/** Texts a rule that needs the quoted values scans: the command with prose dropped, and every nested command in full. */
const scanTexts = (c) => [dropMessages(c), ...nestedRaw(c).map(dropMessages)];
/**
 * The text a shell runs: the quote-blanked command (prose in `--body "…"` is ignored), plus every `$(…)` and
 * backtick body at any depth, inside double quotes too (`scanShell`, STA-254), and every `sh -c` / `eval` string.
 * Single-quoted text stays literal. shortcut: no alias or function expansion; deliberate workarounds stay open.
 */
function runnable(c) {
  const { blanked, bodies } = scanShell(c);
  const out = [blanked, ...bodies.flatMap(runnable)];
  for (const m of c.matchAll(/\b(?:(?:ba|z|da)?sh\s+-c|eval)\s+(["'])((?:\\.|(?!\1)[^\\])*)\1/g))
    out.push(...runnable(m[2]));
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
const dropMessages = (c) =>
  scanShell(c)
    .spans.filter(([start]) => PROSE_BEFORE.test(c.slice(0, start)))
    .reduceRight((t, [start, end]) => t.slice(0, start) + "MSG" + t.slice(end), c);

/** `infisical secrets` with no subcommand (only flags / flag values) lists every value. */
const INFISICAL_SUBCOMMANDS = new Set(["get", "set", "delete", "folders", "generate-example-env"]);
function bareInfisicalSecrets(c) {
  return segments(c).some((seg) => {
    const m = seg.match(/\binfisical\s+secrets\b(.*)$/);
    return m && !m[1].split(/\s+/).some((w) => INFISICAL_SUBCOMMANDS.has(unquote(w)));
  });
}

/** The branch a push refspec writes to: `+src:refs/heads/dst` → `dst`. */
const refspecDest = (r) =>
  r
    .replace(/^\+/, "")
    .split(":")
    .pop()
    .replace(/^refs\/heads\//, "");

/** `~` and `$HOME` expanded; any other `$` or backtick makes the path unknown (null). */
const expandHome = (p) => {
  const e = unquote(p).replace(/^(?:~|\$HOME|\$\{HOME\})(?=\/|$)/, homedir());
  return /[$`]/.test(e) ? null : e;
};

/**
 * `git push` whose destination is main: an explicit refspec (`main`, `HEAD:main`,
 * `+main`, `refs/heads/main`, `:main`), `--all` / `--mirror`, or no refspec (or `HEAD`)
 * while main is checked out in the push's checkout: the hook's cwd, moved by a preceding `cd`
 * and by git's `-C`, `--git-dir` and `--work-tree` (STA-214). An unknown target (`$VAR`) counts as main.
 * A branch that merely contains "main" is fine.
 */
function pushesMain(c, cwd) {
  const PUSH = new RegExp(String.raw`\bgit\s+(?:--\s+)?(` + GIT_OPTS + String.raw`)push\b(.*)$`);
  let dir = cwd;
  // GIT_DIR= / GIT_WORK_TREE= anywhere (inline prefix, `export`, `env`) move the push's repository (STA-216).
  const envTarget = [...c.matchAll(new RegExp(String.raw`\bGIT_(DIR|WORK_TREE)=(${Q})`, "g"))].map(
    ([, k, v]) => [k === "DIR" ? "--git-dir" : "--work-tree", expandHome(v)],
  );
  return segments(dropMessages(c)).some((seg) => {
    const cd = seg.match(/^\s*(?:cd|pushd)\s+(\S+)\s*$/);
    if (cd) {
      const to = expandHome(cd[1]);
      dir = to === null || dir === null ? null : resolve(dir, to);
      return false;
    }
    const m = seg.match(PUSH);
    if (!m) return false;
    const args = m[2].split(/\s+/).map(unquote).filter(Boolean);
    if (args.some((a) => a === "--all" || a === "--mirror")) return true;
    const refs = args.filter((a) => !a.startsWith("-"));
    if (refs.some((r) => refspecDest(r) === "main")) return true;
    const implicit = refs.length <= 1 || refs.slice(1).every((r) => r === "HEAD");
    if (!implicit) return false;
    if (dir === null) return true;
    // Only the location options are replayed; a `-c` value could run code (core.fsmonitor), so it is dropped.
    const target = [];
    for (const [opt, v] of envTarget) {
      if (v === null) return true;
      target.push(`${opt}=${v}`);
    }
    // Tokenised in order: a `-c a=--git-dir=x` value is consumed as a value, never read as an option.
    const tokens = new RegExp(
      String.raw`(?<bare>--bare)|(?<opt>-C|--git-dir|--work-tree)(?:=|\s+)(?<value>${Q})|-c\s+(?:${Q})|--namespace(?:=(?:${Q})|\s+(?:${Q}))|--[a-z-]+(?:=\S+)?|-[pP]`,
      "g",
    );
    for (const { groups: g } of m[1].matchAll(tokens)) {
      if (g.bare) target.push("--bare");
      if (!g.opt) continue;
      const v = expandHome(g.value);
      if (v === null) return true;
      target.push(...(g.opt === "-C" ? ["-C", v] : [`${g.opt}=${v}`]));
    }
    // A checkout that cannot be resolved counts as main.
    const branch = git(dir, ...target, "symbolic-ref", "--short", "HEAD");
    return branch === "" || branch === "main";
  });
}

/** `pnpm bot:gh` merging a PR: `pr merge`, `api …/pulls/<n>/merge` (any method), or a GraphQL merge mutation. */
const MERGE =
  /\bpr\s+(?:(?:-R|--repo)(?:=|\s+)\S+\s+)?merge\b|\bpulls(?:\/|%2F)+\d+(?:\/|%2F)+merge\b|\b(?:mergePullRequest|enablePullRequestAutoMerge)\b/i;
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

/** True when `rm` is given both recursive and force, in any flag spelling. */
const isRecursiveForce = (flags) =>
  (flags.some((f) => /^-[a-zA-Z]*[rR]/.test(f)) || flags.includes("--recursive")) &&
  (flags.some((f) => /^-[a-zA-Z]*f/.test(f)) || flags.includes("--force"));

/** `rm -rf` on anything that is not strictly inside the repository / worktree root. */
function unsafeRmRf(c, cwd) {
  const scanned = dropMessages(c);
  const root = git(cwd, "rev-parse", "--show-toplevel") || cwd;
  const cds = /(?:^|[\s;&|(])(?:cd|pushd)\s/.test(scanned);
  for (const m of scanned.matchAll(/\brm\s+([^|;&\n)]*)/g)) {
    const words = m[1].split(/\s+/).map(unquote).filter(Boolean);
    if (!isRecursiveForce(words.filter((w) => w.startsWith("-")))) continue;
    for (const t of words.filter((w) => !w.startsWith("-"))) {
      if (/^[~$]/.test(t) || t.includes("$") || /^(\.\/)?\.?\*$/.test(t)) return true;
      if (cds && !t.startsWith("/")) return true;
      if (!resolve(cwd, t).startsWith(root + sep)) return true;
    }
  }
  return false;
}

const rules = [
  // --- Secrets: never print a value, never create a .env file ----------------------
  {
    rx: /\binfisical\s+export\b/,
    why: "Secrets guard: `infisical export` decrypts and prints every secret value. Secrets reach a process through `infisical run -- <cmd>`; agents never read one. To check a name exists, list names only.",
  },
  {
    rx: (c) => /\binfisical\s+secrets\s+get\b/.test(c) && !/--silent\b/.test(c),
    why: "Secrets guard: `infisical secrets get` prints the value. Only the `--silent` form (no value echoed) is allowed.",
  },
  {
    rx: bareInfisicalSecrets,
    why: "Secrets guard: `infisical secrets` with no subcommand prints every secret value. Use `infisical secrets get NAME --silent` or `infisical secrets set`.",
  },
  {
    rx: /\binfisical\s+run\b[^|;&\n]*\s--\s+(?:\w+=\S*\s+)*(?:printenv\b|env\s*(?:$|-|[|;&)\n]))/,
    why: "Secrets guard: `infisical run -- env|printenv` prints the injected secret values. Run the command that needs them instead.",
  },
  {
    // The secrets inbox holds values a human dropped for `pnpm secrets:import` (ADR 0257). No command
    // may name it: not cat/head/grep/cp/mv/ls/find, not a `cd` into it. The importer takes file NAMES
    // (`pnpm secrets:import --list` lists them) and never prints a value, so it is safe for every caller.
    // Commit-message text is ignored; heredoc bodies are already stripped.
    // Only path-like tokens count (grep/sed/perl/awk patterns, --title/--body/-m values and URLs are not paths);
    // globs only when rooted at home (or relative while the shell sits in home). Accident guard only.
    rx: (c, cwd) => commandReachesInbox(c, { cwd }),
    why: "Secrets guard: ~/Secrets-inbox/ (and the import confirm key) are never read, listed, copied or moved by a command. Use `pnpm secrets:import --list` for names and `pnpm secrets:import [--dry-run] [NAME]` to import; it never prints a value.",
  },
  {
    rx: /\bencore\s+secret\s+(set|get|list\s+--values?)\b/,
    why: 'Secrets guard: `encore secret set/get` are a human\'s to run. Declare the secret with `secret("NAME")` in code and name it in your report; a human sets the value per environment (synced from Infisical).',
  },
  {
    rx: /\bwrangler\s+secret\s+(put|bulk)\b/,
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
    why: "Secrets guard: never create a .env* file. Secrets only come from Infisical (`infisical run`); application secrets use Encore secret().",
  },
  {
    scan: "bare",
    rx: new RegExp(CMDPOS + String.raw`(printenv|env)\s*(?:$|[|;&)\n])`),
    why: "Printing the whole environment can leak an injected token into the transcript. Echo the single variable you need, without its value if it is a secret.",
  },

  // --- Encore CLI: the dangerous, environment-touching subcommands -----------------
  {
    rx: /\bencore\s+db\s+reset\b/,
    why: "`encore db reset` destroys the local database and re-migrates. It is a deliberate, human-confirmed reset; an agent never runs it. Write the migration and `encore run` instead.",
  },
  {
    rx: /\bencore\s+deploy\b/,
    decision: "ask",
    why: "`encore deploy` ships to a shared environment; a human confirms it.",
  },
  {
    rx: /\bencore\s+env\s+(set|create|delete)\b/,
    decision: "ask",
    why: "`encore env set/create/delete` changes a shared environment; a human confirms it.",
  },

  // --- History / worktree destruction ---------------------------------------------
  {
    rx: unsafeRmRf,
    why: "`rm -rf` is allowed only on paths strictly inside the repository / worktree (e.g. node_modules, dist, .turbo, .stackra), never on /, ~, $HOME, a `$` expansion, `*`, a path outside the repo, or relative paths after a `cd`.",
  },
  {
    rx: pushesMain,
    why: "Never push to main. Push your branch and open a PR; main changes only through a merged PR.",
  },
  // STA-208: agents never act with the owner's GitHub login (ADR 0230 rule 5). Accident guard: same macOS user.
  {
    rx: botMerges,
    why: "Agents merge only through `pnpm pr:merge <n>` (ADR 0119, ADR 0230), which checks the gate and the reviewer's verdict. `pnpm bot:gh -- pr merge`, `api …/pulls/<n>/merge` and the GraphQL merge mutations are denied.",
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
    // an included config file or GIT_CONFIG_* env can define one too.
    // Also `git config alias.x …` writes, the config-file env (`GIT_CONFIG_GLOBAL`, `HOME=`, `XDG_CONFIG_HOME=`) and pager env.
    rx: (c) =>
      scanTexts(c).some(
        (d) =>
          /\b(?:git|man)\b/.test(d) &&
          (/(?:^|\s)(?:GIT_EDITOR|GIT_SEQUENCE_EDITOR)=(?!(?:true|:|cat)(?:\s|$))|(?:^|\s)(?:--config-env\b|(?:GIT_CONFIG(?:_GLOBAL|_SYSTEM|_COUNT|_KEY_\d+|_PARAMETERS)?|HOME|XDG_CONFIG_HOME|MANPAGER|PAGER|GIT_PAGER|GIT_ASKPASS|SSH_ASKPASS|GIT_EXEC_PATH|GIT_SSH(?:_COMMAND)?|GIT_PROXY_COMMAND|GIT_EXTERNAL_DIFF|GIT_TEMPLATE_DIR)=)/i.test(
            d,
          ) ||
            gitConfigUnsafe(d)),
      ),
    why: "git `-c` outside a short display/identity allow-list, any `git config` that is not a read (`--get`, `--list`, ...), `--config-env`, and the `GIT_CONFIG*`, `HOME=`, `XDG_CONFIG_HOME=`, `PAGER=`, `MANPAGER=`, `GIT_PAGER=`, `GIT_ASKPASS=`, `SSH_ASKPASS=`, `GIT_EXEC_PATH=`, `GIT_SSH[_COMMAND]=` and `GIT_PROXY_COMMAND=` prefixes make git run another command, redefine a remote or alias past the push and credential guards. Agents never write git config.",
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
    rx: (c) => runs(c, BARE_GH),
    why: "Agents never run `gh` on the owner's login, in any form (a `GH_TOKEN=` prefix included: an empty token falls back to the owner). Use `pnpm bot:gh -- <args>` (builder, stackra-bot; `-R figentra/os` for the OS repo), `pnpm bot:review -- <args>` (reviewer) or `pnpm pr:merge <n>`; in a pipe, `pnpm --silent bot:gh -- <args> | …`.",
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
    why: "A token is never printed, read or handed to `gh auth`: `pnpm bot:token`, `$GH_TOKEN`, `bot:gh -- auth …`, and `git credential …` or `git credential-<helper> …` (bare or through `bot:git`) are denied. Use `pnpm bot:gh -- <args>`, which keeps the token in its child process.",
  },
  // ADR 0230: an agent never speaks for the owner, and only the reviewer identity posts verdicts. A tripwire, not
  // the control: pr-merge checks the verdict's author.
  {
    rx: /\bgh\b[^\n]*\bowner-approv(?:al|ed)\b/i,
    why: "`owner-approval` / `owner-approved` record the owner's own decision; an agent never writes them. Ask the owner.",
  },
  {
    rx: /(?:^|[\s;&|(:])gh\s+(?:--\s+)?(?:pr\s+(?:comment|review)|api)\b[^\n]*\bAI-REVIEW:/i,
    why: "AI-REVIEW verdicts are posted only by the reviewer identity: `pnpm bot:review -- pr comment <n> --body-file <f>`, from a reviewer agent, never on the reviewer's own work.",
  },
  {
    rx: /\bgh\s+(?:--\s+)?pr\s+merge\b[^|;&\n]*\s--admin\b/,
    why: "`gh pr merge --admin` bypasses branch protection and required checks. Wait for the checks and merge normally.",
  },
  {
    rx: new RegExp(GIT + String.raw`push\s+[^|;&]*--force(?!-with-lease)`),
    why: "Force-push rewrites shared history. Use --force-with-lease, and only on your own branch.",
  },
  {
    rx: new RegExp(
      GIT +
        String.raw`reset\s+--hard\b|` +
        GIT +
        String.raw`(checkout|restore)\s+[^|;&]*\s--\s+\.\s*$`,
    ),
    why: "This discards uncommitted work across the whole tree. Name the specific paths, or commit first.",
  },
  {
    rx: new RegExp(GIT + String.raw`clean\b`),
    why: "`git clean` removes untracked and ignored files silently. Remove specific paths deliberately instead.",
  },
  {
    rx: new RegExp(GIT + String.raw`tag\s+(-a\s+)?\S+@\d`),
    why: "Release tags (`<package>@x.y.z`) are created by CI from a merged version PR, never by hand.",
  },

  // --- Database / release process ---------------------------------------------------
  {
    rx: /\bDROP\s+(DATABASE|SCHEMA)\b/i,
    why: "Dropping a database is a human decision. Use `encore db reset <service>` for a local reset (itself a human-confirmed step).",
  },
  {
    rx: /\b(drizzle-kit|mikro-orm)\s+(push|migrate|migration:up|schema:update)\b/,
    why: "Encore applies migrations when the app runs. Write `<n>_<name>.up.sql` by hand, then `encore run`; never push directly to a database.",
  },
  {
    rx: /\bchangeset(\s+|:)version\b/,
    why: "`changeset version` runs in CI (the Release workflow's version PR). Locally, add a changeset with `pnpm changeset`; the version bump is the version PR's job.",
  },
];

async function main() {
  const input = await readStdin();
  const cwd = String(input.cwd || process.cwd());
  const raw = String(input.tool_input?.command ?? "");
  const cmd = stripHeredocs(raw);
  const bare = blank(cmd);

  let asked;
  for (const rule of rules) {
    const target = rule.scan === "bare" ? bare : cmd;
    const hit = typeof rule.rx === "function" ? rule.rx(target, cwd) : rule.rx.test(target);
    if (!hit || (rule.allow && rule.allow.test(target))) continue;
    if (rule.decision === "ask") asked ??= rule;
    else deny(EVENT, `${rule.why}\nBlocked command: ${raw.slice(0, 200)}`);
  }
  if (asked) ask(EVENT, `${asked.why}\nCommand: ${raw.slice(0, 200)}`);
}

await failOpen(main);
