#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: port Stackra's agent guard into another repository (STA-449): figentra/os, figentra/muslin or
 *   figentra/juristra. `node tools/scripts/guard-port.mjs <target>/.agents/hooks <os|muslin|juristra>` copies
 *   `_io`, `_inbox`, `_reviewer-agents`, `guard-paths`, `_rules`, `guard-bash` and the differential test from this
 *   checkout's `.agents/hooks`, then patches `_rules.mjs`, `guard-bash.mjs` and the test for the port. Every hunk is
 *   an exact-string replacement whose anchor must occur once, so a drifted upstream fails loudly instead of
 *   half-patching; a rerun copies again first, so it is idempotent. Each added line carries `// port:`.
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
/** port: the Stackra checkout and its worktrees: the bot wrappers run from there with every /agents value. */
const STACKRA_TREE = /^\/Users\/akouta\/Projects\/stackra(?:\/|$)/i;
const STACKRA_WHY =
  "The Stackra checkout is not this repository's: its bot wrappers (package.json, tools/scripts/bot-*.mjs, pr-merge.mjs, .infisical.yaml) run with every /agents value, so no session here writes, moves or checks out anything under /Users/akouta/Projects/stackra. Change Stackra from a session rooted there.";
/** port: commands that write every operand (sed and perl only with -i / --in-place); mv removes its sources. */
const WRITER =
  /^(?:tee|dd|truncate|chmod|chown|chflags|rm|unlink|touch|patch|sed|perl|mv|cp|ln|install|rsync)$/;
/** port: copiers, which write only their destination: the last operand, or the -t value. */
const COPIER = /^(?:cp|ln|install|rsync)$/;
/**
 * port: the paths a simple command writes: its > targets (not a 2>&1 duplication), a writer's operands, and a
 * copier's destination (with each source's name under it, for a directory destination).
 * shortcut: a -t inside a flag cluster (cp -vt dir) is read as the last operand; upgrade if one is missed.
 */
function writtenPaths(words, redirects) {
  const out = redirects
    .filter((r) => />/.test(r.op) && !(/&/.test(r.op) && /^(?:\d+|-)$/.test(r.target)))
    .map((r) => r.target);
  const k = nameIndexes(words).at(-1) ?? 0;
  const name = basename(words[k] ?? "");
  const args = words.slice(k + 1);
  if (!WRITER.test(name)) return out;
  if (/^(?:sed|perl)$/.test(name) && !args.some((w) => /^-[a-zA-Z]*i|^--in-place(?:=|$)/.test(w)))
    return out;
  if (!COPIER.test(name) || args.includes("--remove-source-files")) return [...out, ...args];
  const ops = args.filter((w) => !w.startsWith("-"));
  const t = name === "rsync" ? -1 : args.findIndex((w) => /^(?:-t|--target-directory)$/.test(w));
  const eq = name === "rsync" ? undefined : args.find((w) => w.startsWith("--target-directory="));
  const dest = eq ? eq.slice(19) : t >= 0 ? args[t + 1] : ops.at(-1);
  if (dest === undefined) return out;
  return [...out, dest, ...ops.filter((w) => w !== dest).map((s) => join(dest, basename(s)))];
}
/** port: why writing the word p, in dir (null: unknown), is refused, or "". */
function protectedWhy(p, dir) {
  const e = expandHome(p);
  if (e === null) return "";
  const abs = e.startsWith("/") ? e : dir === null ? "" : resolve(dir, e);
  if (AGENT_CONFIG.test(e) || AGENT_CONFIG.test(abs)) return AGENT_CONFIG_WHY;
  return STACKRA_TREE.test(abs) ? STACKRA_WHY : "";
}
/** port: git commands that rewrite named paths, and every git command that changes a checkout's files or HEAD. */
const GIT_PATH_WRITES = new Set(["checkout", "restore", "rm", "mv", "apply", "am"]);
const GIT_TREE_WRITES =
  /^(?:checkout|switch|restore|reset|rm|mv|apply|am|merge|rebase|pull|cherry-pick|revert|stash|clean|commit|worktree)$/;
/**
 * port: why a command writes the owner's config or the Stackra checkout, or "": a redirect or writer naming one
 * (cd followed), a git pathspec naming agent config, or a git write whose checkout is in the Stackra tree.
 */
function portWriteRefusal(c, ctx) {
  for (const [t, base] of scanBases(c, ctx.cwd)) {
    for (const { src, words, dirs } of walk(t, base)) {
      const redirects = simpleCommands(src).flatMap((s) => s.redirects);
      for (const p of writtenPaths(words, redirects))
        for (const d of dirs) {
          const why = protectedWhy(p, d);
          if (why) return why;
        }
    }
    for (const g of gitCommands(t, base)) {
      if (GIT_PATH_WRITES.has(g.sub) && g.args.some((a) => AGENT_CONFIG.test(a.replace(/^--[\w-]+=/, ""))))
        return AGENT_CONFIG_WHY;
      if (GIT_TREE_WRITES.test(g.sub) && STACKRA_TREE.test(g.run("rev-parse", "--show-toplevel")))
        return STACKRA_WHY;
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
const ABSOLUTE = /^(?:\/|~\/)/;
const GITHUB_URL = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/(?:pull|issues)\/\d+/;
const FILE_OPTION = /^(?:--body-file|--notes-file|--input|-F|--field)$/;
/** port: why a bot script call would act on the Stackra checkout or repository, or read a file there, or "". */
function botRefusal(c) {
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
/** port: paid or signed builds: EAS cloud builds, Tauri builds and update signing. */
const SIGNED_BUILD = atName(
  String.raw${"`"}(?:${"${"}CLI("eas(?:-cli)?")}build(?::(?:dev|internal|resign))?|${"${"}CLI(String.raw${"`"}(?:(?:cargo\s+)?tauri|@tauri-apps\/cli)${"`"})}(?:build|signer))${"`"} + END,
);

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
        gitCommands(t, b).some(
          (g) => g.sub === "push" && /^encore$|\\bencore\\.(?:dev|cloud)\\b/i.test(pushRefs(g.args)[0] ?? ""),
        ),
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
    // tool writes: one owner row replaces the three agents-sync rows; the Stackra row; the repo's own row
    [
      agentsSyncRows,
      `  { rx: AGENT_CONFIG, why: AGENT_CONFIG_WHY }, // port: replaces the agents-sync rows
  { rx: STACKRA_TREE, why: STACKRA_WHY }, // port
${REPO_ROW[repo]}`,
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
