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
import { resolve, sep } from "node:path";
import { readStdin, deny, ask, failOpen } from "./_io.mjs";
import { reachesInbox } from "./_inbox.mjs";

const EVENT = "PreToolUse";

/**
 * Heredoc bodies are file content, not commands: `cat > rules.md <<'EOF' … EOF` must not
 * trip a rule because the prose mentions a forbidden command. Strip every heredoc body
 * before matching.
 */
function stripHeredocs(raw) {
  return raw.replace(
    /<<-?\s*(['"]?)([A-Za-z_][A-Za-z0-9_]*)\1[^\n]*\n[\s\S]*?\n\s*\2\s*(?=\n|$)/g,
    "<<HEREDOC_BODY_STRIPPED",
  );
}

/** `git` followed by any global options before the subcommand. */
const GIT = String.raw`\bgit\s+(?:(?:-[Cc]\s+\S+|--(?:git-dir|work-tree|namespace)(?:=\S+|\s+\S+)|--no-pager|--literal-pathspecs)\s+)*`;

/** Command position: start, or after a separator, optionally behind `VAR=x` assignments. */
const CMDPOS = String.raw`(?:^|[|;&(\n])\s*(?:\w+=\S*\s+)*`;

/** `git` output in `cwd`, or "" when git fails. */
function git(cwd, ...args) {
  const r = spawnSync("git", args, { cwd, encoding: "utf8" });
  return r.status === 0 ? r.stdout.trim() : "";
}

/** Command segments (split on separators, quotes kept). */
const segments = (c) => c.split(/&&|\|\||[|;&\n]/);
const unquote = (w) => w.replace(/^['"]+|['"]+$/g, "");
/** Commit / tag message text is prose, not a command: blank the quoted `-m` / `--message` value. */
const dropMessages = (c) =>
  c.replace(/(\s(?:-m|--message)(?:\s+|=))("(?:\\.|[^"\\])*"|'[^']*')/g, "$1MSG");

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

/**
 * `git push` whose destination is main: an explicit refspec (`main`, `HEAD:main`,
 * `+main`, `refs/heads/main`, `:main`), `--all` / `--mirror`, or no refspec (or `HEAD`)
 * while main is checked out. A branch that merely contains "main" is fine.
 */
function pushesMain(c, cwd) {
  const PUSH = new RegExp(GIT + String.raw`push\b(.*)$`);
  return segments(dropMessages(c)).some((seg) => {
    const m = seg.match(PUSH);
    if (!m) return false;
    const args = m[1].split(/\s+/).map(unquote).filter(Boolean);
    if (args.some((a) => a === "--all" || a === "--mirror")) return true;
    const refs = args.filter((a) => !a.startsWith("-"));
    if (refs.some((r) => refspecDest(r) === "main")) return true;
    const implicit = refs.length <= 1 || refs.slice(1).every((r) => r === "HEAD");
    return implicit && git(cwd, "symbolic-ref", "--short", "HEAD") === "main";
  });
}

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
    rx: (c) => {
      const scanned = dropMessages(c);
      if (/Secrets-inbox|secrets-confirm\.key/i.test(scanned)) return true;
      // Globs (`~/Secrets-inbo?/*`) and home-wide recursive reads (`grep -r x ~`). Accident guard only.
      return segments(scanned).some((seg) => {
        const recursive =
          /\b(?:rg|ag|find|tar|zip|rsync|du)\b/.test(seg) ||
          /\bgrep\b[^|;&]*\s(?:-\w*[rR]\w*|--recursive|--directories=recurse|-d\s*recurse)\b/.test(
            seg,
          ) ||
          /\bcp\b[^|;&]*\s(?:-\w*[rRa]\w*|--recursive|--archive)\b/.test(seg);
        return seg.split(/[\s'"`=<>()+,]+/).some((tok) => reachesInbox(tok, { recursive }));
      });
    },
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
  {
    rx: /\bgh\s+pr\s+merge\b[^|;&\n]*\s--admin\b/,
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
  /** Quoted strings blanked, so a word inside `node -e '...'` is not mistaken for a command. */
  const bare = cmd.replace(/'[^']*'|"(?:\\.|[^"\\])*"/g, '""');

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
