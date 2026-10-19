#!/usr/bin/env node
/**
 * PreToolUse (Bash): refuse commands that destroy history, print secrets, or bypass the release process.
 * Patterns are scoped to the *operand* of the command, not to a bare keyword.
 *
 * Known limit / workaround: the `rm -rf` rule scans the whole command (quoted text included), because
 * stripping quotes would let `bash -c "rm -rf /"` through. If you are only *writing* a file whose content
 * mentions `rm -rf` (e.g. a package.json `clean` script), use a heredoc (bodies are ignored) or the
 * Write/Edit tools instead of `python -c "..."` / `echo "..."`.
 * The `env`/`printenv` rule only looks at command position (quoted strings are blanked first), so
 * `node -e 'v.env'` or `cat apps/x/eas.json` are fine.
 */
import { readStdin, deny } from "./_io.mjs";

const input = await readStdin();
const raw = String(input.tool_input?.command ?? "");
const event = "PreToolUse";

/**
 * Heredoc bodies are file content, not commands: `cat > rules.md <<'EOF' … EOF` must not trip a rule
 * because the prose mentions a forbidden command. Strip every heredoc body before matching.
 */
const cmd = raw.replace(
  /<<-?\s*(['"]?)([A-Za-z_][A-Za-z0-9_]*)\1[^\n]*\n[\s\S]*?\n\s*\2\s*(?=\n|$)/g,
  "<<HEREDOC_BODY_STRIPPED",
);

/** Quoted strings blanked, so a word inside `node -e '...'` is not mistaken for a command. */
const bare = cmd.replace(/'[^']*'|"(?:\\.|[^"\\])*"/g, '""');
/** Command position: start, or after a separator, optionally behind `VAR=x` assignments. */
const CMDPOS = String.raw`(?:^|[|;&(\n])\s*(?:\w+=\S*\s+)*`;

/** `git` followed by any global options before the subcommand. */
const GIT = String.raw`\bgit\s+(?:(?:-[Cc]\s+\S+|--(?:git-dir|work-tree|namespace)(?:=\S+|\s+\S+)|--no-pager|--literal-pathspecs)\s+)*`;

const rules = [
  {
    rx: /\binfisical\b[^|;&\n]*\bexport\b/,
    why: "Secrets guard: `infisical export` dumps every secret value into the transcript. Developer tokens are fetched by tools/scripts/mcp.sh; agents never read them.",
  },
  {
    rx: (c) => /\binfisical\s+secrets\s+get\b/.test(c) && !/--silent\b/.test(c),
    why: "Secrets guard: `infisical secrets get` prints the value. Only the `--silent` form (no value echoed) is allowed.",
  },
  {
    rx: /\bencore\s+secret\s+(set|get|list\s+--values?)\b/,
    why: 'Secrets guard: `encore secret set/get` are a human\'s to run. Declare the secret with `secret("NAME")` in code and name it in your report; a human sets the value per environment.',
  },
  {
    rx: /\bwrangler\s+secret\s+(put|bulk)\b/,
    why: "Secrets guard: `wrangler secret put/bulk` are a human's to run, same as `encore secret set`. Declare the secret and name it in your report; a human sets the value per environment.",
  },
  {
    rx: /(?:^|[|;&\s])(cat|less|more|head|tail|bat|sed|awk|grep)\b[^|;&\n]*\s(?:\.\/)?\.env(?:\s|$)/m,
    why: "Secrets guard: .env holds live tokens and is never read into the transcript. Secret values live in Encore's secret store (application) or the vault (developer tokens), never in a file.",
  },
  {
    rx: /(?:^|[|;&\s])(cat|less|more|head|tail|bat|sed|awk|grep)\b[^|;&\n]*\s(?:\.\/)?\.dev\.vars(?:\s|$)/m,
    why: "Secrets guard: .dev.vars (Wrangler's local secret file) holds live tokens and is never read into the transcript, same as .env.",
  },
  {
    scan: "bare",
    rx: new RegExp(CMDPOS + String.raw`(printenv|env)\s*(?:$|[|;&)\n])`),
    why: "Printing the whole environment can leak injected tokens into the transcript. Echo the single variable you need, without its value if it is a secret.",
  },
  {
    rx: new RegExp(GIT + String.raw`clean\b`),
    why: "`git clean` removes untracked and ignored files silently. Remove specific paths deliberately instead.",
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
    rx: /\brm\s+-[a-zA-Z]*r[a-zA-Z]*f\b|\brm\s+-[a-zA-Z]*f[a-zA-Z]*r\b/,
    why: "`rm -rf` is never the right tool here. Delete specific paths without -f so a wrong path fails loudly.",
  },
  {
    rx: new RegExp(GIT + String.raw`push\s+[^|;&]*--force(?!-with-lease)`),
    why: "Force-push rewrites shared history. Use --force-with-lease, and only on your own branch.",
  },
  {
    rx: new RegExp(GIT + String.raw`tag\s+(-a\s+)?\S+@\d`),
    why: "Release tags (`<package>@x.y.z`) are created by CI from a merged version MR (tools/scripts/tag-released-packages.mjs), never by hand.",
  },
  {
    rx: /\bDROP\s+(DATABASE|SCHEMA)\b/i,
    why: "Dropping a database is a human decision. Use `encore db reset <service>` for a local reset.",
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

for (const rule of rules) {
  const hit =
    typeof rule.rx === "function" ? rule.rx(cmd) : rule.rx.test(rule.scan === "bare" ? bare : cmd);
  if (hit) deny(event, `${rule.why}\nBlocked command: ${raw.slice(0, 200)}`);
}
process.exit(0);
