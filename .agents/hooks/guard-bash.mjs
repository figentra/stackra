#!/usr/bin/env node
/**
 * PreToolUse (Bash): refuse commands that destroy history, print or write secrets, or
 * bypass the release / migration process. Patterns are scoped to the *operand* of the
 * command, not to a bare keyword.
 *
 * Secrets model (see .agents/rules/secrets.md): application secrets live in Encore's
 * secret store and are synced from Infisical; developer / CI / MCP tokens live in
 * Infisical (`/agents`, `/ci`, `/services/backend`, `/apps/*`) and reach a process
 * through `infisical run -- <cmd>` or the tools/scripts/mcp.sh vault wrapper. There are
 * no `.env` files in this repository — so the rules below deny (a) dumping a secret
 * value into the transcript and (b) creating a `.env*` file from the shell.
 *
 * Known limit / workaround: the `rm -rf` rule scans the whole command (quoted text
 * included), because stripping quotes would let `bash -c "rm -rf /"` through. If you are
 * only *writing* a file whose content mentions `rm -rf` (e.g. a package.json `clean`
 * script), use a heredoc (bodies are ignored) or the Write/Edit tools instead of
 * `python -c "..."` / `echo "..."`.
 * The `env`/`printenv` rule only looks at command position (quoted strings are blanked
 * first), so `node -e 'v.env'` or `cat apps/x/eas.json` are fine.
 */
import { readStdin, deny, failOpen } from "./_io.mjs";

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

const rules = [
  // --- Secrets: never print a value, never create a .env file ----------------------
  {
    rx: /\binfisical\s+export\b/,
    why: "Secrets guard: `infisical export` decrypts and prints every secret value. Secrets reach a process through `infisical run -- <cmd>` or the tools/scripts/mcp.sh vault wrapper; agents never read one. To check a name exists, list names only.",
  },
  {
    rx: (c) => /\binfisical\s+secrets\s+get\b/.test(c) && !/--silent\b/.test(c),
    why: "Secrets guard: `infisical secrets get` prints the value. Only the `--silent` form (no value echoed) is allowed.",
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
    why: "Secrets guard: never create a .env* file. Secrets only come from Infisical (`infisical run`, tools/scripts/mcp.sh); application secrets use Encore secret().",
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
    why: "`encore deploy` ships to a shared environment and is a human / CI decision. Name the change and let a human deploy.",
  },

  // --- History / worktree destruction ---------------------------------------------
  {
    rx: /\brm\s+-[a-zA-Z]*r[a-zA-Z]*f\b|\brm\s+-[a-zA-Z]*f[a-zA-Z]*r\b/,
    why: "`rm -rf` is never the right tool here. Delete specific paths without -f so a wrong path fails loudly instead of silently.",
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
    why: "Release tags (`<package>@x.y.z`) are created by CI from a merged version MR, never by hand.",
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
    rx: /\bchangeset\s+version\b/,
    why: "`changeset version` runs in CI (release:version-mr). Locally, add a changeset with `pnpm changeset`; the version bump is the MR's job.",
  },
];

async function main() {
  const input = await readStdin();
  const raw = String(input.tool_input?.command ?? "");
  const cmd = stripHeredocs(raw);
  /** Quoted strings blanked, so a word inside `node -e '...'` is not mistaken for a command. */
  const bare = cmd.replace(/'[^']*'|"(?:\\.|[^"\\])*"/g, '""');

  for (const rule of rules) {
    const target = rule.scan === "bare" ? bare : cmd;
    const hit = typeof rule.rx === "function" ? rule.rx(target) : rule.rx.test(target);
    if (hit && !(rule.allow && rule.allow.test(target))) {
      deny(EVENT, `${rule.why}\nBlocked command: ${raw.slice(0, 200)}`);
    }
  }
}

await failOpen(main);
