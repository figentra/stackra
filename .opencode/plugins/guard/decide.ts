// Pure decision functions for the Stackra OpenCode guard plugin (index.ts). No I/O, so node:test can cover them.
// Ported from the Academorix guard; mirrors .agents/hooks/guard-bash.mjs + guard-paths.mjs for the secret rules.
// shortcut: commands are split on && || ; | and newlines without honouring quotes, and `sh -c "<inner>"`
// is not unwrapped; good enough for agent-typed commands, upgrade to a real shell parser if one slips through.

export type Decision = { kind: "allow" } | { kind: "deny"; reason: string };

export interface GuardContext {
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

/** edit tool: refuse in the main checkout; delegated work belongs in a worktree (`pnpm delegate`). */
export function decideEdit(path: string, ctx: GuardContext): Decision {
  const secret = decidePath(path);
  if (secret.kind === "deny") return secret;
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

function denySub(sub: string): Decision {
  const ws = head(words(sub));
  const cmd = base(ws[0] ?? "");
  const args = ws.slice(1);

  // a commit message may mention .env; the file itself can't be staged (git add is denied in opencode.jsonc)
  const scan = cmd === "git" && args.includes("commit") ? "" : sub;
  for (const t of tokens(scan))
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
  if (
    cmd === "infisical" &&
    args[0] === "secrets" &&
    args[1] === "get" &&
    !args.includes("--silent")
  )
    return deny("`infisical secrets get` without --silent prints values. Humans only.");
  if (
    cmd === "encore" &&
    args[0] === "secret" &&
    (["get", "set"].includes(args[1] ?? "") ||
      (args[1] === "list" && args.some((a) => a.startsWith("--value"))))
  )
    return deny(
      '`encore secret get/set` is a human\'s job. Declare secret("Name") in code and name it in your report.',
    );
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
