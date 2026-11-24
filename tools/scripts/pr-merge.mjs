#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: `pnpm pr:merge [-R owner/repo] <n>` (`-R figentra/os` for the OS repo) — the only way an agent merges (owner decision A1, ADR 0119). As
 *   `stackra-bot`, never `--admin`, it enqueues PR <n> in the base branch's merge queue (GraphQL `enqueuePullRequest`
 *   with `expectedHeadOid`, ADR 0166 CI3) or, when the repo has no queue (template, os), merges it with
 *   `--squash --delete-branch --match-head-commit <head>`. The gate and the ruleset are the merge condition since
 *   ADR 0523 (decision 3): it merges only when
 *   1. the PR is open and not a draft;
 *   2. the newest "Quality Gate" check run on the head SHA concluded `success`;
 *   3. the ruleset lets it merge: the base has a merge queue (the queue applies the ruleset), or `mergeStateStatus`
 *      is CLEAN, HAS_HOOKS or UNSTABLE (only a non-required check is not green; the gate is condition 2, so a red
 *      non-required check is reported, not blocking);
 *   4. the PR carries no `hold` label (any case);
 *   5. the newest `stackra/verify` check run on the head SHA, created by the stackra-verify GitHub App (slug and id
 *      in `VERIFY_APP`), is completed with conclusion `success`: main's whole Quality Gate (ci.yml's `gate` and
 *      `dependency-scan` jobs, plus the licence policy and the tests) passed on that exact SHA in a throwaway
 *      container on our machines (`stackra-verify.mjs`, STA-2761; replaces the merge-now rule STA-2083). A commit
 *      status, or a check run any other App posts (stackra-bot included, which every agent can act as), never
 *      counts. The same App's `stackra/verify-mobile` and `stackra/codeql` runs are not required and never count
 *      here, either way.
 *   6. a PR that changes what the verify service checks (`isVerifyDefinition`, or a package.json definition field)
 *      is labelled `risk:R3`, so it needs the owner's approval below: the verify service runs main's definition.
 *   A PR labelled `design` or `risk:R3` also needs an owner APPROVED review on the head SHA, or `owner-approved` put
 *   there by the owner: the latest `labeled` / `unlabeled` issue event for it is a `labeled` whose actor is the owner
 *   user, never a bot (ADR 0119 decision 2 as amended 2026-10-28, ADR 0293). The events are read only then; an API
 *   error refuses the merge. The AI-REVIEW verdict is no longer a condition: the stackra-reviewer App is retired and
 *   AI review is advisory (ADR 0523 decision 6).
 *   With a merge queue it enqueues only while `enqueueReady` holds (owner order OP7): bot-token.mjs keeps a 30 s
 *   connect timeout and retries (STA-302).
 * Boundary: reads the PR, its checks and reviews through gh, then merges or enqueues it; changes nothing else.
 * Runtime: node
 * Governing contract: ADR 0119 (merge policy and release authority, amended 2026-11-10); ADR 0523 (decisions 3 and 6).
 * Network: gh reads retry on transient errors (bot-token.mjs); the merge or enqueue runs again after a transient
 *   failure only when a re-read shows the PR neither merged nor queued.
 * Exit: 0 merged or queued, 1 refused (reasons on stderr), 2 usage.
 * Secrets: the bot token stays in the gh child's environment.
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import * as botNetwork from "./bot-token.mjs";

export const OWNER = "figentra-usr";
const GATED_LABELS = ["design", "risk:R3"];
/** The label that stops a merge (ADR 0523 decision 3: the merger honours a HOLD label). */
export const HOLD_LABEL = "hold";
/** The check run `stackra-verify.mjs` posts on a head SHA; condition 5 needs it green (STA-2761). */
export const VERIFY_CHECK = "stackra/verify";
/**
 * The verify service's other check runs on the same head SHA, from the same App: the two Uniwind Pro members
 * (ci.yml's `mobile` job) and the nightly or on-demand CodeQL. Neither is required: neither passes nor blocks a merge.
 */
export const VERIFY_MOBILE_CHECK = "stackra/verify-mobile";
export const CODEQL_CHECK = "stackra/codeql";

/**
 * The App whose `stackra/verify` counts: the stackra-verify GitHub App (id 5907714), `checks: write` and
 * `contents: read` only, whose key only the verify service on box 1 holds. An App without an id passes nothing.
 */
export const VERIFY_APP = Object.freeze({ slug: "stackra-verify", id: 5_907_714 });

/**
 * The `stackra/verify` check run that decides condition 5 for `sha`, or undefined: among `checkRuns` (REST check
 * runs of the head, any order), only those created by `app` (slug AND id) for exactly `sha` count, and of those the
 * newest by id. Any other App, a commit status, or a run for another SHA can neither pass nor block a merge.
 */
export function verifyRun(checkRuns, sha, app = VERIFY_APP) {
  if (!app.id) return undefined;
  return checkRuns
    .filter(
      (r) =>
        r.name === VERIFY_CHECK &&
        r.head_sha === sha &&
        r.app?.slug === app.slug &&
        r.app?.id === app.id,
    )
    .toSorted((a, b) => a.id - b.id)
    .at(-1);
}

/**
 * The files that define what the verify service checks and that it always takes from main (STA-2761): scripts
 * pipelines, test, lint, format and knip configs, the config presets, the repository scripts and hooks (the Quality
 * Gate script and its Squawk flags live in `tools/scripts/stackra-verify.mjs`), the registry config, the git
 * attribute and ignore files, and the gate's policies: zizmor's (`.github/zizmor.yml`), gitleaks' (`.gitleaks.toml`,
 * `.gitleaksignore`), commitlint's, OSV-Scanner's (`osv-scanner.toml`) and the licence allowlist (`tools/policy/`).
 * Every name a gate tool discovers by itself is here, at any depth, from each tool's lookup list in the installed
 * versions (CTO review of #1043, HIGH 1): commitlint 21.2.3 (`@commitlint/load` lib/utils/load-config.js:
 * `package.yaml`, `.commitlintrc`, `.commitlintrc.{json,yaml,yml,js,cjs,mjs,ts,cts,mts}`,
 * `commitlint.config.{js,cjs,mjs,ts,cts,mts}`) on cosmiconfig 9.0.2 (dist/defaults.js metaSearchPlaces:
 * `package.yaml`, `.config/config.*`); pnpm's other manifest names (`package.json5`, `package.yaml`); knip 6.41.0
 * (dist/constants.js KNIP_CONFIG_LOCATIONS: `knip.json`, `knip.jsonc`, `.knip.json`, `.knip.jsonc`, `knip.ts`,
 * `knip.js`, `knip.config.ts`, `knip.config.js`); oxlint 1.86.0 (its binding's strings: `.oxlintrc.json(c)`,
 * `oxlint.config.{ts,mts}`, `.eslintignore`); oxfmt 0.71.0 (`.oxfmtrc.json(c)`, `oxfmt.config.{ts,mts}`,
 * `.prettierignore`, `.editorconfig`); actionlint 1.7.12 (`.github/actionlint.{yaml,yml}`); shellcheck 0.11.0
 * (`.shellcheckrc`, searched upward); shfmt 3.14.1 (`.editorconfig`); zizmor 1.31.1 (`zizmor.{yml,yaml}`); gitleaks
 * 8.30.1 (`.gitleaks.toml`, `.gitleaksignore`); OSV-Scanner 2.7.0 (`osv-scanner.toml`); squawk (`.squawk.toml`, from
 * its documentation: no squawk binary on box 1 to read). Extensions are widened to every module form. A PR's copy of
 * them never runs: the tested tree takes main's copy, and buildTree removes one main does not have. Also main's: the
 * Flow install under `.flow/` (its lock and override rules drive `fflow gate ci`, review LOW-4), and a
 * pnpm-workspace.yaml anywhere below the root (pnpm 12 reads settings such as `scriptShell` from it, review HIGH-2).
 * And every config module knip 6.41.0 executes for this repository's dependencies (review of #1043, round 5, C1:
 * its plugins load them with jiti in the one repo-wide knip process): babel, expo (`app.config.*`), metro,
 * playwright, react-native, react-router, tsdown, vite (and vite-plugin-pwa's `nuxt.config.*`), vitest, oxlint, oxfmt
 * and commitlint. A test derives that list from the installed knip's plugins and fails when a name is missing here.
 */
export const VERIFY_OVERLAY =
  /(?:^|\/)(?:turbo\.jsonc?|\.?knip(?:\.config)?\.(?:jsonc?|[cm]?[jt]s)|\.oxlintrc(?:\.jsonc?)?|\.oxfmtrc(?:\.jsonc?)?|ox(?:lint|fmt)\.config\.[cm]?[jt]s|vitest(?:\.[\w-]+)?\.config\.[cm]?[jt]s|(?:vite|tsdown|babel|metro|playwright|react-native|react-router|nuxt|app)\.config\.[cm]?[jt]s|\.babelrc(?:\.[cm]?[jt]s|\.json)?|vitest\.(?:workspace|projects)\.[cm]?[jt]s|\.npmrc|\.pnpmfile\.[cm]?js|lefthook(?:-local)?\.ya?ml|\.lefthook(?:-local)?\.ya?ml|\.gitattributes|\.gitignore|flow\.config\.jsonc?|\.gitleaks\.toml|\.gitleaksignore|osv-scanner\.toml|\.commitlintrc(?:\.\w+)?|commitlint\.config\.[cm]?[jt]s|package\.(?:yaml|yml|json5)|\.(?:eslint|oxlint|prettier)ignore|\.prettierrc(?:\.\w+)?|prettier\.config\.[cm]?[jt]s|\.editorconfig|\.?shellcheckrc|\.squawk\.toml)$|(?:^|\/)\.config\/|^(?:packages\/tooling|tools\/scripts|tools\/policy|\.agents\/hooks|\.opencode\/plugins|\.flow)\/|^(?:\.github\/)?(?:zizmor|actionlint)\.ya?ml$|^.+\/pnpm-workspace\.ya?ml$/;

/**
 * The verify-definition directories whose every file is main's, new ones included (a new file there is removed from
 * the tested tree even inside a new subdirectory): the config presets, the repository scripts and policies, the hooks.
 */
export const VERIFY_OVERLAY_DIRS =
  /^(?:packages\/tooling|tools\/scripts|tools\/policy|\.agents\/hooks|\.opencode\/plugins|\.flow)\//;

/**
 * Root-level files a PR may change without changing what the verify service checks: documentation no gate tool
 * reads as configuration. Every other root-level file is a verify definition (CTO design note on HIGH 1: an allow
 * list instead of chasing every tool's discovery rules): the tested tree takes main's copy, or drops the PR's when
 * main has none, and a PR that touches it needs the owner's review. Directories need no entry: a tool that walks up
 * for a config starts from the root or from the file it checks, so a config inside `docs/` or `apps/docs/` reaches
 * only its own folder, and the names above catch it at any depth.
 */
export const ROOT_INERT =
  /^(?:(?:README|LICEN[CS]E|NOTICE|CHANGELOG)(?:[.-][\w.-]+)?|(?:SECURITY|CONTRIBUTING|STATE|THIRD_PARTY_NOTICES|TRADEMARKS|AGENTS|CLAUDE)\.md|llms\.txt)$/;
/**
 * Root-level files that are tested code, not definitions: the PR's copy runs. package.json keeps its checks from main
 * (OVERLAY_FIELDS); the workspace and the lockfile are VERIFY_SENSITIVE; runway.yaml is what `runway env check`
 * checks.
 */
export const ROOT_TESTED = ["package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml", "runway.yaml"];

/** A root-level file that is neither inert nor tested code: a verify definition by default. */
export const isRootDefinition = (path) =>
  !path.includes("/") && !ROOT_INERT.test(path) && !ROOT_TESTED.includes(path);

/**
 * The config modules a repo-wide (shared-process) gate step may execute from any directory: every executable config
 * name of every knip plugin (knip runs once at the root and loads each workspace's configs with jiti, so a PR that adds
 * a dependency can enable a plugin this repository does not use yet) and oxfmt's nested `oxfmt.config.{ts,mts}`. For
 * the shared steps (SHARED_STEPS), a file matching this that is not main's copy is set aside (or main's copy laid in)
 * while the step runs (CTO ruling, round 5, C1). A test derives every name from the installed knip and fails when one
 * does not match.
 */
export const SHARED_STEP_LOADERS = new RegExp(
  [
    "(?:^|/)(?:",
    [
      "(?:[\\w.@*-]*[.-])?config(?:[.-][\\w*-]+)?",
      "\\.[\\w.-]*rc",
      "\\.?[\\w*.-]*\\.conf",
      "\\.?(?:cucumber|esbuild|gatsby-node|codegen|knexfile|nano-staged|serverless|release-it|simple-git-hooks)",
      "\\.?(?:typedoc|dependency-cruiser|eleventy|markdownlint(?:-cli2)?|stryker\\.conf(?:ig)?)",
      "(?:rsbuild|rslib)[\\w*.-]*\\.config|rspack\\.config[\\w*.-]*|vitest\\.(?:workspace|projects)",
      "\\.(?:rn)?storybook/(?:main|test-runner)|spec/support/jasmine|\\.railway/railway|\\.config/[\\w.-]+",
    ].join("|"),
    ")\\.[cm]?[jt]sx?$",
  ].join(""),
);

/**
 * Files a PR legitimately changes that still change what `pnpm verify` checks: the workspace (catalogs, overrides,
 * allowed builds), the TypeScript projects and the CLI the repository checks run, and `runway.yaml`, which decides
 * where things deploy (CTO ruling, round 4). The members whose built code the shared validate and env-names steps
 * load into one repo-wide process are here too (round 5, C1): the CLI and the repo-checks, runway and skills
 * (its contracts) members under packages/developer. The service runs the PR's copy, so
 * a change to them needs the owner's review (condition 6), like a change to VERIFY_OVERLAY.
 */
export const VERIFY_SENSITIVE =
  /^runway\.yaml$|(?:^|\/)(?:pnpm-workspace\.yaml|pnpm-lock\.yaml|tsconfig(?:\.[\w-]+)?\.json|vitest\.setup\.[cm]?[jt]s|setup-tests?\.[cm]?[jt]s|test-setup\.[cm]?[jt]s)$|^(?:packages\/developer\/(?:cli|repo-checks|runway|skills)|patches)\/|(?:^|\/)__tests__\/setup\.[cm]?[jt]s$/;

/**
 * How long a stackra/verify success against an older main counts (CTO ruling M3): long enough to enter the merge
 * queue, whose own commit verify sees the latest main. Older than this, the head waits for its re-verify.
 */
export const VERIFY_FRESH_MS = 24 * 60 * 60 * 1000;

/** Whether a run finished within VERIFY_FRESH_MS of `now`; a future or unreadable time never counts. */
export function isRecent(completedAt, now = Date.now()) {
  const age = now - Date.parse(completedAt ?? "");
  return Number.isFinite(age) && age >= 0 && age < VERIFY_FRESH_MS;
}

/** Conditions 1 to 6 for the main block: the facts from `verifyFacts` (runs, main, definition changes) always go in. */
export const mergeBlockers = (pr, runs, options, facts) =>
  blockers(pr, runs, {
    ...options,
    verifyRuns: facts.verifyRuns,
    mainSha: facts.mainSha,
    definitionChanges: facts.definitionChanges,
  });

export const isVerifyOverlay = (path) => VERIFY_OVERLAY.test(path) || isRootDefinition(path);
export const isVerifyDefinition = (path) => isVerifyOverlay(path) || VERIFY_SENSITIVE.test(path);

/**
 * The package.json fields that change what runs or resolves in a verify: commands, pnpm settings, overrides, and the
 * knip and commitlint configs a package.json can carry (the verify service takes those three from main's copy).
 */
export const DEFINITION_FIELDS = [
  "scripts",
  "knip",
  "commitlint",
  "pnpm",
  "overrides",
  "resolutions",
  "packageManager",
  // A workspace package's `bin` (or `directories.bin`) can shadow a tool another package runs (CTO review M1).
  "bin",
  "directories",
  // Which package manager and engines a command runs under (review of #1043, NIT).
  "devEngines",
];

/**
 * The executables the Quality Gate's commands run, mapped to the package that provides each (CTO ruling, round 4
 * of #1043, 2c): the steps' commands, the root scripts they call and every member script the steps' turbo tasks
 * run. A test derives the commands from the steps and fails when one runs an executable this map does not name (or
 * NOT_PACKAGE_COMMANDS lists as a system tool or a shell builtin).
 */
export const GATE_TOOL_BINS = Object.freeze({
  commitlint: "@commitlint/cli",
  fflow: "@figentra-oss/flow",
  knip: "knip",
  oxfmt: "oxfmt",
  oxlint: "oxlint",
  // A workspace member's bin (@stackra/cli): its own `bin` and `scripts` are definition fields already.
  stackra: "@stackra/cli",
  tsc: "typescript",
  tsdown: "tsdown",
  // Named by the CTO's ruling although no step runs it today.
  tsx: "tsx",
  turbo: "turbo",
  vitest: "vitest",
});
/**
 * What else the gate's commands run: the downloaded tools (the store image's TOOLS), node and pnpm from the image,
 * git, coreutils and shell syntax, and the migration-lint step's own `lint` shell function.
 */
export const NOT_PACKAGE_COMMANDS = Object.freeze([
  "actionlint",
  "case",
  "do",
  "done",
  "echo",
  "else",
  "esac",
  "exit",
  "fi",
  "find",
  "for",
  "git",
  "gitleaks",
  "grep",
  "if",
  "lint",
  "mapfile",
  "node",
  "osv-scanner",
  "pnpm",
  "shfmt",
  "sort",
  "squawk",
  "then",
  "zizmor",
]);
/** Packages whose resolution decides what the gate runs: GATE_TOOL_BINS' packages and the vitest and commitlint scopes. */
export const GATE_TOOL_PACKAGES = Object.freeze(
  [...new Set(Object.values(GATE_TOOL_BINS))].toSorted(),
);
export const isGateToolPackage = (name) =>
  GATE_TOOL_PACKAGES.includes(name) || /^@(?:vitest|commitlint)\//.test(name);

/** The registry package an `npm:<name>@<range>` alias names, or null. */
export const aliasTarget = (spec) =>
  /^npm:((?:@[^/@\s]+\/)?[^@\s]+)(?:@.*)?$/.exec(typeof spec === "string" ? spec : "")?.[1] ?? null;

/**
 * A package.json's specs for gate-tool packages (by key, or by the package an alias names), as one comparable string:
 * a change is a change to how the gate's runner resolves, so the PR needs the owner's review (risk:R3), while the
 * verify still runs on the PR's resolution (CTO ruling, round 4, 2c).
 */
const gateToolSpecsOf = (text) => {
  try {
    const json = JSON.parse(text ?? "{}");
    const out = [];
    for (const kind of [
      "dependencies",
      "devDependencies",
      "optionalDependencies",
      "peerDependencies",
    ])
      for (const [key, spec] of Object.entries(json[kind] ?? {}))
        if (isGateToolPackage(key) || isGateToolPackage(aliasTarget(spec) ?? ""))
          out.push([kind, key, spec]);
    return JSON.stringify(
      out.toSorted((a, b) => `${a[0]}:${a[1]}`.localeCompare(`${b[0]}:${b[1]}`)),
    );
  } catch {
    return "unparsable";
  }
};

/** A package.json text's definition fields as one comparable string (a missing file has none). */
const definitionOf = (text) => {
  try {
    const json = JSON.parse(text ?? "{}");
    return JSON.stringify(DEFINITION_FIELDS.map((field) => json[field] ?? null));
  } catch {
    return "unparsable";
  }
};

/**
 * Whether a package.json changed a definition field between base and head. `status` is GitHub's file status: an
 * added file has no base copy and a removed one no head copy; any other missing copy is a read failure, and a read
 * failure counts as a change (fails closed).
 */
export function definitionFieldsChanged(baseText, headText, status = "modified") {
  const baseMissing = baseText === null || baseText === undefined;
  const headMissing = headText === null || headText === undefined;
  if ((baseMissing && status !== "added") || (headMissing && status !== "removed")) return true;
  return (
    definitionOf(baseMissing ? null : baseText) !== definitionOf(headMissing ? null : headText) ||
    gateToolSpecsOf(baseMissing ? null : baseText) !==
      gateToolSpecsOf(headMissing ? null : headText)
  );
}

/** Kept for callers of the first version: only `scripts`, through definitionFieldsChanged. */
export const scriptsChanged = (baseText, headText) => definitionFieldsChanged(baseText, headText);

/**
 * What conditions 5 and 6 need, read through `api(path)` (parsed JSON, throws on an API error), `list(path)` (every
 * page of a list) and `raw(path, ref)`
 * (file text or null): the head's stackra/verify runs, main's current head, and the changed paths that define what
 * pnpm verify checks. GitHub lists at most 3000 files; a longer PR counts as a change.
 */
export function verifyFacts({ repo, n, headSha, api, list: listAll = api, raw }) {
  const verifyRuns = api(
    `repos/${repo}/commits/${headSha}/check-runs?check_name=${encodeURIComponent(VERIFY_CHECK)}&app_id=${VERIFY_APP.id}&filter=all&per_page=100`,
  ).check_runs;
  const pull = api(`repos/${repo}/pulls/${n}`);
  const mainSha = api(`repos/${repo}/commits/${pull.base.ref}`).sha;
  const files = listAll(`repos/${repo}/pulls/${n}/files?per_page=100`);
  const definitionChanges = [];
  if (pull.changed_files > files.length)
    definitionChanges.push(`${pull.changed_files - files.length} unlisted files`);
  for (const file of files)
    for (const path of [file.filename, file.previous_filename].filter(Boolean)) {
      if (isVerifyDefinition(path)) definitionChanges.push(path);
      else if (
        /(?:^|\/)package\.json$/.test(path) &&
        definitionFieldsChanged(raw(path, pull.base.sha), raw(path, headSha), file.status)
      )
        definitionChanges.push(path);
    }
  return { verifyRuns, mainSha, definitionChanges: [...new Set(definitionChanges)] };
}

/** The merge states in which the ruleset lets a PR without a merge queue merge. */
export const MERGEABLE_STATES = ["CLEAN", "HAS_HOOKS", "UNSTABLE"];

/**
 * OP7: the enqueue path is open only while the bot's network layer has a 30 s connect timeout and retries (STA-302),
 * declared as the `CONNECT_TIMEOUT_MS` and `RETRY_ATTEMPTS` exports of `bot-token.mjs`.
 */
export const enqueueReady = (network) =>
  network.CONNECT_TIMEOUT_MS >= 30_000 && network.RETRY_ATTEMPTS >= 2;

/** The label that stands for the owner's yes on a gated PR; only the owner adds it (ADR 0230 rule 4). */
export const OWNER_LABEL = "owner-approved";
/**
 * True when the owner put `owner-approved` on the PR and nobody took it off since: the latest `labeled` /
 * `unlabeled` event for it (REST issue events) is a `labeled` by the owner user (`user.type` User, never a bot or
 * an app account). A label any other actor added never counts, whatever the PR's labels say.
 */
export function ownerLabelled(events) {
  const last = events
    .filter((e) => ["labeled", "unlabeled"].includes(e.event) && e.label?.name === OWNER_LABEL)
    .toSorted((a, b) => a.created_at.localeCompare(b.created_at) || a.id - b.id)
    .at(-1);
  const who = last?.actor;
  return (
    last?.event === "labeled" &&
    who?.type === "User" &&
    who.login === OWNER &&
    !/\[bot\]$/i.test(who.login)
  );
}

/** Why the ruleset does not let a PR in a given merge state merge yet. */
const STATE_HINTS = {
  BEHIND: "the branch is behind its base: merge the base in",
  BLOCKED: "a required check or rule is not satisfied",
  DIRTY: "it has merge conflicts",
  DRAFT: "it is a draft",
  UNKNOWN: "GitHub is still computing it: run pr:merge again",
};

/**
 * Reasons the PR may not merge; empty means merge. `pr` carries `mergeStateStatus`; `checkRuns` are the head SHA's
 * "Quality Gate" runs; `queue` says the base branch has a merge queue; `reviews` are the REST pull reviews and
 * `events` the REST issue events (`ownerLabelled`), empty when not read; `verifyRuns` the head SHA's REST check runs
 * named stackra/verify (condition 5); `app` the accepted verify App; `definitionChanges` the changed paths that define
 * what pnpm verify checks (condition 6).
 */
export function blockers(
  pr,
  checkRuns,
  {
    queue = false,
    reviews = [],
    events = [],
    verifyRuns = [],
    app = VERIFY_APP,
    definitionChanges = [],
    mainSha,
    now = Date.now(),
  } = {},
) {
  const reasons = [];
  const sha = pr.headRefOid;
  if (pr.state !== "OPEN") reasons.push(`PR is ${pr.state}`);
  if (pr.isDraft) reasons.push("PR is a draft");

  const gate = [...checkRuns].toSorted((a, b) => b.id - a.id)[0];
  if (!gate) reasons.push(`no Quality Gate run on ${sha}`);
  else if (gate.conclusion !== "success")
    reasons.push(`Quality Gate on ${sha} is ${gate.conclusion ?? gate.status}`);

  const verify = verifyRun(verifyRuns, sha, app);
  if (!app.id)
    reasons.push(
      `the ${app.slug} App is not registered (VERIFY_APP has no id), so no ${VERIFY_CHECK} can pass`,
    );
  else if (!verify)
    reasons.push(
      `no ${VERIFY_CHECK} check run from ${app.slug} on ${sha}: wait for the verify service`,
    );
  else if (verify.status !== "completed")
    reasons.push(`${VERIFY_CHECK} on ${sha} is ${verify.status}: wait for it to finish`);
  else if (verify.conclusion !== "success")
    reasons.push(
      `${VERIFY_CHECK} on ${sha} is ${verify.conclusion}${verify.html_url ? ` (${verify.html_url})` : ""}`,
    );
  else if (
    mainSha &&
    verify.external_id !== `base:${mainSha}` &&
    !isRecent(verify.completed_at, now)
  )
    reasons.push(
      `${VERIFY_CHECK} on ${sha} was run against ${verify.external_id ?? "an unknown base"} more than a day ago, and main is now ${mainSha}: wait for the re-verify`,
    );

  const labelNames = new Set(pr.labels.map((l) => l.name));
  if (definitionChanges.length && !labelNames.has("risk:R3"))
    reasons.push(
      `it changes what the verify service checks (${definitionChanges.slice(0, 5).join(", ")}${definitionChanges.length > 5 ? ", …" : ""}), which the verify service never runs from a PR: label it risk:R3 for the owner's review`,
    );

  const state = pr.mergeStateStatus ?? "UNKNOWN";
  if (!queue && !MERGEABLE_STATES.includes(state))
    reasons.push(
      `the ruleset does not let it merge: mergeStateStatus is ${state}${STATE_HINTS[state] ? ` (${STATE_HINTS[state]})` : ""}`,
    );

  const labels = new Set(pr.labels.map((l) => l.name));
  if ([...labels].some((l) => l.toLowerCase() === HOLD_LABEL))
    reasons.push(`labelled ${HOLD_LABEL}: take the label off to merge`);

  const gated = GATED_LABELS.filter((l) => labels.has(l));
  const ownerApproved =
    (labels.has(OWNER_LABEL) && ownerLabelled(events)) ||
    reviews.some(
      (r) =>
        r.user?.type === "User" &&
        r.user.login === OWNER &&
        r.state === "APPROVED" &&
        r.commit_id === sha,
    );
  if (gated.length && !ownerApproved)
    reasons.push(
      `labelled ${gated.join(", ")}: needs an owner approval on ${sha} or the ${OWNER_LABEL} label added by ${OWNER}${labels.has(OWNER_LABEL) ? ` (the ${OWNER_LABEL} label on it was not added by ${OWNER}, or was removed since)` : ""}`,
    );
  return reasons;
}

/** `[-R|--repo owner/name] <n>` → the PR number and repo; `{owner}/{repo}` is gh's current-repo placeholder. */
export function parseArgs(argv) {
  const args = argv.filter((a) => a !== "--");
  let repo = "{owner}/{repo}";
  const rest = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "-R" || args[i] === "--repo") repo = args[++i] ?? "";
    else if (args[i].startsWith("--repo=")) repo = args[i].slice(7);
    else rest.push(args[i]);
  }
  const valid = repo === "{owner}/{repo}" || /^[\w.-]+\/[\w.-]+$/.test(repo);
  return rest.length === 1 && /^\d+$/.test(rest[0]) && valid ? { n: rest[0], repo } : null;
}

/** gh's stdout. Only a call marked `idempotent` (a read) is retried on a transient error; a write runs once. */
export function gh(args, token, idempotent = false) {
  const options = {
    encoding: "utf8",
    env: { ...process.env, GH_TOKEN: token },
    maxBuffer: 256 * 1024 * 1024,
  };
  const r = idempotent
    ? botNetwork.spawnRetrying("gh", args, options)
    : spawnSync("gh", args, options);
  if (r.error) throw new Error(`gh ${args[0]} ${args[1]} failed: ${r.error.message}`);
  if (r.status !== 0) throw new Error(`gh ${args[0]} ${args[1]} failed: ${r.stderr.trim()}`);
  return r.stdout;
}

/** A GraphQL call's data. A query is retried on a transient error, a mutation never: the document says which. */
export const graphql = (query, fields, token) =>
  JSON.parse(
    gh(
      ["api", "graphql", "-f", `query=${query}`, ...fields],
      token,
      botNetwork.isGraphqlRead(query),
    ),
  ).data;

/** Every page of a REST list endpoint, as one array. */
const list = (path, token) =>
  JSON.parse(gh(["api", "--paginate", "--slurp", path], token, true)).flat();

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const parsed = parseArgs(process.argv.slice(2));
  if (!parsed) {
    process.stderr.write("usage: pnpm pr:merge [-R owner/repo] <pr-number>\n");
    process.exit(2);
  }
  const { n, repo } = parsed;
  const R = repo.startsWith("{") ? [] : ["-R", repo];
  try {
    const token = await botNetwork.mintToken();
    const fields = "number,state,isDraft,headRefOid,baseRefName,labels,mergeStateStatus";
    const pr = JSON.parse(gh(["pr", "view", n, ...R, "--json", fields], token, true));
    const runs = JSON.parse(
      gh(
        ["api", `repos/${repo}/commits/${pr.headRefOid}/check-runs?check_name=Quality%20Gate`],
        token,
        true,
      ),
    ).check_runs;
    const [owner, name] = repo.startsWith("{") ? ["{owner}", "{repo}"] : repo.split("/");
    // -F (typed) fills gh's {owner}/{repo} placeholders and makes n an Int.
    const where = ["-F", `o=${owner}`, "-F", `r=${name}`, "-F", `n=${n}`];
    const { repository } = graphql(
      "query($o:String!,$r:String!,$n:Int!,$b:String!){repository(owner:$o,name:$r){" +
        "mergeQueue(branch:$b){id} pullRequest(number:$n){id}}}",
      [...where, "-f", `b=${pr.baseRefName}`],
      token,
    );
    // The owner's review and label events decide only a design or risk:R3 PR; `list` throws (refuse) on an API error.
    const labels = new Set(pr.labels.map((l) => l.name));
    const gated = GATED_LABELS.some((l) => labels.has(l));
    const reviews = gated ? list(`repos/${repo}/pulls/${n}/reviews?per_page=100`, token) : [];
    const events =
      gated && labels.has(OWNER_LABEL)
        ? list(`repos/${repo}/issues/${n}/events?per_page=100`, token)
        : [];
    // Conditions 5 and 6: read through verifyFacts, so the wiring is tested with fakes.
    const facts = verifyFacts({
      repo,
      n,
      headSha: pr.headRefOid,
      api: (path) => JSON.parse(gh(["api", path], token, true)),
      list: (path) => list(path, token),
      raw: (path, ref) => {
        const r = spawnSync(
          "gh",
          [
            "api",
            "-H",
            "Accept: application/vnd.github.raw",
            `repos/${repo}/contents/${path.split("/").map(encodeURIComponent).join("/")}?ref=${ref}`,
          ],
          {
            encoding: "utf8",
            env: { ...process.env, GH_TOKEN: token },
            maxBuffer: 16 * 1024 * 1024,
          },
        );
        return r.status === 0 ? r.stdout : null;
      },
    });
    const reasons = mergeBlockers(
      pr,
      runs,
      { queue: Boolean(repository.mergeQueue), reviews, events },
      facts,
    );
    if (reasons.length) {
      process.stderr.write(
        `pr-merge: not merging #${n}:\n${reasons.map((r) => `  - ${r}`).join("\n")}\n`,
      );
      process.exit(1);
    }
    // The gate is condition 2; a red non-required check is reported, not blocking.
    if (pr.mergeStateStatus === "UNSTABLE")
      process.stdout.write(
        `pr-merge: a non-required check on ${pr.headRefOid} is not green (mergeStateStatus UNSTABLE); reported, not blocking\n`,
      );
    if (repository.mergeQueue && !enqueueReady(botNetwork)) {
      throw new Error(
        `${pr.baseRefName} has a merge queue, but enqueueing needs CONNECT_TIMEOUT_MS >= 30000 and ` +
          "RETRY_ATTEMPTS >= 2 in bot-token.mjs (owner order OP7, STA-302); without undici the timeout is " +
          "10 s: run `pnpm install`",
      );
    }
    if (repository.mergeQueue) {
      // The queue squashes and deletes the branch (ruleset merge method, delete_branch_on_merge).
      const queued = () => {
        const { pullRequest } = graphql(
          "query($o:String!,$r:String!,$n:Int!){repository(owner:$o,name:$r){" +
            "pullRequest(number:$n){state mergeQueueEntry{id}}}}",
          where,
          token,
        ).repository;
        return Boolean(pullRequest.mergeQueueEntry) || pullRequest.state === "MERGED";
      };
      const entry = await botNetwork.retryUnlessLanded(
        () =>
          graphql(
            "mutation($id:ID!,$h:GitObjectID!){enqueuePullRequest(input:" +
              "{pullRequestId:$id,expectedHeadOid:$h}){mergeQueueEntry{position state}}}",
            ["-f", `id=${repository.pullRequest.id}`, "-f", `h=${pr.headRefOid}`],
            token,
          ).enqueuePullRequest.mergeQueueEntry,
        queued,
      );
      const place = entry
        ? `position ${entry.position}, ${entry.state}`
        : "landed before a transient error";
      process.stdout.write(`queued #${n} at ${pr.headRefOid}: ${place}\n`);
    } else {
      const merged = () =>
        JSON.parse(gh(["pr", "view", n, ...R, "--json", "state"], token, true)).state === "MERGED";
      const merge = ["pr", "merge", n, ...R, "--squash", "--delete-branch"];
      await botNetwork.retryUnlessLanded(
        () => gh([...merge, "--match-head-commit", pr.headRefOid], token),
        merged,
      );
      process.stdout.write(`merged #${n} at ${pr.headRefOid}\n`);
    }
  } catch (error) {
    process.stderr.write(`pr-merge: ${error.message}\n`);
    process.exit(1);
  }
}
