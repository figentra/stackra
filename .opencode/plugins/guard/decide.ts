// Decision functions for the Stackra OpenCode guard plugin (index.ts), covered by node:test.
// The permission tiers live in .agents/hooks/_rules.mjs, shared with the Claude hooks (ADR 0293), so the two tools
// never drift. OpenCode runs unattended (ADR 0066) and `--auto` approves any ask, so an ask is a deny here, through
// the same `unattended` the Claude hook applies to every ask outside `HUMAN_ASKS` (STA-400); here the deletes and
// deploys in `HUMAN_ASKS` are denied too, so they stay with the lead. On top of the shared rules sits the
// executor layer: what only the lead does (owner-only CLIs, the GitHub bot wrappers beyond the executor's own push,
// Infisical, local data git cannot restore) and edits outside the worktree. The categorical asks STA-400 allows for
// Claude (`npx`, `pnpm dlx`, `eas`, `wrangler secret|--remote`, `secrets:import --confirm`) stay denied here through
// the shared `executor` rules, so each wrapper the shared rules read through is covered.
// opencode.jsonc repeats the same tiers as order-sensitive patterns, a second layer.
// shortcut: executor commands are split on && || ; | and newlines without honouring quotes; nested scripts come
// from the shared scanShell / scriptStrings; upgrade to a real shell parser if one slips through.
import { resolve, sep } from "node:path";
import {
  rawSubstitutions,
  scanShell,
  scriptStrings,
  stripHeredocs,
} from "../../../.agents/hooks/_inbox.mjs";
import {
  decideBash,
  decideRead,
  decideWrite,
  isSecretPath,
  unattended,
} from "../../../.agents/hooks/_rules.mjs";

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
/** A shared tier as an OpenCode decision: ask is deny (`unattended`, with its rewrite hint), as nobody answers. */
const tier = (d: { decision: string; reason: string }): Decision => {
  const u = unattended(d);
  return u.decision === "allow" ? ALLOW : deny(u.reason);
};

// Heredoc bodies are file content, not commands (the shared stripHeredocs).
export { stripHeredocs };

// ---- paths -------------------------------------------------------------------------------------------

/** read, glob and grep tool paths: the secrets inbox (ADR 0257) and secret files. */
export function decidePath(path: string, cwd?: string): Decision {
  return tier(decideRead(path, { cwd }));
}

/**
 * edit tool: the shared write rules (secret, generated and tool-owned files), then refuse outside the session's
 * worktree root (an absolute path into the main checkout included) and in the main checkout itself; delegated work
 * belongs in a worktree (`pnpm delegate`).
 */
export function decideEdit(path: string, ctx: GuardContext): Decision {
  const shared = tier(decideWrite(path, { cwd: ctx.root }));
  if (shared.kind === "deny") return shared;
  const root = resolve(ctx.root);
  if (!resolve(root, path).startsWith(root + sep))
    return deny(`${path} is outside this session's worktree (${root}). Edit only files inside it.`);
  return ctx.inMainCheckout && !ctx.allowMain
    ? deny(
        "edits are refused in the main checkout. Work in a git worktree (`pnpm delegate` makes one), or set STACKRA_ALLOW_MAIN=1 for a deliberate exception.",
      )
    : ALLOW;
}

// ---- shell: the executor layer ----------------------------------------------------------------------
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
/** git's subcommand and its arguments, skipping global options (`-C dir`, `-c k=v`, `--git-dir=…`). */
function gitSubcommand(args: string[]): [string, string[]] {
  for (let i = 0; i < args.length; i++) {
    if (GIT_VALUE_OPTS.has(args[i])) i++;
    else if (!args[i].startsWith("-")) return [args[i], args.slice(i + 1)];
  }
  return ["", []];
}

/** CLIs that reach the network, a shared account or the keychain; executors never run them. */
const OWNER_ONLY_CLI = new Set(["gh", "curl", "wget", "infisical", "security"]);
// Network git (STA-208): on a private repo a fetch falls back to the owner's credential helper. STA-214: pack
// plumbing (bypasses the push checks) and `credential` (answers with the owner's token). The shared rules deny
// these too; this is the executor's second layer.
const GIT_OWNER_ONLY = new Set(
  "push fetch pull clone ls-remote submodule subtree send-pack receive-pack fetch-pack upload-pack credential".split(
    " ",
  ),
);
/** `git remote update|show|prune`, `git archive --remote` and `git credential-<helper>` reach a remote or a token. */
const networkGit = (g: string, args: string[]): boolean =>
  g.startsWith("credential-") ||
  (g === "remote" && args.some((a) => ["update", "show", "prune"].includes(a))) ||
  (g === "archive" && args.some((a) => a.startsWith("--remote")));
/** Local data git cannot restore (Claude's ask tier): branch -D, stash drop, worktree remove|prune, reflog expiry. */
const losesLocalData = (g: string, rest: string[]): boolean =>
  (g === "branch" && rest.some((a) => /^-[a-zA-Z]*D/.test(a))) ||
  (g === "stash" && rest[0] === "drop") ||
  (g === "worktree" && ["remove", "prune"].includes(rest[0] ?? "")) ||
  (g === "reflog" && ["expire", "delete"].includes(rest[0] ?? ""));
/** The GitHub and Linear wrappers run under the full /agents set (STA-208): the lead's, except the executor push. */
const BOT_SCRIPT = /^(?:bot:\S+|pr:merge|linear|spec:linear)$/;
/**
 * Phase 2 (ADR 0293, amending ADR 0066): an executor fetches origin (one ref at most), and pushes its own HEAD to its
 * feature branch, through `pnpm bot:git`; the shared rules keep that push off main and off every other branch, and
 * deny the options that run a program in the bot's environment. The whole command must be one of these forms: a
 * prefix (`NODE_OPTIONS=`, `PATH=`, `env`, `export …;`, `cd x &&`, `source f;`) would run the executor's own code
 * with every /agents value (STA-330 review).
 */
const EXECUTOR_BOT_GIT =
  /^pnpm bot:git (?:-- )?(?:fetch origin(?: [\w./-]+)?|push (?:--force-with-lease )?origin HEAD)$/;

/** Executors run unattended: anything that leaves the worktree, ships, or destroys local data is the lead's. */
function denyExecutor(cmd: string, args: string[], exact: boolean): Decision {
  if (OWNER_ONLY_CLI.has(cmd) || cmd.startsWith("git-credential"))
    return deny(
      `\`${cmd}\` reaches the network, a shared account or a secret store; executors never run it.`,
    );
  if (cmd === "pnpm" && args.some((a) => BOT_SCRIPT.test(a)))
    return exact
      ? ALLOW
      : deny(
          "executors reach GitHub only as the whole command `pnpm bot:git -- fetch origin [<ref>]` or `pnpm bot:git -- push [--force-with-lease] origin HEAD`, with nothing before or after it; `pnpm bot:gh`, `bot:review`, `bot:token`, `pr:merge` and `linear` are the lead's.",
        );
  if (cmd === "encore" && ["deploy", "env", "secret"].includes(args[0] ?? ""))
    return deny(
      `\`encore ${args[0]}\` touches a shared environment or its secrets; the owner runs it.`,
    );
  if (
    cmd === "docker" &&
    args.includes("down") &&
    args.some((a) => a === "-v" || a === "--volumes")
  )
    return deny("`docker compose down -v` deletes volumes git cannot restore; the lead runs it.");
  if (cmd === "git") {
    const [g, rest] = gitSubcommand(args);
    const localSubmodule = g === "submodule" && ["status", "summary"].includes(rest[0] ?? "");
    if ((GIT_OWNER_ONLY.has(g) && !localSubmodule) || networkGit(g, args))
      return deny(`\`git ${g}\` reaches a remote; executors push only through \`pnpm bot:git\`.`);
    if (losesLocalData(g, rest))
      return deny(
        `\`git ${g} ${rest[0] ?? ""}\` deletes local data git cannot restore; the lead runs it.`,
      );
  }
  return ALLOW;
}

function denySub(sub: string, exact: boolean): Decision {
  const ws = head(words(sub));
  const cmd = base(ws[0] ?? "");
  const args = ws.slice(1);

  const executor = denyExecutor(cmd, args, exact);
  if (executor.kind === "deny") return executor;

  for (const t of tokens(sub))
    if (isSecretPath(t)) return deny(`${t} holds secret values; never read, copy or print it.`);
  if (cmd === "export" && args[0] === "-p")
    return deny(
      "printing the environment leaks injected tokens. Echo the one variable you need (never a secret's value).",
    );
  for (const t of tokens(sub))
    if (/(^|\/)\d+-infisical-(setup|config)\.sh$/.test(t))
      return deny(
        `${base(t)} configures the vault with real credentials; owner-run only. Never run, trace (sh -x) or source it.`,
      );
  return ALLOW;
}

/** `cwd` is the shell's directory: the own-worktree, push and rm rules resolve against it. */
export function decideShell(raw: string, cwd?: string): Decision {
  // `executor`: the shared executor rules (npx, eas, wrangler secret|--remote, secrets:import --confirm), read
  // through every runner and wrapper the shared rules know (STA-400 review).
  const shared = tier(decideBash(raw, { cwd: cwd ?? process.cwd(), executor: true }));
  if (shared.kind === "deny") return shared;
  const exact = EXECUTOR_BOT_GIT.test(raw.trim());
  const cmd = stripHeredocs(raw);
  // Substitution bodies found with quotes ignored can only add denies (STA-254); `literal` splits a case pattern
  // from its command (`a) cmd`, `(a) cmd`).
  for (const text of [
    cmd,
    scanShell(cmd).literal,
    ...nested(cmd),
    ...rawSubstitutions(cmd).flatMap((b) => [b, ...nested(b)]),
  ])
    for (const s of subcommands(text)) {
      const d = denySub(s, exact);
      if (d.kind === "deny") return d;
    }
  return ALLOW;
}

/**
 * Commands the shell also runs: `$(…)` and backtick bodies (inside double quotes too; single quotes stay literal)
 * and `sh -c` / `eval` strings, at any depth via the shared `scanShell` (STA-254), plus function, alias and piped
 * script bodies (STA-291).
 */
function nested(cmd: string): string[] {
  const out = scanShell(cmd).bodies.flatMap((b) => [b, ...nested(b)]);
  for (const s of scriptStrings(cmd)) out.push(s, ...nested(s));
  return out;
}
