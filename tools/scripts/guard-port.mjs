#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: port Stackra's agent guard into another repository (STA-449): figentra/os, figentra/muslin or
 *   figentra/juristra. `node tools/scripts/guard-port.mjs <target>/.agents/hooks <os|muslin|juristra>` copies
 *   `_io`, `_inbox`, `_reviewer-agents`, `guard-paths`, `_rules`, `guard-bash` and the differential test from this
 *   checkout's `.agents/hooks`, then patches `_rules.mjs`, `guard-bash.mjs` and the test for the port. Every hunk is
 *   an exact-string replacement whose anchor must occur once, so a drifted upstream fails loudly instead of
 *   half-patching; a rerun copies again first, so it is idempotent. Each added line carries `// port:`.
 * Boundary: writes only the target `.agents/hooks` files it copies and patches, after every hunk applied.
 * Runtime: node
 * Governing contract: ADR 0293 (agent permission tiers and executor pushes); STA-449 (guard port).
 * Upstream: figentra/stackra `.agents/hooks`, written against 34cc99690f70381c77ea37e18d212ec0e9a30dbb (the last
 *   hooks change; origin/main cac2b28). The target repo's `.agents/hooks/README.md` records the SHA it was ported
 *   from, which this script prints.
 * The hunks: the owner's config (`.claude/settings*.json`, `.claude/agents`, `.agents/hooks`, OpenCode config,
 *   `.mcp.json`) and the Stackra checkout are never written, by a tool, the shell or git; `master` counts as main; no
 *   `git stash` but `list` and `show`; app build output is regenerable; the bot scripts must name this checkout
 *   (`-C /abs`), the repository (`-R` or a PR URL), `--head` and absolute files, because they run in the Stackra
 *   checkout; `encore deploy` and a push to the Encore remote are denied; EAS, Tauri and desktop builds and
 *   `bot:gh workflow enable` ask the owner; signing keys are secret files; the owner's secret scripts are denied;
 *   every bot or network-git reason ends with the repo's route (subshell form). Then run oxfmt on the three files.
 * Round 2 (the three repos' verifier findings, folded here so every port gets them): write paths are read
 *   normalised, through symlinks, globs and `$PWD`, as bare redirects, hard links, `dd of=`, folder copies and moves
 *   of `.agents` / `.claude`, `find -exec` / `-delete`, `tar -C` and `unzip -d`; `.git` config, hooks and a
 *   worktree's `.git` file are never written; git puts no other revision's config in place (pathspecs from the
 *   command's folder, tree moves, revert, cherry-pick, index plumbing) and a patch naming config, or read from
 *   stdin, is refused; nothing but the route runs in the Stackra checkout; `bot:gh` writes nothing there and no
 *   `api` ref, contents or rename write; a bot push names its refspec and runs with no changed environment; a
 *   quoted line (`watch '…'`) reaches the gh and network-git rules; home secrets match any case, Read and Grep
 *   paths are normalised, a glob filter's names and a Grep root above a credential folder count; `rsync --delete`
 *   asks. Repo-only rules (muslin's read-only checkouts and shared index, juristra's editable own hooks) stay in
 *   each repo.
 * Exit: 0 patched, 1 an anchor drifted (nothing half-written: files are written only after every hunk applied),
 *   2 usage.
 */
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE = fileURLToPath(new URL("../../.agents/hooks/", import.meta.url));
const STACKRA = "/Users/akouta/Projects/stackra";
const SLUG = { os: "figentra/os", muslin: "figentra/muslin", juristra: "figentra/juristra" };
const COPIED = [
  "_io.mjs",
  "_inbox.mjs",
  "_reviewer-agents.mjs",
  "guard-paths.mjs",
  "_rules.mjs",
  "guard-bash.mjs",
  "__tests__/guard-differential.test.mjs",
];

/** Every `[anchor, replacement]` of `pairs` applied to `s`; throws unless each anchor occurs exactly once. */
export function applyHunks(name, s, pairs) {
  for (const [a, b] of pairs) {
    const n = s.split(a).length - 1;
    if (n !== 1) throw new Error(`${name}: ${n} matches for ${JSON.stringify(a.slice(0, 70))}`);
    s = s.replace(a, () => b);
  }
  return s;
}
/** The text of `s` from `from` through `through`, which must start exactly once. */
function slice(name, s, from, through) {
  const i = s.indexOf(from);
  const j = s.indexOf(through, i);
  if (i < 0 || j < 0 || s.indexOf(from, i + 1) >= 0) throw new Error(`${name}: slice anchors`);
  return s.slice(i, j + through.length);
}

const BUILD = "`node_modules`, `dist`, `.turbo`, `.stackra`, `coverage`, `.cache`";
const BUILD_PORT = `${BUILD}, \`.next\`, \`.expo\`, \`encore.gen\`, \`test-results\`, \`playwright-report\`, \`.lighthouseci\``;

/** The repository's own write row, after the shared ones. */
const REPO_ROW = {
  os: `  {
    rx: /(^|\\/)docs\\/catalogue\\/(?!README\\.md$)[^/]+\\.md$/i, // port: os
    why: "docs/catalogue/<service>.md is generated from its YAML. Edit docs/catalogue/<service>.yaml and run \`node tools/scripts/catalogue.mjs render\`.",
  },
`,
  muslin: `  {
    rx: /^\\/Users\\/akouta\\/Projects\\/academorix\\//, // port: muslin
    why: "academorix is a read-only reference for Muslin (.opencode/rules/platform-rules.md, docs/HANDOVER.md §2); never write there.",
  },
`,
  juristra: "", // juristra keeps its own path rules in repo-paths.mjs
};

/** Source text, raw: backslashes kept, an escaped backtick written as a plain one. */
const code = (strings, ...values) => String.raw(strings, ...values).replaceAll("\\`", "`");

/** Constants and rules the port adds to `_rules.mjs`, before `RULES`. */
const PORT_RULES = code`// ---- port: the rules of a vendored copy (figentra/stackra tools/scripts/guard-port.mjs) -------------------

/** port: the guard, permission settings, agent definitions, OpenCode config and .mcp.json belong to the owner. */
const AGENT_CONFIG =
  /(?:^|\/)(?:\.claude\/(?:settings(?:\.local)?\.json$|agents(?:\/|$))|\.agents\/hooks(?:\/|$)|(?:\.opencode\/)?opencode\.jsonc?$|\.opencode\/(?:agents?|plugins)(?:\/|$)|\.mcp\.json$)/i;
const AGENT_CONFIG_WHY =
  "The guard (.agents/hooks), .claude/settings*.json, agent definitions, OpenCode config and .mcp.json are the owner's: no agent writes them, by a tool, the shell or git. Propose the change in chat; guard syncs come from the Stackra checkout (.agents/hooks/README.md).";
/** port: a folder that holds agent config, named whole: moving, deleting, chmod-ing or filling it moves the guard. */
const CONFIG_DIR = /(?:^|\/)\.(?:claude|agents|opencode)\/?$/i;
/**
 * port: git's config and hooks, a worktree's \`.git\` file and the user's git config: an alias, credential helper,
 * push URL, hook or \`gitdir\` written there runs past the push and GitHub rules.
 */
const GIT_INTERNALS =
  /(?:^|\/)(?:\.git$|\.git\/(?:config(?:\.worktree)?$|hooks(?:\/|$)|worktrees\/[^/]+\/config(?:\.worktree)?$)|\.gitconfig$|\.config\/git\/config$)/i;
const GIT_INTERNALS_WHY =
  "Git's config files, .git/hooks and a worktree's \`.git\` file are written only by git: an alias (\`!gh …\`), a credential helper, a push URL, a hook or another git directory written there runs past the push and GitHub rules. Use \`git config\` with an allowed key, or propose the change in chat.";
/** port: the Stackra checkout and its worktrees: the bot wrappers run from there with every /agents value. */
const STACKRA_TREE = /^\/Users\/akouta\/Projects\/stackra(?:\/|$)/i;
const STACKRA_WHY =
  "The Stackra checkout is not this repository's: its bot wrappers (package.json, tools/scripts/bot-*.mjs, pr-merge.mjs, .infisical.yaml) run with every /agents value, so no session here writes, moves or checks out anything under /Users/akouta/Projects/stackra. Change Stackra from a session rooted there.";
/** port: temporary folders: a copy of config there that is no checkout (\`cp -r .claude <scratchpad>\`) is no guard. */
const TEMP = /^\/(?:private\/)?(?:tmp|var\/folders)\//;
/** port: true when the absolute path matches the config pattern rx anywhere but in a temporary copy. */
function guards(abs, rx) {
  const m = rx.exec(abs);
  if (!m) return false;
  const root = abs.slice(0, m.index) || "/";
  return !TEMP.test(realDir(root) + "/") || existsSync(join(root, ".git"));
}
/** port: commands that write every operand (sed and perl only with -i / --in-place); mv removes its sources. */
const WRITER =
  /^(?:tee|dd|truncate|chmod|chown|chflags|rm|unlink|touch|patch|sed|perl|mv|cp|ln|link|install|rsync|ditto)$/;
/** port: copiers, which write their destination: the last operand, or the -t value. */
const COPIER = /^(?:cp|ln|install|rsync|ditto|mv)$/;
/** port: a sed substitution or transliteration (\`s/a/b/g\`, \`1,5s|a|b|\`, \`y/ab/ba/\`): a program, not a path. */
const SED_SCRIPT = /^(?:\d+(?:,\d+)?)?[sy]([^\w\s\\]).*\1.*\1[a-zA-Z\d]*$/;
/**
 * port: the paths a simple command (run in dir, null: unknown) writes: its > targets (not a 2>&1 duplication); a
 * writer's operands (dd's of=; not a sed or perl program); every operand of a hard link (\`ln\`, \`link\`,
 * \`cp -l\`), which shares its file; a copier's destination, each source's name under it and, for a folder source,
 * its entries there (\`cp -R /tmp/e/ .\`); the folder tar or unzip extracts into; and find's start paths when it
 * deletes or runs a writer on \`{}\`.
 */
function writtenPaths(words, redirects, dir = null) {
  const out = redirects
    .filter((r) => />/.test(r.op) && !(/&/.test(r.op) && /^(?:\d+|-)$/.test(r.target)))
    .map((r) => r.target);
  const names = nameIndexes(words);
  const k = names.find((i) => basename(words[i]) === "find") ?? names.at(-1) ?? 0;
  const name = basename(words[k] ?? "");
  const args = words.slice(k + 1);
  const valueOf = (rx) => args.find((w, i) => rx.test(args[i - 1] ?? ""));
  const extracts = args.some(
    (w, i) =>
      /^(?:--extract|--get|-[a-zA-Z]*x[a-zA-Z]*)$/.test(w) ||
      (i === 0 && /^[a-zA-Z]*x[a-zA-Z]*$/.test(w)),
  );
  if (name === "tar" && extracts) {
    const eq = args.find((w) => w.startsWith("--directory="));
    return [...out, valueOf(/^(?:-C|--directory)$/) ?? eq?.slice(12) ?? "."];
  }
  if (name === "unzip") return [...out, valueOf(/^-d$/) ?? "."];
  if (name === "find") {
    let j = 0;
    while (/^-(?:[HLP]|O\d*|D)$/.test(args[j] ?? "")) j += args[j] === "-D" ? 2 : 1;
    const first = args.findIndex((w, i) => i >= j && /^[-(!]/.test(w));
    const starts = first === j ? ["."] : args.slice(j, first < 0 ? args.length : first);
    // each -exec command, up to its \`;\` or \`+\`, writes what find found when it writes \`{}\`
    const execs = args.flatMap((w, i) => {
      if (!FIND_EXEC.has(w)) return [];
      const rest = args.slice(i + 1);
      const end = rest.findIndex((x) => x === ";" || x === "+");
      return [end < 0 ? rest : rest.slice(0, end)];
    });
    const writes =
      args.includes("-delete") || execs.some((r) => writtenPaths(r, []).includes("{}"));
    return writes ? [...out, ...starts] : out;
  }
  if (!WRITER.test(name)) return out;
  if (name === "dd")
    return [...out, ...args.filter((w) => w.startsWith("of=")).map((w) => w.slice(3))];
  if (/^(?:sed|perl)$/.test(name)) {
    if (!args.some((w) => /^-[a-zA-Z]*i|^--in-place(?:=|$)/.test(w))) return out;
    // the program (an -e value, a sed \`s/…/…/\`) names no file; sed -E takes no value
    const valued = name === "perl" ? /^-[a-zA-Z]*[eE]$/ : /^-[a-zA-Z]*e$|^--expression$/;
    const code = (w, i) => valued.test(args[i - 1] ?? "") || SED_SCRIPT.test(w);
    return [...out, ...args.filter((w, i) => !code(w, i))];
  }
  const hard =
    name === "link" ||
    (name === "ln" && !args.some((w) => /^-[a-zA-Z]*s|^--symbolic$/.test(w))) ||
    (name === "cp" && args.some((w) => /^-[a-zA-Z]*l|^--link$/.test(w)));
  if (!COPIER.test(name) || hard) return [...out, ...args];
  const ops = args.filter((w) => !w.startsWith("-"));
  const t = /^(?:rsync|ditto)$/.test(name)
    ? -1
    : args.findIndex((w) => /^(?:-t|--target-directory)$|^-[a-zA-Z]*t$/.test(w)); // cp -vt dir
  const eq = /^(?:rsync|ditto)$/.test(name)
    ? undefined
    : args.find((w) => w.startsWith("--target-directory="));
  const dest = eq ? eq.slice(19) : t >= 0 ? args[t + 1] : ops.at(-1);
  const moves = name === "mv" || args.includes("--remove-source-files");
  if (dest === undefined) return moves ? [...out, ...args] : out;
  const srcs = ops.filter((w) => w !== dest);
  const entries = (s) => {
    const e = expandHome(s);
    const abs = e === null ? null : e.startsWith("/") ? e : dir === null ? null : resolve(dir, e);
    try {
      return abs === null ? [] : readdirSync(abs).slice(0, 256);
    } catch {
      return [];
    }
  };
  const under = (s) => [join(dest, basename(s)), ...entries(s).map((n) => join(dest, n))];
  return [...out, ...(moves ? srcs : []), dest, ...srcs.flatMap(under)];
}
/**
 * port: why writing the word p, in dir (null: unknown), is refused, or "": the path resolved (\`$PWD\` read as dir,
 * \`//\`, \`..\`), through symlinks and globs as the shell expands them, or its shape when the rest is unknown
 * (\`$X/.claude/settings.json\`).
 */
function protectedWhy(p, dir) {
  const pwd = dir === null ? p : p.replace(/^(?:\$PWD|\$\{PWD\}|\$\(pwd\))(?=\/|$)/, dir);
  const e = expandHome(pwd);
  const abs =
    e === null ? "" : e.startsWith("/") ? normalize(e) : dir === null ? "" : resolve(dir, e);
  const base = abs === "" ? null : (dir ?? "/");
  const globbed =
    base === null || !/[*?[]/.test(e)
      ? []
      : (expandGlob(base, e) ?? []).map((m) => resolve(base, m));
  const spellings = [abs, ...globbed].filter(Boolean).flatMap((x) => [x, realDir(x)]);
  const shape = normalize(unquote(pwd) || ".");
  const config = (rx) => (abs === "" && rx.test(shape)) || spellings.some((x) => guards(x, rx));
  if (config(AGENT_CONFIG) || config(CONFIG_DIR)) return AGENT_CONFIG_WHY;
  if (config(GIT_INTERNALS)) return GIT_INTERNALS_WHY;
  return spellings.some((x) => STACKRA_TREE.test(x)) ? STACKRA_WHY : "";
}
/** port: checkout, switch and restore options whose value is the next word. */
const GIT_VALUED = /^(?:-b|-B|-c|-C|--orphan|-s|--source|--conflict|--pathspec-from-file)$/;
/**
 * port: true when g puts another revision's agent config in its checkout, as git itself reads the pathspec:
 * \`checkout <rev> -- <paths>\` and \`restore -s <rev> <paths>\` (any spelling, \`.\` included); a move of the whole
 * tree (\`reset --hard\`, \`checkout\`, \`switch\`, \`-\` too) to a revision that lacks config commits HEAD has; a
 * revert or cherry-pick of a commit that changed it.
 * shortcut: ranges (\`a..b\`), bisect and \`read-tree\` are not read; upgrade if agents use them.
 */
function gitMovesConfig(g) {
  const commit = (r) => g.run("rev-parse", "--verify", "-q", r + "^{commit}") !== "";
  if (/^(?:revert|cherry-pick)$/.test(g.sub))
    return g.args.some(
      (r) =>
        !r.startsWith("-") &&
        commit(r) &&
        g
          .run("show", "--name-only", "--format=", r)
          .split("\n")
          .some((f) => AGENT_CONFIG.test(f)),
    );
  if (!/^(?:checkout|switch|restore|reset)$/.test(g.sub)) return false;
  const args = g.args.map((a) => (a === "-" ? "@{-1}" : a));
  const dd = args.indexOf("--");
  const head = dd < 0 ? args : args.slice(0, dd);
  const ops = head.filter((a, i) => !a.startsWith("-") && !GIT_VALUED.test(head[i - 1] ?? ""));
  let paths = dd < 0 ? ops.slice(1) : args.slice(dd + 1);
  let rev = ops[0];
  if (g.sub === "restore") {
    const s = head.findIndex((a) => /^(?:-s|--source)$/.test(a));
    const joined = head.find((a) => /^(?:--source=|-s.)/.test(a));
    rev = s >= 0 ? head[s + 1] : joined?.replace(/^(?:--source=|-s)/, "");
    paths = [...ops, ...(dd < 0 ? [] : args.slice(dd + 1))];
  } else if (g.sub === "reset") {
    if (!head.some((a) => /^--(?:hard|merge|keep)$/.test(a)) || paths.length) return false;
    rev ??= "HEAD";
  } else if (g.sub === "switch") paths = [];
  if (!rev || !commit(rev)) return false;
  const changed = g
    .run("diff", "--name-only", "HEAD", rev, "--", ...paths)
    .split("\n")
    .filter((f) => AGENT_CONFIG.test(f));
  if (!changed.length) return false;
  // a path checkout writes them; a tree move drops the config commits HEAD has and rev lacks
  const top = changed.map((f) => ":(top)" + f);
  return paths.length > 0 || g.run("log", "-1", "--format=%H", rev + "..HEAD", "--", ...top) !== "";
}
/** port: git commands that rewrite named paths, and every git command that changes a checkout's files or HEAD. */
const GIT_PATH_WRITES = new Set([
  "checkout",
  "restore",
  "rm",
  "mv",
  "apply",
  "am",
  "checkout-index",
  "update-index",
]);
const GIT_TREE_WRITES =
  /^(?:checkout|switch|restore|reset|rm|mv|apply|am|merge|rebase|pull|cherry-pick|revert|stash|clean|commit|worktree)$/;
/** port: a diff header line that names agent config (\`+++ b/.claude/settings.json\`, \`rename to .agents/hooks/x\`). */
const touchesConfig = (text) =>
  text
    .split("\n")
    .some(
      (l) =>
        /^(?:diff --git|\+\+\+|---|rename (?:from|to)|copy (?:from|to)|Index:) /.test(l) &&
        l.split(/\s+/).some((w) => AGENT_CONFIG.test(w.replace(/^[ab]\//, ""))),
    );
/**
 * port: the patch files \`git apply\`, \`git am\` or \`patch\` reads (operands, \`-i\`, \`<\`), ["-"] when it reads
 * stdin (a pipe or a heredoc), [] for any other command or a read-only one (\`--check\`, \`--stat\`, \`--continue\`).
 */
function patchInputs(words, redirects) {
  const k = nameIndexes(words).at(-1) ?? 0;
  const name = basename(words[k] ?? "");
  let args = words.slice(k + 1);
  if (name === "git") {
    let i = 0;
    while (i < args.length && args[i].startsWith("-"))
      i += /^(?:-C|-c|--git-dir|--work-tree|--namespace)$/.test(args[i]) ? 2 : 1;
    if (!/^(?:apply|am)$/.test(args[i] ?? "")) return [];
    args = args.slice(i + 1);
    if (args.some((w) => /^--(?:check|stat|numstat|summary)$/.test(w)) && !args.includes("--apply"))
      return [];
    if (
      args.some((w) =>
        /^--(?:continue|abort|skip|quit|resolved|retry|show-current-patch(?:=.*)?)$|^-r$/.test(w),
      )
    )
      return [];
  } else if (name !== "patch") return [];
  // patch's operands are [originalfile [patchfile]]; these options take the next word as their value
  const valued = /^(?:-[pdorDFVzYBi]|--(?:input|directory|output|reject-file|strip|fuzz))$/;
  const operands = args.filter((w, i) => !w.startsWith("-") && !valued.test(args[i - 1] ?? ""));
  const input = (w, i) =>
    /^(?:-i|--input)$/.test(args[i - 1] ?? "")
      ? [w]
      : /^(?:--input=|-i.)/.test(w)
        ? [w.replace(/^(?:--input=|-i)/, "")]
        : [];
  const files = name === "patch" ? [...args.flatMap(input), ...operands.slice(1, 2)] : operands;
  const read = redirects.filter((r) => r.op === "<").map((r) => r.target);
  if (files.length || read.length || (name === "patch" && operands.length)) return [...files, ...read];
  return ["-"];
}
const PATCH_STDIN_WHY =
  "A patch piped in or given as a heredoc (\`… | git apply\`, \`git am\` or \`patch\` reading stdin) cannot be checked for the guard's own files. Write the patch to a file and apply it by name (\`git apply <file>\`), or edit with the Edit tool.";
/** port: true when the patch file f (in dir) has a diff that names agent config. */
function patchTouchesConfig(f, dir) {
  const e = expandHome(f);
  const abs = e === null ? "" : e.startsWith("/") ? e : dir === null ? "" : resolve(dir, e);
  try {
    return statSync(abs).size < 8e6 && touchesConfig(readFileSync(abs, "utf8"));
  } catch {
    return false;
  }
}
/** port: the paths a git command writes outside its pathspecs: \`worktree add <path>\`, \`-o\` / \`--output\`. */
function gitOutputPaths(g) {
  const out = [];
  if (g.sub === "worktree" && g.args[0] === "add") {
    let i = 1;
    while (i < g.args.length && g.args[i].startsWith("-"))
      i += /^(?:-[bB]|--reason)$/.test(g.args[i]) ? 2 : 1;
    out.push(g.args[i] ?? "");
  }
  g.args.forEach((a, i) => {
    if (a.startsWith("--output=")) out.push(a.slice(9));
    else if (/^(?:-o|--output)$/.test(a)) out.push(g.args[i + 1] ?? "");
  });
  return out.filter(Boolean);
}
/** port: what may run in the Stackra checkout from here: the route's pnpm scripts only. */
const PACKAGE_MANAGER = /^(?:pnpm|npm|yarn|npx|pnpx|corepack|bun|bunx)$/;
const RUNTIME = /^(?:node|deno|tsx|ts-node)$/;
const ROUTE_SCRIPT = /^(?:bot:(?:git|gh|review)|pr:merge|linear|secrets:import)$/;
const DIR_FLAG = /^(?:-C|--dir|--prefix|--cwd)$/;
const inStackra = (d) => d !== null && STACKRA_TREE.test(realDir(d));
/**
 * port: true when a command runs code in the Stackra checkout: a package manager there (by \`cd\`, \`-C\`, \`--dir\`,
 * \`--prefix\`) other than the route's scripts, node there or on a script of it, or the guard-port tool itself.
 */
function stackraRuns(words, dirs) {
  const k = nameIndexes(words).at(-1) ?? 0;
  const name = basename(words[k] ?? "");
  const args = words.slice(k + 1);
  if (name === "guard-port.mjs" || (RUNTIME.test(name) && args.some((w) => basename(w) === "guard-port.mjs")))
    return true;
  if (RUNTIME.test(name)) {
    const script = args.find((w) => !w.startsWith("-"));
    const ran = (d) => script !== undefined && !/\/node_modules\//.test(script) && inStackra(moveTo(d, script));
    return dirs.some((d) => inStackra(d) || ran(d));
  }
  if (!PACKAGE_MANAGER.test(name)) return false;
  const i = args.findIndex((w) => DIR_FLAG.test(w));
  const eq = args.find((w) => /^--(?:dir|prefix|cwd)=/.test(w));
  const to = eq ? eq.slice(eq.indexOf("=") + 1) : i >= 0 ? args[i + 1] : undefined;
  const at = to === undefined ? dirs : dirs.map((d) => moveTo(d, to));
  if (!at.some(inStackra)) return false;
  const script = args.find(
    (w, j) => !w.startsWith("-") && w !== "run" && !DIR_FLAG.test(args[j - 1] ?? ""),
  );
  return !ROUTE_SCRIPT.test(script ?? "");
}
const STACKRA_RUN_WHY =
  "From this repository the Stackra checkout runs only the route's scripts (\`bot:git\`, \`bot:gh\`, \`bot:review\`, \`pr:merge\`, \`linear\`, \`secrets:import\`): \`pnpm install\`, \`add\`, \`format\`, \`exec\`, a node script or the guard-port tool there rewrites what the bot wrappers run with every /agents value, or a guard. Change Stackra from a session rooted there.";
/**
 * port: why a command writes the owner's config, git's internals or the Stackra checkout, or "": a redirect or
 * writer naming one (cd followed), a patch whose diff names agent config or that comes from stdin, code run in the
 * Stackra checkout, a git pathspec naming agent config (read from the command's own folder), a git command that
 * puts another revision's config in place, a git write in the Stackra tree, or a git output path.
 */
function portWriteRefusal(c, ctx) {
  for (const [t, base] of scanBases(c, ctx.cwd)) {
    for (const { src, words, dirs } of walk(t, base)) {
      const redirects = simpleCommands(src).flatMap((s) => s.redirects);
      for (const d of dirs)
        for (const p of writtenPaths(words, redirects, d)) {
          const why = protectedWhy(p, d);
          if (why) return why;
        }
      for (const f of patchInputs(words, redirects))
        if (f === "-") return PATCH_STDIN_WHY;
        else if (dirs.some((d) => patchTouchesConfig(f, d))) return AGENT_CONFIG_WHY;
      if (stackraRuns(words, dirs)) return STACKRA_RUN_WHY;
    }
    for (const g of gitCommands(t, base)) {
      if (GIT_PATH_WRITES.has(g.sub)) {
        const prefix = g.run("rev-parse", "--show-prefix");
        const named = (a) => {
          const p = a.replace(/^--[\w-]+=/, "").replace(/^\d+,[\da-f]+,/i, ""); // --cacheinfo mode,sha,path
          return [p, prefix + p]
            .map((x) => normalize(x || "."))
            .some((x) => AGENT_CONFIG.test(x) || CONFIG_DIR.test(x));
        };
        if (g.args.some(named)) return AGENT_CONFIG_WHY;
      }
      if (gitMovesConfig(g)) return AGENT_CONFIG_WHY;
      if (GIT_TREE_WRITES.test(g.sub) && STACKRA_TREE.test(g.run("rev-parse", "--show-toplevel")))
        return STACKRA_WHY;
      for (const p of gitOutputPaths(g)) {
        const why = protectedWhy(p, base);
        if (why) return why;
      }
    }
  }
  return "";
}

/** port: the Stackra bot scripts; from this repository every one runs in the Stackra checkout. */
const BOT_SCRIPT = /^(?:bot:(?:git|gh|review)|pr:merge)$/;
/** port: every bot script call in c, quotes removed: [script, ...args], a leading -- dropped. */
function botCalls(c) {
  const out = [];
  for (const t of scanTexts(c))
    for (const { words } of simpleCommands(t)) {
      const p = words.findIndex((w) => basename(w) === "pnpm");
      const k = p < 0 ? -1 : words.findIndex((w, i) => i > p && BOT_SCRIPT.test(w));
      if (k < 0) continue;
      const args = words.slice(k + 1);
      out.push([words[k], ...(args[0] === "--" ? args.slice(1) : args)]);
    }
  return out;
}
/**
 * port: true when a bot script call runs with a changed environment: the wrapper mints the bot token, and an
 * assignment, \`env\`, \`export\` or pnpm's \`--node-options\` (\`NODE_OPTIONS\`, \`PATH\`) runs other code beside it.
 */
function botEnv(c) {
  return scanTexts(c).some((t) => {
    const list = simpleCommands(t);
    const changed = list.some(({ words }) => {
      const p = words.findIndex((w) => basename(w) === "pnpm");
      const k = p < 0 ? -1 : words.findIndex((w, i) => i > p && BOT_SCRIPT.test(w));
      if (k < 0) return false;
      const before = words.slice(0, p);
      return (
        before.some((w) => /^[A-Za-z_]\w*=/.test(w) || basename(w) === "env") ||
        words.slice(p + 1, k).some((w) => /node-options|^--config\./.test(w))
      );
    });
    const exported = list.some(
      ({ words }) =>
        /^(?:export|declare|typeset|setenv)$/.test(words[0] ?? "") ||
        (words[0] === "set" && words.some((w) => /^-[a-zA-Z]*a|^allexport$/.test(w))),
    );
    return changed || (exported && botCalls(t).length > 0);
  });
}
const ABSOLUTE = /^(?:\/|~\/)/;
const GITHUB_URL = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/(?:pull|issues)\/\d+/;
const FILE_OPTION = /^(?:--body-file|--notes-file|--input|-F|--field)$/;
/** port: an \`api\` path that writes a ref, a file's contents or a branch's name (the REST twins of MERGE's GraphQL). */
const GIT_WRITE_PATH =
  /(?:^|\/)repos\/[^/]+\/[^/]+\/(?:git\/refs(?:\/|$)|contents(?:\/|$)|branches\/[^/]+\/rename$)/i;
/** port: gh verbs that write into the folder gh runs in (the Stackra checkout) or into the bot's gh. */
const GH_LOCAL = /^(?:pr checkout|repo (?:create|fork|set-default)|gist clone|extension|config (?:set|clear-cache))\b/;
/** port: why a bot script call would act on the Stackra checkout or repository, or read a file there, or "". */
function botRefusal(c) {
  if (botEnv(c))
    return "From this repository the bot wrappers run with no changed environment: an assignment, \`env\`, \`export\` or \`--node-options\` (\`NODE_OPTIONS\`, \`PATH\`) would run other code beside the bot token. Call \`pnpm --silent bot:…\` plainly.";
  for (const [script, ...a] of botCalls(c)) {
    if (script === "bot:git") {
      if (a[0] !== "-C" || !ABSOLUTE.test(a[1] ?? "") || STACKRA_TREE.test(expandHome(a[1]) ?? ""))
        return "From this repository \`bot:git\` runs in the Stackra checkout, so git must name this checkout first, by a literal absolute path: \`bot:git -- -C <absolute path of this checkout> push origin HEAD\` (no \`$PWD\`, no relative path, never the Stackra checkout).";
      continue;
    }
    const w = a.flatMap((x) => (/^--[\w-]+=/.test(x) ? [x.slice(0, x.indexOf("=")), x.slice(x.indexOf("=") + 1)] : [x]));
    const sub = w.filter((x, i) => !x.startsWith("-") && !(w[i - 1] ?? "").startsWith("-"));
    const repo = w.some(
      (x, i) =>
        (/^(?:-R|--repo)$/.test(w[i - 1] ?? "") && /^[\w.-]+\/[\w.-]+$/.test(x)) ||
        (script !== "pr:merge" && GITHUB_URL.test(x)),
    );
    if (sub[0] !== "api" && !repo)
      return "From this repository \`bot:gh\`, \`bot:review\` and \`pr:merge\` act on figentra/stackra unless they name the repository: add \`-R figentra/<repo>\` (gh also takes a PR or issue URL; \`api\` names it in its path).";
    if (sub[0] === "pr" && sub[1] === "create" && !w.some((x) => /^(?:-H|--head)$/.test(x)))
      return "From this repository \`bot:gh -- pr create\` needs \`--head <branch> --base main\`: without \`--head\` gh takes the Stackra checkout's branch.";
    // port: gh writes these into the folder it runs in, which is the Stackra checkout
    const outside = (x) => ABSOLUTE.test(x ?? "") && !STACKRA_TREE.test(expandHome(x) ?? "");
    const into = w.find((x, i) => /^(?:-D|--dir|-O|--output)$/.test(w[i - 1] ?? ""));
    const verb = (sub[0] ?? "") + " " + (sub[1] ?? "");
    if (
      GH_LOCAL.test(verb) ||
      (verb === "repo sync" && sub.length < 3) ||
      (verb === "repo clone" && !outside(sub[3])) ||
      (/^(?:release|run|attestation) download$/.test(verb) && !outside(into))
    )
      return "From this repository \`bot:gh\` runs in the Stackra checkout, so \`pr checkout\`, \`repo clone|create|fork|sync|set-default\`, \`gist clone\`, \`extension\`, \`config set\` and a download without an absolute \`-D\`/\`-O\` outside Stackra would change that checkout or the bot's gh. Read a PR with \`pr view\` / \`pr diff\`, fetch its branch with \`bot:git -- -C <absolute path of this checkout> fetch origin <branch>\`, and download with \`-D <absolute path outside Stackra>\`.";
    // port: REST writes that move a branch or commit on one, past the push guard and review (main included)
    if (sub[0] === "api" && apiWrites(a) && w.some((x) => GIT_WRITE_PATH.test(normalizeWord(x))))
      return "From this repository \`bot:gh -- api\` never writes git refs, file contents or branch names (\`git/refs\`, \`contents\`, \`branches/<b>/rename\`): that moves a branch or commits on it, main included, past the push guard and review. Push with \`bot:git -- -C <absolute path of this checkout> push origin HEAD\` and open a PR.";
    for (let i = 0; i < w.length - 1; i++) {
      if (!FILE_OPTION.test(w[i])) continue;
      const field = /^[^=/]*=(@?)(.*)$/s.exec(w[i + 1]);
      const file = field ? (field[1] ? field[2] : null) : w[i] === "--field" ? null : w[i + 1];
      if (file !== null && file !== "-" && !ABSOLUTE.test(file))
        return "\`bot:gh\`, \`bot:review\` and \`pr:merge\` run in the Stackra checkout, so a relative \`--body-file\`, \`-F\` or \`@file\` would read a file there: give an absolute path (or \`-\` for stdin).";
    }
  }
  return "";
}
/**
 * port: a push to Encore: the remote given (\`--repo\`, the first operand) or the push default, by name
 * (\`encore\`), by URL (\`encore://\`, \`*.encore.dev\`, \`*.encore.cloud\`), or a named remote whose push URL is one.
 */
const ENCORE_REMOTE = /^encore$|^encore:|\bencore\.(?:dev|cloud)\b/i;
function pushesEncore(g) {
  const eq = g.args.find((a) => a.startsWith("--repo="));
  const at = g.args.indexOf("--repo");
  const remote =
    eq?.slice(7) ??
    (at >= 0 ? g.args[at + 1] : pushRefs(g.args)[0]) ??
    g.run("rev-parse", "--abbrev-ref", "@{push}").split("/")[0];
  if (!remote) return false;
  return (
    ENCORE_REMOTE.test(remote) ||
    (/^[\w.-]+$/.test(remote) && ENCORE_REMOTE.test(g.run("remote", "get-url", "--push", remote)))
  );
}
/** port: paid or signed builds: EAS cloud builds, Tauri builds and update signing. */
const SIGNED_BUILD = atName(
  String.raw${"`"}(?:${"${"}CLI("eas(?:-cli)?")}build(?::(?:dev|internal|resign))?|${"${"}CLI(String.raw${"`"}(?:(?:cargo\s+)?tauri|@tauri-apps\/cli)${"`"})}(?:build|signer))${"`"} + END,
);
/** port: the credential folders under home (\`HOME_SECRET\`), which a recursive search of them or above reads. */
const CREDENTIAL_DIRS = [
  ".config/gh",
  ".ssh",
  ".aws",
  ".wrangler",
  ".expo",
  ".stackra",
  "library/preferences/.wrangler",
  "library/application support/encore",
];
/** port: true when searching p recursively (a Grep root) reads a credential folder: it is one, or above one. */
function holdsCredentials(p, cwd) {
  const e = expandHome(p);
  if (e === null) return false;
  const abs = (e.startsWith("/") || !cwd ? normalize(e) : resolve(cwd, e)).toLowerCase();
  const home = HOME_DIR.toLowerCase() + "/";
  const rel = abs.startsWith(home) ? abs.slice(home.length).replace(/\/+$/, "") : "";
  return rel !== "" && CREDENTIAL_DIRS.some((d) => (d + "/").startsWith(rel + "/") || rel.startsWith(d + "/"));
}

`;

/** The rules the port inserts after the stash rule. */
const PORT_ROWS = code`  { rx: portWriteRefusal, why: "" }, // port
  { rx: botRefusal, why: "" }, // port
  {
    // port: the owner's secret-moving scripts (muslin .opencode/rules/secrets.md), run or traced (sh -x runs them).
    rx: (c) =>
      runsQuoted(
        c,
        atName(
          String.raw${"`"}(?:(?:bash|sh|zsh|dash|ksh|node|source|\.)\s+(?:-\S+\s+)*)?(?:[^\s;&|()<>]*\/)?(?:ci-box\s+put-env|sync-secrets[\w.-]*|seed-env\.sh|register\.sh|tools\/scripts\/secrets\/[^\s;&|()<>]+)${"`"} +
            END,
        ),
      ),
    why: "\`ci-box put-env\`, \`sync-secrets*\`, \`tools/scripts/secrets/*\`, \`seed-env.sh\` and \`register.sh\` move secret values; only the owner runs them, and a trace (\`sh -x\`) runs them too. Read them with \`cat\` or \`grep\`.",
  },
  {
    // port: rsync deletes too: --delete* removes what the source lacks, --remove-source-files the sources
    rx: (c) =>
      scanTexts(c).some((t) =>
        simpleCommands(t).some(
          ({ words }) =>
            basename(words[nameIndexes(words).at(-1) ?? 0] ?? "") === "rsync" &&
            words.some((w) => /^--(?:del(?:ete)?(?:-|=|$)|remove-source-files$)/.test(w)),
        ),
      ),
    decision: "ask",
    id: "rm-delete",
    why: "\`rsync --delete\` (or \`--remove-source-files\`) deletes files; the owner confirms it.",
  },
`;

/** A differential-test list row, double-quoted. */
const row = (c) => `  ${JSON.stringify(c)},\n`;
/** A single-quoted row, and the same with `add` before its first option. */
const quoted = (c, add = " -R figentra/x --head feature/x") => [
  `  '${c}',\n`,
  `  '${c.replace(" --", `${add} --`)}',\n`,
];

/** The patched files of a port, by name: `_rules.mjs`, `guard-bash.mjs` and the differential test. */
export function portFiles(repo, read) {
  const rules = read("_rules.mjs");
  const agentsSyncRows = slice(
    "_rules.mjs",
    rules,
    "  {\n    // agents-sync projects .agents/agents/** into these",
    'Edit .mcp.yaml and run `pnpm agents:sync`.",\n  },\n',
  );
  const out = {};
  out["_rules.mjs"] = applyHunks("_rules.mjs", rules, [
    // master counts as main
    [
      `if (refs.some((r) => refspecDest(r) === "main")) return true;`,
      `if (refs.some((r) => /^(?:main|master)$/.test(refspecDest(r)))) return true; // port: master`,
    ],
    [
      `return branch === "" || branch === "main";`,
      `return branch === "" || branch === "main" || branch === "master"; // port: master`,
    ],
    // no stash at all
    [
      `      const [verb, ...rest] = g.args;
      if (["pop", "clear", "branch"].includes(verb))`,
      `      const [verb, ...rest] = g.args;
      // port: no stash at all (owner rule); list and show only read.
      if (!["list", "show"].includes(verb))
        return "Stash guard: no \`git stash\` here (owner rule): \`refs/stash\` is shared by every worktree. Make a WIP commit (\`git commit -m wip\`, later \`git reset --soft HEAD~1\`).";
      if (["pop", "clear", "branch"].includes(verb))`,
    ],
    // app build output is regenerable
    [
      `const REGENERABLE = /^(?:node_modules|dist|\\.turbo|\\.stackra|coverage|\\.cache)$/;`,
      `// port: plus the apps' build output (.next, .expo, encore.gen, Playwright and Lighthouse reports)
const REGENERABLE =
  /^(?:node_modules|dist|\\.turbo|\\.stackra|coverage|\\.cache|\\.next|\\.expo|encore\\.gen|test-results|playwright-report|\\.lighthouseci)$/;`,
    ],
    [
      `outside the session's scratchpad and build output (${BUILD}) deletes`,
      `outside the session's scratchpad and build output (${BUILD_PORT}) deletes`,
    ],
    [`build output (${BUILD}) needs no yes`, `build output (${BUILD_PORT}) needs no yes`],
    // the owner's asks: paid or signed builds, re-enabling Actions
    [
      `  "eas-deploy",\n  "publish",`,
      `  "eas-deploy",\n  "signed-build", // port\n  "bot-gh-workflow-enable", // port\n  "publish",`,
    ],
    ["/**\n * The rules, in order.", `${PORT_RULES}/**\n * The rules, in order.`],
    // encore deploy stays denied, and a push to the Encore remote is one
    [
      `    rx: (c) => runsQuoted(c, /\\bencore\\s+deploy\\b/),
    why: "\`encore deploy\` ships to a shared environment; no agent runs it. Deploys belong to the release path.",`,
      `    // port: a push to the Encore remote deploys too (owner decision: both stay denied, as in Stackra).
    rx: (c, ctx) =>
      runsQuoted(c, /\\bencore\\s+deploy\\b/) ||
      scanBases(c, ctx.cwd).some(([t, b]) =>
        gitCommands(t, b).some((g) => g.sub === "push" && pushesEncore(g)),
      ),
    why: "\`encore deploy\` and a push to the Encore remote ship to a shared environment; no agent runs them. Deploys belong to the release path.",`,
    ],
    [
      `on the owner's Expo login; the owner confirms it.",\n  },\n`,
      `on the owner's Expo login; the owner confirms it.",
  },
  {
    // port: EAS build credit and the owner's signing keys
    rx: (c) => runsQuoted(c, SIGNED_BUILD) || runs(c, /(?:^|\\s)app:build(?=\\s|$)/),
    decision: "ask",
    id: "signed-build",
    why: "\`eas build\`, \`tauri build\`, \`tauri signer\` and \`@muslin/desktop app:build\` spend EAS build credit or sign with the owner's keys; the owner confirms it.",
  },
  {
    // port: Actions are off where they would bill the owner
    rx: (c) =>
      runs(
        c,
        /\\bbot:gh\\s+(?:--\\s+)?(?:(?:-R|--repo)(?:=|\\s+)\\S+\\s+)?(?:workflow\\s+enable\\b|api\\b[^|;&\\n]*\\/actions\\/workflows\\/[^\\s/]+\\/enable\\b)/,
      ),
    decision: "ask",
    id: "bot-gh-workflow-enable",
    why: "\`bot:gh workflow enable\` turns a GitHub Actions workflow back on, which spends the owner's Actions minutes; the owner confirms it.",
  },
`,
    ],
    [`  { rx: stashRefusal, why: "" },\n`, `  { rx: stashRefusal, why: "" },\n${PORT_ROWS}`],
    // signing keys are secret files
    [
      `  /\\.(?:pem|key)$/i,`,
      `  /\\.(?:pem|key|p8|p12|jks|keystore|mobileprovision)$/i, // port: signing keys`,
    ],
    [
      `[^/]+\\.(pem|p12|pfx|key))$/i,`,
      `[^/]+\\.(pem|p12|pfx|key|p8|jks|keystore|mobileprovision))$/i, // port: signing keys`,
    ],
    // tool writes: one owner row replaces the three agents-sync rows; git's internals; the Stackra row; the repo's
    [
      agentsSyncRows,
      `  { rx: AGENT_CONFIG, why: AGENT_CONFIG_WHY }, // port: replaces the agents-sync rows
  { rx: GIT_INTERNALS, why: GIT_INTERNALS_WHY }, // port
  { rx: STACKRA_TREE, why: STACKRA_WHY }, // port
${REPO_ROW[repo]}`,
    ],
    // the engine: what the copy needs, the shell forms the port rules read, a named push refspec
    [
      `import { existsSync, readdirSync, realpathSync } from "node:fs";`,
      `import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from "node:fs"; // port: readFileSync, statSync`,
    ],
    [
      `import { basename, dirname, join, resolve, sep } from "node:path";`,
      `import { basename, dirname, join, normalize, resolve, sep } from "node:path"; // port: normalize`,
    ],
    [
      code`    else break;
  }
  return out;
}
const namesCache`,
      code`    else break;
  }
  // port: \`find … -exec <cmd>\` runs <cmd> (\`-exec gh pr list \;\` is gh on the owner's login)
  const at = out.at(-1) ?? 0;
  if (/(?:^|\/)find$/.test(words[at] ?? ""))
    words.forEach((w, k) => /^-(?:exec|execdir|ok|okdir)$/.test(w) && k > at && out.push(k + 1));
  return out;
}
const namesCache`,
    ],
    [
      `const LINE_WORD = new RegExp(\n`,
      code`// port: gh too, so a quoted line (\`watch 'gh pr list'\`) reaches the gh rule
const LINE_WORD = new RegExp(
`,
    ],
    [code`(?:rm|find|git|infisical|`, code`(?:rm|find|git|gh|infisical|`],
    [
      `    else if (words.length) {\n`,
      code`    else if (words.length || s.redirects.length) {
      // port: a bare redirect (\`> f\`, \`( … ) > f\`) writes too
`,
    ],
    [
      `      if (!g.bot) continue;\n`,
      code`      if (!g.bot) continue;
      // port: with no refspec, push.default (upstream, matching: allowed keys) or the remote's config picks the
      // branches, main included; the bot pushes only a refspec it names.
      if (!refs.length && !g.args.includes("--tags"))
        return "Push guard: \`pnpm bot:git\` pushes only a refspec it names: with none, \`push.default\` or the remote's config chooses the branches (\`upstream\` and \`matching\` reach main). Use \`pnpm bot:git -- -C <absolute path of this checkout> push origin HEAD\`.";
`,
    ],
    [
      `    rx: (c) => runs(c, BARE_GH),`,
      code`    rx: (c) => runsQuoted(c, BARE_GH), // port: a quoted line too (\`watch 'gh pr list'\`)`,
    ],
    [
      `    rx: (c) => runs(c, NETWORK_GIT),`,
      code`    rx: (c) => runsQuoted(c, NETWORK_GIT), // port: a quoted line too (\`watch 'git push'\`)`,
    ],
    // secrets: home paths in any case (macOS), credential folders, every spelling and glob of a Read or Grep path
    [
      code`    if (isSecretPath(p)) return true;`,
      code`    if (isSecretPath(p) || isSecretPath(p.replace(/\/*$/, "/"))) return true; // port: a credential folder (\`ls ~/.config/gh\`)`,
    ],
    [
      code`|\.stackra\/secrets-confirm\.key$)/;`,
      code`|\.stackra\/secrets-confirm\.key$)/i; // port: /i, macOS paths are case-insensitive`,
    ],
    [
      `  if (home.startsWith(HOME_DIR + "/") && HOME_SECRET.test(home.slice(HOME_DIR.length + 1)))`,
      `  if (
    home.toLowerCase().startsWith(HOME_DIR.toLowerCase() + "/") && // port: any case (\`~/.config/GH\`)
    HOME_SECRET.test(home.slice(HOME_DIR.length + 1))
  )`,
    ],
    [
      `  if (isSecretPath(path))\n`,
      code`  // port: the path resolved too (\`//\`, \`.\`, \`..\`, symlinked folders), a glob filter's literal names (\`.env*\`,
  // \`{.env,x}\`), and a Grep root at or above a credential folder (\`~/.config\`)
  const e = expandHome(path) ?? path;
  const abs = e.startsWith("/") || !cwd ? normalize(e) : resolve(cwd, e);
  const spellings = [path, abs, realDir(abs)];
  const names = /[*?{]/.test(path) ? path.split(/[*?{},]/).filter(Boolean) : [];
  if (
    [...spellings, ...names].some(isSecretPath) ||
    (recursive && spellings.some((p) => holdsCredentials(p, cwd)))
  )
`,
    ],
    [
      `  const rule = WRITE_RULES.find((r) => r.rx.test(path));`,
      code`  // port: the path as written and resolved (\`//\`, \`.\`, \`..\`, \`~\`, symlinks), so no spelling skips a row
  const e = expandHome(path) ?? path;
  const abs = e.startsWith("/") || !cwd ? normalize(e) : resolve(cwd, e);
  const spellings = [path, abs, realDir(abs)];
  const rule = WRITE_RULES.find((r) => spellings.some((p) => r.rx.test(p)));`,
    ],
  ]);

  const merge =
    repo === "os"
      ? `merge with \`(cd ${STACKRA} && pnpm --silent pr:merge -R figentra/os <n>)\`, which needs the owner's approving review ending in \`owner-approval\` (no session here can run \`bot:review\`)`
      : "merges are the owner's here (no Quality Gate check yet), so report the PR URL";
  const route = `In this repository GitHub is reached only as the bot, through the wrappers in the Stackra checkout, each run in a subshell so this session's directory stays put: \`(cd ${STACKRA} && pnpm --silent bot:git -- -C <absolute path of this checkout> push origin HEAD)\` (or \`fetch origin\`), \`(cd ${STACKRA} && pnpm --silent bot:gh -- pr create -R ${SLUG[repo]} --head <branch> --base main --title … --body-file <absolute path>)\`; ${merge}. A silent exit 1 means pnpm refused to run the script (\`--silent\` hides why): run it again without \`--silent\` to read the reason.`;
  out["guard-bash.mjs"] = applyHunks("guard-bash.mjs", read("guard-bash.mjs"), [
    [
      `const EVENT = "PreToolUse";\n`,
      [
        `const EVENT = "PreToolUse";`,
        ``,
        `// port: the bot wrappers live in the Stackra checkout; this repository has none (.agents/hooks/README.md).`,
        `const ROUTE = ${JSON.stringify(route)};`,
        "const withRoute = (reason) =>",
        "  /\\bbot:|pr:merge|secrets:import|network git|`gh`/.test(reason) ? `${reason}\\n${ROUTE}` : reason;",
        ``,
      ].join("\n"),
    ],
    ["deny(EVENT, `${reason}", "deny(EVENT, `${withRoute(reason)}"],
    ["ask(EVENT, `${reason}", "ask(EVENT, `${withRoute(reason)}"],
  ]);

  // The differential test: stash and agent-config restores deny here; the bot rows take the port's arguments.
  const allowed = [
    ["pnpm bot:gh pr view 113", "pnpm bot:gh pr view 113 -R figentra/x"],
    ["pnpm bot:gh pr checks 113", "pnpm bot:gh pr checks https://github.com/figentra/x/pull/113"],
    ["pnpm bot:gh pr list --state open", "pnpm bot:gh pr list --state open -R figentra/x"],
    ["pnpm bot:gh pr diff 113", "pnpm bot:gh pr diff 113 --repo figentra/x"],
    [
      "pnpm bot:gh pr edit 113 --body-file body.md",
      "pnpm bot:gh pr edit 113 -R figentra/x --body-file /tmp/body.md",
    ],
    ["pnpm bot:gh run list --limit 5", "pnpm bot:gh run list --limit 5 --repo=figentra/x"],
    [
      "pnpm bot:gh run view 123 --log-failed",
      "pnpm bot:gh run view 123 --log-failed -R figentra/x",
    ],
    [
      "pnpm --silent bot:gh pr view 113 --json headRefOid | jq -r .headRefOid",
      "pnpm --silent bot:gh pr view 113 -R figentra/x --json headRefOid | jq -r .headRefOid",
    ],
    ["pnpm bot:gh issue view 12", "pnpm bot:gh issue view 12 -R figentra/x"],
    ["pnpm bot:git -- fetch origin", "(cd $MAIN && pnpm --silent bot:git -- -C $WT fetch origin)"],
    [
      "pnpm bot:git -- fetch origin main",
      "pnpm --silent -C $MAIN bot:git -- -C $WT fetch origin main",
    ],
    [
      "pnpm bot:git -- push origin HEAD",
      "(cd $MAIN && pnpm --silent bot:git -- -C $WT push origin HEAD)",
    ],
    [
      "pnpm bot:git -- push --force-with-lease origin HEAD",
      `(cd $MAIN && pnpm --silent bot:git -- -C "$WT" push --force-with-lease origin HEAD)`,
    ],
    ["pnpm pr:merge 113", "pnpm pr:merge -R figentra/x 113"],
  ].map(([a, b]) => [row(a), row(b)]);
  out["__tests__/guard-differential.test.mjs"] = applyHunks(
    "guard-differential.test.mjs",
    read("__tests__/guard-differential.test.mjs"),
    [
      [
        `  ["git stash clear", "deny"],\n`,
        `  ["git stash clear", "deny"],
  ["git stash", "deny"], // port: no stash at all
  ["git stash push -m wip", "deny"],
  ["git stash apply stash@{0}", "deny"],
  ["git restore .agents/hooks/_rules.mjs", "deny"], // port: the guard is the owner's
  ["pnpm bot:gh pr view 113", "deny"], // port: gh must name the repository
`,
      ],
      [
        `  ["pnpm bot:git -- push origin HEAD", "allow"],\n  ["pnpm bot:git -- push --force-with-lease origin HEAD", "allow"],\n`,
        // port: git must name this checkout; the allowed form is in ALLOWED (\`env A=1\` reads git's -C as its own)
        `  ["pnpm bot:git -- push origin HEAD", "deny"],\n`,
      ],
      [row("git restore .agents/hooks/_rules.mjs"), ""],
      [row("git stash"), ""],
      [row("git stash push -m wip"), ""],
      [row("git stash apply stash@{0}"), ""],
      ...allowed,
      quoted(
        `pnpm bot:gh pr create --title "fix(hooks): x" --body "Refs STA-330; never git push origin main"`,
      ),
      quoted(`pnpm bot:gh pr create --title "x" --body-file /tmp/body.md`),
      quoted(`pnpm bot:gh pr comment 113 --body "Addressed the findings"`, " -R figentra/x"),
      [
        `test("differential: the settings floor denies bot:token and changeset version behind pnpm run / --filter / -F", () => {`,
        `test("differential: the settings floor denies bot:token in any pnpm form, and stash", () => {`,
      ],
      [
        `    "Bash(pnpm run bot:token*)",
    "Bash(pnpm --filter * bot:token*)",
    "Bash(pnpm -F * bot:token*)",
    "Bash(pnpm run changeset:version*)",
    "Bash(pnpm run changeset version*)",
    "Bash(pnpm --filter * changeset:version*)",
    "Bash(pnpm -F * changeset:version*)",`,
        `    "Bash(pnpm *bot:token*)", // port: also the \`pnpm -C <stackra>\` form
    "Bash(node *bot-token.mjs*)",
    "Bash(git stash*)",`,
      ],
    ],
  );
  return out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [dir, repo] = process.argv.slice(2);
  if (!dir || !SLUG[repo]) {
    console.error(
      "usage: node tools/scripts/guard-port.mjs <target>/.agents/hooks <os|muslin|juristra>",
    );
    process.exit(2);
  }
  let files;
  try {
    files = portFiles(repo, (f) => readFileSync(join(SOURCE, f), "utf8"));
  } catch (error) {
    console.error(`guard-port: upstream drifted, nothing written: ${error.message}`);
    process.exit(1);
  }
  mkdirSync(join(dir, "__tests__"), { recursive: true });
  for (const f of COPIED) cpSync(join(SOURCE, f), join(dir, f));
  for (const [f, s] of Object.entries(files)) writeFileSync(join(dir, f), s);
  const sha = spawnSync("git", ["-C", SOURCE, "log", "-1", "--format=%H", "--", "."], {
    encoding: "utf8",
  });
  console.log(
    `guard-port: ${dir} ported for ${SLUG[repo]} from ${STACKRA} .agents/hooks @ ${sha.stdout.trim()}`,
  );
}
