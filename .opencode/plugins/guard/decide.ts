// Pure decision functions for the Stackra OpenCode guard plugin (index.ts). No I/O, so node:test can cover them.
// Ported from the Academorix guard; mirrors .agents/hooks/guard-bash.mjs + guard-paths.mjs for the secret rules.
// The executor rules (owner-only CLIs, git history, releases) live here rather than only in opencode.jsonc,
// whose permission list is order-sensitive; the jsonc denies stay as a second layer.
// shortcut: commands are split on && || ; | and newlines without honouring quotes, and `sh -c "<inner>"`
// is not unwrapped; good enough for agent-typed commands, upgrade to a real shell parser if one slips through.
import { resolve, sep } from "node:path";

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
export function decidePath(path: string): Decision {
  return isSecretPath(path)
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
  const secret = decidePath(path);
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

/** git's subcommand, skipping global options (`-C dir`, `-c k=v`, `--git-dir=…`). */
function gitSubcommand(args: string[]): string {
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "-C" || args[i] === "-c") i++;
    else if (!args[i].startsWith("-")) return args[i];
  }
  return "";
}

const OWNER_ONLY_CLI = new Set(["gh", "wrangler", "curl", "wget"]);
const GIT_OWNER_ONLY = new Set(["push", "commit", "merge", "rebase", "tag", "worktree"]);

/** Executors run unattended: anything that leaves the worktree, ships, or rewrites history is the lead's. */
function denyExecutor(sub: string, cmd: string, args: string[]): Decision {
  if (OWNER_ONLY_CLI.has(cmd))
    return deny(`\`${cmd}\` reaches the network or a shared account; executors never run it.`);
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
  if (cmd === "git") {
    const g = gitSubcommand(args);
    if (GIT_OWNER_ONLY.has(g) || (g === "branch" && args.includes("-D")))
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

export function decideShell(raw: string): Decision {
  for (const s of subcommands(stripHeredocs(raw))) {
    const d = denySub(s);
    if (d.kind === "deny") return d;
  }
  return ALLOW;
}
