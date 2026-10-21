// Pure decision functions for the Stackra OpenCode guard plugin (index.ts). No I/O, so node:test can cover them.
// Ported from the Academorix guard; mirrors .agents/hooks/guard-bash.mjs + guard-paths.mjs for the secret rules.
// The executor rules (owner-only CLIs, git history, releases) live here rather than only in opencode.jsonc,
// whose permission list is order-sensitive; the jsonc denies stay as a second layer.
// shortcut: commands are split on && || ; | and newlines without honouring quotes, and `sh -c "<inner>"`
// is not unwrapped; good enough for agent-typed commands, upgrade to a real shell parser if one slips through.
import { resolve, sep } from "node:path";
// The inbox matcher is shared with the Claude hooks (one matcher, ADR 0257): paths, globs rooted at home, recursive reads.
import { commandReachesInbox, reachesInbox } from "../../../.agents/hooks/_inbox.mjs";

export type Decision = { kind: "allow" } | { kind: "deny"; reason: string };

export interface GuardContext {
  /** The session's worktree root (absolute); edits must resolve strictly inside it. */
  root: string;
  /** True when cwd is the main checkout (git-dir equals git-common-dir), not a linked worktree. */
  inMainCheckout: boolean;
  /** STACKRA_ALLOW_MAIN=1 */
  allowMain: boolean;
}

const ALLOW: Decision = { kind: "allow" };
const deny = (reason: string): Decision => ({ kind: "deny", reason: `stackra-guard: ${reason}` });

// Heredoc bodies are file content, not commands (same as guard-bash.mjs).
const HEREDOC = /<<-?\s*(['"]?)([A-Za-z_][A-Za-z0-9_]*)\1[^\n]*\n[\s\S]*?\n\s*\2\s*(?=\n|$)/g;
export const stripHeredocs = (c: string): string => c.replace(HEREDOC, "<<HEREDOC");

// ---- paths -------------------------------------------------------------------------------------------
const SECRET_FILE = [
  /(^|\/)\.env(\.[^/]*)?$/,
  /(^|\/)[^/]*\.secrets[^/]*$/,
  /(^|\/)\.ci-env$/,
  /(^|\/)\.sentryclirc$/,
  /(^|\/)\.infisical([^/]*$|\/)/,
];
// Committed, value-free files: the env template and Infisical's project config.
const SECRET_OK = /(^|\/)(\.env\.example|\.infisical\.(yaml|json))$/;

export function isSecretPath(p: string): boolean {
  const s = p.trim().replace(/^['"]+|['"]+$/g, "");
  return !SECRET_OK.test(s) && SECRET_FILE.some((r) => r.test(s));
}

/** read / edit tool paths. */
export function decidePath(path: string, cwd?: string): Decision {
  // The secrets inbox (ADR 0257): only `pnpm secrets:import` touches it, and it never prints a value.
  return isSecretPath(path) || reachesInbox(path, { cwd })
    ? deny(
        `${path} holds secret values and is never read or written by an agent. Names only; values are set by a human (Infisical).`,
      )
    : ALLOW;
}

/**
 * edit tool: refuse outside the session's worktree root (an absolute path into the main checkout included) and
 * in the main checkout itself; delegated work belongs in a worktree (`pnpm delegate`).
 */
export function decideEdit(path: string, ctx: GuardContext): Decision {
  const secret = decidePath(path, ctx.root);
  if (secret.kind === "deny") return secret;
  const root = resolve(ctx.root);
  if (!resolve(root, path).startsWith(root + sep))
    return deny(`${path} is outside this session's worktree (${root}). Edit only files inside it.`);
  return ctx.inMainCheckout && !ctx.allowMain
    ? deny(
        "edits are refused in the main checkout. Work in a git worktree (`pnpm delegate` makes one), or set STACKRA_ALLOW_MAIN=1 for a deliberate exception.",
      )
    : ALLOW;
}

// ---- shell parsing -----------------------------------------------------------------------------------
const tokens = (s: string): string[] => s.split(/[\s=<>()'"`]+/).filter(Boolean);
const words = (s: string): string[] =>
  (s.match(/'[^']*'|"[^"]*"|\S+/g) ?? []).map((w) => w.replace(/^(['"])(.*)\1$/, "$2"));
const base = (w: string): string => w.split("/").pop() ?? w;

/** Drop leading VAR=x, env VAR=x, sudo, command, exec, time, nohup. */
function head(ws: string[]): string[] {
  let i = 0;
  while (
    i < ws.length &&
    (/^[A-Za-z_][A-Za-z0-9_]*=/.test(ws[i]) ||
      ["sudo", "command", "exec", "time", "nohup"].includes(ws[i]) ||
      (ws[i] === "env" && /=/.test(ws[i + 1] ?? "")))
  )
    i++;
  return ws.slice(i);
}

const subcommands = (cmd: string): string[] =>
  cmd
    .split(/&&|\|\||;|\||\n/)
    .map((s) => s.trim())
    .filter(Boolean);

/** Global options whose value is the next word (`--git-dir=x` carries its value and is skipped as a flag). */
const GIT_VALUE_OPTS = new Set(["-C", "-c", "--git-dir", "--work-tree", "--namespace"]);
/** The only `-c` keys an agent may set: display and identity, none runs a command or redirects a remote (STA-216). */
const ALLOWED_C =
  /^(?:color\.ui|color\.diff|color\.status|color\.branch|core\.quotepath|core\.abbrev|core\.precomposeunicode|user\.name|user\.email|advice\.detachedhead|diff\.renames|diff\.algorithm|diff\.context|diff\.noprefix|log\.abbrevcommit|log\.decorate|log\.date|merge\.ff|merge\.conflictstyle|pull\.rebase|pull\.ff|push\.default|rebase\.autosquash|init\.defaultbranch|column\.ui|status\.short|status\.branch|status\.showuntrackedfiles)$/i;
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
/** `git config` arguments that are not a plain read: the first option reads, and no write flag follows. */
function configWrites(args: string[]): boolean {
  const hash = args.findIndex((a) => a.startsWith("#"));
  const [first, ...rest] = hash < 0 ? args : args.slice(0, hash);
  const reads =
    CONFIG_READ.has(first) ||
    (["--show-origin", "--show-scope"].includes(first) && rest.some((w) => CONFIG_READ.has(w)));
  return !reads || rest.some((w) => CONFIG_WRITE.has(w));
}
/** `-c` outside the allow-list, `--config-env`, or a `git config` that is not a read (STA-216). */
const gitAliasConfig = (args: string[]): boolean => {
  let sub = -1;
  for (let i = 0; i < args.length && sub < 0; i++) {
    if (GIT_VALUE_OPTS.has(args[i])) i++;
    else if (!args[i].startsWith("-")) sub = i;
  }
  return (
    args.some(
      (a, i) =>
        /^--config-env\b/.test(a) ||
        (a === "-c" && !ALLOWED_C.test((args[i + 1] ?? "").split("=")[0])) ||
        /^-c./.test(a),
    ) ||
    (args[sub] === "config" && configWrites(args.slice(sub + 1)))
  );
};
/** Env prefixes that swap git's config files or the pager (STA-216). */
const CONFIG_ENV =
  /(?:^|\s)(?:GIT_EDITOR|GIT_SEQUENCE_EDITOR)=(?!(?:true|:|cat)(?:\s|$))|(?:^|\s)(?:GIT_CONFIG[A-Z_0-9]*|HOME|XDG_CONFIG_HOME|MANPAGER|PAGER|GIT_PAGER|GIT_ASKPASS|SSH_ASKPASS|GIT_EXEC_PATH|GIT_SSH(?:_COMMAND)?|GIT_PROXY_COMMAND|GIT_EXTERNAL_DIFF|GIT_TEMPLATE_DIR)=/;

/** git's subcommand, skipping global options (`-C dir`, `-c k=v`, `--git-dir=…`). */
function gitSubcommand(args: string[]): string {
  for (let i = 0; i < args.length; i++) {
    if (GIT_VALUE_OPTS.has(args[i])) i++;
    else if (!args[i].startsWith("-")) return args[i];
  }
  return "";
}

const OWNER_ONLY_CLI = new Set(["gh", "wrangler", "curl", "wget"]);
// Network git too (STA-208): on a private repo a fetch falls back to the owner's credential helper.
// STA-214: pack plumbing (bypasses the push checks) and `credential` (answers with the owner's token) too.
const GIT_OWNER_ONLY = new Set(
  "push commit merge rebase tag worktree fetch pull clone ls-remote submodule subtree send-pack receive-pack fetch-pack upload-pack credential".split(
    " ",
  ),
);
/** `git remote update|show|prune`, `git archive --remote` and `git credential-<helper>` reach a remote or a token. */
const networkGit = (g: string, args: string[]): boolean =>
  g.startsWith("credential-") ||
  (g === "remote" && args.some((a) => ["update", "show", "prune"].includes(a))) ||
  (g === "archive" && args.some((a) => a.startsWith("--remote")));
/** The GitHub bot wrappers (STA-208): the lead reaches GitHub as the bot; executors not at all. */
const BOT_SCRIPT = /^(?:bot:(?:gh|git|review|token)|pr:merge)$/;

/** Executors run unattended: anything that leaves the worktree, ships, or rewrites history is the lead's. */
function denyExecutor(sub: string, cmd: string, args: string[]): Decision {
  if (OWNER_ONLY_CLI.has(cmd) || cmd.startsWith("git-credential"))
    return deny(`\`${cmd}\` reaches the network or a shared account; executors never run it.`);
  if (/\bbot:token\b/.test(sub) || (cmd === "pnpm" && args.some((a) => BOT_SCRIPT.test(a))))
    return deny(
      "the GitHub bot wrappers (`pnpm bot:*`, `pnpm pr:merge`) are the lead's; executors leave changes in the worktree.",
    );
  if (
    cmd === "infisical" &&
    args[0] === "secrets" &&
    !(args[1] === "get" && args.includes("--silent"))
  )
    return deny(
      "`infisical secrets` is the owner's; only `infisical secrets get NAME --silent` is allowed.",
    );
  if (cmd === "encore" && ["deploy", "env", "secret"].includes(args[0] ?? ""))
    return deny(
      `\`encore ${args[0]}\` touches a shared environment or its secrets; the owner runs it.`,
    );
  if (/^git-(?:send|receive|fetch|upload)-pack$/.test(cmd))
    return deny(
      `\`${cmd}\` is pack plumbing that bypasses the git checks; executors never run it.`,
    );
  if (cmd === "git") {
    if (gitAliasConfig(args) || CONFIG_ENV.test(sub))
      return deny(
        "git `-c` / `config` for alias, include, core.fsmonitor|sshCommand|pager|editor|hooksPath and credential keys, `--config-env`, and the GIT_CONFIG*, HOME, XDG_CONFIG_HOME and pager env prefixes make git run other commands past the guard.",
      );
    const g = gitSubcommand(args);
    const readOnly = g === "worktree" && args.includes("list");
    if (
      (GIT_OWNER_ONLY.has(g) && !readOnly) ||
      networkGit(g, args) ||
      (g === "branch" && args.includes("-D"))
    )
      return deny(
        `\`git ${g}\` is the lead's job; executors leave changes uncommitted in the worktree.`,
      );
  }
  if (/\bchangeset[: ]version\b/.test(sub))
    return deny("`changeset version` runs only in the Release workflow; add a changeset instead.");
  return ALLOW;
}

function denySub(sub: string): Decision {
  const ws = head(words(sub));
  const cmd = base(ws[0] ?? "");
  const args = ws.slice(1);

  const executor = denyExecutor(sub, cmd, args);
  if (executor.kind === "deny") return executor;

  for (const t of tokens(sub))
    if (isSecretPath(t)) return deny(`${t} holds secret values; never read, copy or print it.`);

  if (
    cmd === "printenv" ||
    (cmd === "env" && args.length === 0) ||
    (cmd === "export" && args[0] === "-p")
  )
    return deny(
      "printing the environment leaks injected tokens. Echo the one variable you need (never a secret's value).",
    );
  if (
    (cmd === "man" &&
      args.some((a) =>
        /^-[a-zA-Z]*[PHBTC]\b|^--(?:pager|html|browser|troff|ditroff|config-file)/.test(a),
      )) ||
    /(?:^|\s)(?:MANPAGER|PAGER)=/.test(sub)
  )
    return deny("`man -P`, `--pager` and the PAGER env run an arbitrary command as the pager.");
  if (cmd === "infisical" && args[0] === "export")
    return deny("`infisical export` dumps secret values. Humans only.");
  for (const t of tokens(sub))
    if (/(^|\/)\d+-infisical-(setup|config)\.sh$/.test(t))
      return deny(
        `${base(t)} configures the vault with real credentials; owner-run only. Never run, trace (sh -x) or source it.`,
      );

  if (cmd === "git" && args.includes("clean"))
    return deny("`git clean` silently deletes untracked files. Remove specific paths instead.");
  if (cmd === "rm" && args.some((a) => /^-[a-zA-Z]*(rf|fr)[a-zA-Z]*$/.test(a)))
    return deny(
      "`rm -rf` is never the tool here. Delete specific paths without -f so a wrong path fails loudly.",
    );
  return ALLOW;
}

/** `cwd` is the shell's directory, so a relative glob run from home is caught; unknown, relative tokens pass. */
export function decideShell(raw: string, cwd?: string): Decision {
  const cmd = stripHeredocs(raw);
  if (commandReachesInbox(cmd, { cwd }))
    return deny(
      "~/Secrets-inbox/ (and the import confirm key) are never read, listed, copied or moved. Use `pnpm secrets:import --list` for names and `pnpm secrets:import [--dry-run] [NAME]` to import; it never prints a value.",
    );
  for (const text of [cmd, ...nested(cmd)])
    for (const s of subcommands(text)) {
      const d = denySub(s);
      if (d.kind === "deny") return d;
    }
  return ALLOW;
}

/**
 * Commands the shell also runs: `$(…)` and backtick bodies (inside double quotes too; single quotes stay literal)
 * and `sh -c` / `eval` strings (STA-208 review H2). shortcut: one nesting level, no alias expansion.
 */
function nested(cmd: string): string[] {
  const literal = cmd.replace(/'[^']*'/g, "''");
  const out = [...literal.matchAll(/\$\(([^()]*)\)|`([^`]*)`/g)].map((m) => m[1] ?? m[2]);
  for (const m of cmd.matchAll(/\b(?:(?:ba|z|da)?sh\s+-c|eval)\s+(["'])((?:\\.|(?!\1)[^\\])*)\1/g))
    out.push(m[2], ...nested(m[2]));
  return out;
}
