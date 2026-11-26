#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: the full-history secret scan of every public ref of a repository and the stale-branch archive plan
 *   (STA-2878). `scan` runs the pinned gitleaks over every commit reachable from any ref (branches, tags and GitHub's
 *   `refs/pull/*`) twice, once under the repository's policy and once with gitleaks' default rules and no allowlist,
 *   and prints a Markdown report naming each finding by commit, file, line, rule and the refs that carry it, never by
 *   value. `branches` lists the branches merged into the base (by ancestry or by content, so squash merges count) and
 *   the `save/*` and `wt-*` snapshots. `archive` writes one verified git bundle per listed branch and the deletion
 *   commands for the owner to run after review; it never deletes or pushes anything.
 * Boundary: a local git directory (a `git clone --mirror` of the public repository, so every public ref is local),
 *   the `gitleaks` binary (`--gitleaks`, default `gitleaks` on PATH; mise.toml pins it, ADR 0027), files under the
 *   `--dir` given to `archive` and a temporary folder for gitleaks' JSON. No network, no push, no ref change.
 * Runtime: node
 * Governing contract: ADR 0009 (gitleaks scans; values never printed); ADR 0019 (exact toolchain pins); ADR 0027;
 *   ADR 0267 (the model never sees a secret); STA-2878.
 * Input:
 *   scan     --repo <git-dir> [--name <label>] [--config <toml>] [--ignore <file>] [--gitleaks <bin>]
 *            [--base <branch>] [--json <file>] [--fail-on-findings]
 *   branches --repo <git-dir> [--name <label>] [--base <branch>] [--prs <gh-pr-list.json>] [--keep <regex>]
 *            [--archive-list <file>] [--json <file>]
 *   archive  --repo <git-dir> --branches <file> --dir <out-dir> [--remote <name>] [--base <branch>]
 * Output: Markdown on stdout (`scan`, `branches`); `--json` writes the same rows as JSON; `--archive-list` writes the
 *   archive list's branch names, one per line, as the input of `archive`. `archive` writes
 *   `<dir>/<slug>.bundle` per branch, `<dir>/manifest.tsv` (branch, tip, bundle, sha256) and
 *   `<dir>/delete-after-review.sh` (one `git push <remote> --delete` per verified bundle; never run by this script).
 *   Exit 0 on success; 1 on a refusal or a failed tool, with one value-free line on stderr; 2 from `scan
 *   --fail-on-findings` when the policy pass reports a finding.
 * Secrets: gitleaks runs with `--redact=100`, and only an allow-listed set of value-free fields (commit, file, line,
 *   rule, entropy, refs) leaves this process. The matched text is read from git into memory only to tell a placeholder
 *   from a credential; before anything is printed or written, the output is checked against every matched text and a
 *   hit refuses with exit 1 instead of printing.
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const USAGE = [
  "usage: secrets-history-scan.mjs scan --repo <git-dir> [--name <label>] [--config <toml>] [--ignore <file>]",
  "         [--gitleaks <bin>] [--base <branch>] [--json <file>] [--fail-on-findings]",
  "       secrets-history-scan.mjs branches --repo <git-dir> [--name <label>] [--base <branch>] [--prs <file>]",
  "         [--keep <regex>] [--archive-list <file>] [--json <file>]",
  "       secrets-history-scan.mjs archive --repo <git-dir> --branches <file> --dir <out-dir> [--remote <name>] [--base <branch>]",
].join("\n");

/** A refusal: a value-free message and exit code 1. */
export class Refusal extends Error {}

/** Branches the archive plan never lists for deletion, whatever the input says. */
export const PROTECTED_BRANCHES = new Set([
  "main",
  "master",
  "development",
  "develop",
  "staging",
  "production",
  "encore",
]);

/** Words that mark a matched text as a test placeholder rather than a credential. */
const PLACEHOLDER_MARKERS = [
  "fake",
  "test",
  "example",
  "dummy",
  "canary",
  "placeholder",
  "sample",
  "changeme",
  "never",
  "redacted",
  "notreal",
  "not-a-real",
  "xxxx",
];

/** The only finding fields that reach the output. None of them can hold a value. */
const FINDING_FIELDS = [
  "commit",
  "file",
  "line",
  "rule",
  "entropy",
  "fingerprint",
  "policy",
  "kind",
  "onBase",
  "refs",
];

const FLAGS = new Set(["--fail-on-findings"]);
const OPTIONS = new Set([
  "--repo",
  "--name",
  "--config",
  "--ignore",
  "--gitleaks",
  "--base",
  "--json",
  "--prs",
  "--branches",
  "--dir",
  "--remote",
  "--keep",
  "--archive-list",
]);

/** `{ command, opts }` from argv, or a Refusal. Never echoes a value it was given. */
export function parseArgs(argv) {
  const [command, ...rest] = argv;
  if (!["scan", "branches", "archive"].includes(command)) throw new Refusal(USAGE);
  const opts = { base: "main", remote: "origin" };
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (FLAGS.has(arg)) {
      opts[camel(arg)] = true;
    } else if (OPTIONS.has(arg)) {
      const value = rest[++i];
      if (value === undefined || value.startsWith("--"))
        throw new Refusal(`${arg} needs a value\n${USAGE}`);
      opts[camel(arg)] = value;
    } else {
      throw new Refusal(`unknown argument #${i + 1}\n${USAGE}`);
    }
  }
  if (!opts.repo) throw new Refusal(`--repo is required\n${USAGE}`);
  if (opts.keep !== undefined) {
    try {
      opts.keep = new RegExp(opts.keep);
    } catch {
      throw new Refusal("--keep is not a valid regular expression");
    }
  }
  if (command === "archive" && (!opts.branches || !opts.dir))
    throw new Refusal(`archive needs --branches and --dir\n${USAGE}`);
  opts.name ??= opts.repo
    .replace(/\/+$/, "")
    .split("/")
    .at(-1)
    .replace(/\.git$/, "");
  return { command, opts };
}

const camel = (flag) => flag.slice(2).replaceAll(/-([a-z])/g, (_, c) => c.toUpperCase());

/** Runs a command and returns stdout, or throws a Refusal naming only the command. */
export function run(command, args, { cwd, allowStatus = [0] } = {}) {
  const r = spawnSync(command, args, { cwd, encoding: "utf8", maxBuffer: 1 << 30 });
  if (r.error) throw new Refusal(`${command} could not start (${r.error.code ?? "error"})`);
  if (!allowStatus.includes(r.status))
    throw new Refusal(`${command} ${args[0] ?? ""} exited ${r.status}`);
  return r.stdout;
}

const git = (repo, ...args) => run("git", ["-C", repo, ...args]);

/** The ref inventory of a repository: counts per namespace and the number of reachable commits. */
export function refInventory(repo) {
  const refs = git(repo, "for-each-ref", "--format=%(refname)").split("\n").filter(Boolean);
  const count = (prefix) => refs.filter((r) => r.startsWith(prefix)).length;
  const heads = count("refs/heads/");
  const tags = count("refs/tags/");
  const pulls = count("refs/pull/");
  return {
    heads,
    tags,
    pulls,
    other: refs.length - heads - tags - pulls,
    commits: Number(git(repo, "rev-list", "--all", "--count").trim()),
  };
}

/** Runs gitleaks over every commit of every ref and returns its findings (values redacted by gitleaks too). */
export function gitleaksAll(repo, { gitleaks = "gitleaks", config, ignore }) {
  const dir = mkdtempSync(join(tmpdir(), "history-scan-"));
  try {
    const report = join(dir, "report.json");
    const args = [
      "git",
      repo,
      "--log-opts=--all",
      "--redact=100",
      "--no-banner",
      "--exit-code",
      "0",
    ];
    args.push("--report-format", "json", "--report-path", report, "--config", config);
    // gitleaks reads `.gitleaksignore` from the scanned source when no path is given; an empty file turns that off
    const ignorePath = ignore ?? join(dir, "empty.gitleaksignore");
    if (!ignore) writeFileSync(ignorePath, "");
    args.push("--gitleaks-ignore-path", ignorePath);
    run(gitleaks, args);
    return JSON.parse(readFileSync(report, "utf8") || "[]");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** The gitleaks version line, for the report's method section. */
export const gitleaksVersion = (gitleaks = "gitleaks") => run(gitleaks, ["version"]).trim();

/** A value-free key for a finding: commit, file, rule and line. */
export const fingerprintOf = (f) => `${f.Commit}:${f.File}:${f.RuleID}:${f.StartLine}`;

/**
 * Reads the matched text of a finding from git, in memory only. Returns "" when the blob or line is gone.
 * The text is used for `classifyMatch` and the output guard and never leaves this process.
 */
export function matchedText(repo, f) {
  const r = spawnSync("git", ["-C", repo, "show", `${f.Commit}:${f.File}`], {
    encoding: "utf8",
    maxBuffer: 1 << 30,
  });
  if (r.status !== 0) return "";
  const lines = r.stdout.split("\n");
  const start = Math.max(0, (f.StartLine ?? 1) - 1);
  const end = Math.max(start, (f.EndLine ?? f.StartLine ?? 1) - 1);
  const text = lines.slice(start, end + 1).join("\n");
  if (start === end && f.StartColumn && f.EndColumn)
    return text.slice(f.StartColumn - 1, f.EndColumn);
  return text;
}

/**
 * The candidate secret inside a match: its longest run of token characters once PEM armor lines are removed, so a key
 * name (`apiKey = `) or a `-----END PRIVATE KEY-----` line is never mistaken for the value.
 */
export const candidateOf = (match) =>
  (
    match.replaceAll(/-----(BEGIN|END)[A-Z0-9 ]*-----/g, " ").match(/[A-Za-z0-9_\-+/=.:]{8,}/g) ??
    []
  ).reduce((longest, token) => (token.length > longest.length ? token : longest), "");

/**
 * "placeholder" when the candidate carries a placeholder word or too few distinct characters to be a credential;
 * otherwise "review", which means a person must look at it and rotate it if it is live.
 */
export function classifyMatch(match) {
  const candidate = candidateOf(match).toLowerCase();
  if (!candidate) return "review";
  if (PLACEHOLDER_MARKERS.some((m) => candidate.includes(m))) return "placeholder";
  if (new Set(candidate).size <= 4) return "placeholder";
  return "review";
}

/** The refs that carry a commit, grouped; branch and tag names are kept, pull refs are counted by PR number. */
export function refsContaining(repo, commit) {
  const refs = git(repo, "for-each-ref", "--contains", commit, "--format=%(refname)")
    .split("\n")
    .filter(Boolean);
  const heads = refs
    .filter((r) => r.startsWith("refs/heads/"))
    .map((r) => r.slice("refs/heads/".length));
  const tags = refs
    .filter((r) => r.startsWith("refs/tags/"))
    .map((r) => r.slice("refs/tags/".length));
  const pulls = [
    ...new Set(refs.filter((r) => r.startsWith("refs/pull/")).map((r) => Number(r.split("/")[2]))),
  ].toSorted((a, b) => a - b);
  return { heads, tags, pulls };
}

/** True when `commit` is reachable from `refs/heads/<base>`. */
export function isAncestor(repo, commit, base) {
  const r = spawnSync("git", [
    "-C",
    repo,
    "merge-base",
    "--is-ancestor",
    commit,
    `refs/heads/${base}`,
  ]);
  return r.status === 0;
}

/**
 * Merges the policy and the raw pass into value-free rows. A finding only the raw pass reports is "allowlisted" by
 * the repository's policy (a fixture path, an allow regex or a `.gitleaksignore` fingerprint).
 * Returns `{ rows, texts }`: `texts` are the matched texts, kept only for `assertValueFree`.
 */
export function buildFindings(repo, { policy, raw, base }) {
  const policyKeys = new Set(policy.map(fingerprintOf));
  const byKey = new Map();
  for (const f of [...policy, ...raw])
    if (!byKey.has(fingerprintOf(f))) byKey.set(fingerprintOf(f), f);
  const texts = [];
  const rows = [];
  for (const [fingerprint, f] of byKey) {
    const text = matchedText(repo, f);
    if (text) texts.push(text, candidateOf(text));
    for (const field of ["Secret", "Match"])
      if (f[field] && f[field] !== "REDACTED") texts.push(f[field]);
    const row = {
      commit: f.Commit,
      file: f.File,
      line: f.StartLine,
      rule: f.RuleID,
      entropy: Math.round((f.Entropy ?? 0) * 100) / 100,
      fingerprint,
      policy: policyKeys.has(fingerprint) ? "reported" : "allowlisted",
      kind: text ? classifyMatch(text) : "review",
      onBase: isAncestor(repo, f.Commit, base),
      refs: refsContaining(repo, f.Commit),
    };
    rows.push(Object.fromEntries(FINDING_FIELDS.map((k) => [k, row[k]])));
  }
  rows.sort(
    (a, b) => a.file.localeCompare(b.file) || a.commit.localeCompare(b.commit) || a.line - b.line,
  );
  return { rows, texts: texts.filter((t) => t && t.length >= 6) };
}

/** Refuses when any matched text appears in `output`. The last line of defence before anything is printed. */
export function assertValueFree(output, texts) {
  for (const t of texts)
    if (output.includes(t))
      throw new Refusal("refusing to print: a matched value reached the report");
  return output;
}

const list = (items, cap = 6) =>
  items.length === 0
    ? "—"
    : items
        .slice(0, cap)
        .map((i) => `\`${i}\``)
        .join(", ") + (items.length > cap ? ` and ${items.length - cap} more` : "");

const pullList = (pulls, cap = 6) =>
  pulls.length === 0
    ? "—"
    : pulls
        .slice(0, cap)
        .map((n) => `#${n}`)
        .join(", ") + (pulls.length > cap ? ` and ${pulls.length - cap} more` : "");

const cell = (s) => String(s).replaceAll("|", "\\|");

/** The Markdown report section for one repository's scan. */
export function renderScan({ name, inventory, version, base, rows }) {
  const reported = rows.filter((r) => r.policy === "reported");
  const review = rows.filter((r) => r.kind === "review");
  const out = [
    `### ${name}`,
    "",
    `Scanned ${inventory.commits} commits reachable from ${inventory.heads} branches, ${inventory.tags} tags and ` +
      `${inventory.pulls} pull request refs${inventory.other ? ` and ${inventory.other} other refs` : ""} with ${version}.`,
    "",
    `- Findings under the repository's policy (\`.gitleaks.toml\`, \`.gitleaksignore\`): **${reported.length}**`,
    `- Findings with gitleaks' default rules and no allowlist: **${rows.length}**`,
    `- Findings that look like a credential and need a person to look: **${review.length}**`,
    "",
  ];
  if (rows.length === 0) return [...out, "No findings.", ""].join("\n");
  out.push(
    `| File | Line | Commit | Rule | Policy | Looks like | On \`${base}\` | Branches | Tags | Pull requests |`,
    "| ---- | ---- | ------ | ---- | ------ | ---------- | ------- | -------- | ---- | ------------- |",
  );
  for (const r of rows)
    out.push(
      `| \`${cell(r.file)}\` | ${r.line} | \`${r.commit.slice(0, 12)}\` | ${r.rule} | ${r.policy} | ${r.kind} | ` +
        `${r.onBase ? "yes" : "no"} | ${list(r.refs.heads)} | ${list(r.refs.tags, 3)} | ${pullList(r.refs.pulls)} |`,
    );
  out.push("");
  return out.join("\n");
}

/** The `scan` command: returns `{ markdown, json, exitCode }`. */
export function scan(opts) {
  const repo = resolve(opts.repo);
  if (!existsSync(repo)) throw new Refusal("--repo does not exist");
  const dir = mkdtempSync(join(tmpdir(), "history-scan-config-"));
  try {
    const rawConfig = join(dir, "default-rules.toml");
    writeFileSync(rawConfig, "[extend]\nuseDefault = true\n");
    const policyConfig = opts.config ? resolve(opts.config) : rawConfig;
    const policy = gitleaksAll(repo, {
      gitleaks: opts.gitleaks,
      config: policyConfig,
      ignore: opts.ignore && resolve(opts.ignore),
    });
    const raw = gitleaksAll(repo, { gitleaks: opts.gitleaks, config: rawConfig });
    const { rows, texts } = buildFindings(repo, { policy, raw, base: opts.base });
    const inventory = refInventory(repo);
    const version = `gitleaks ${gitleaksVersion(opts.gitleaks).replace(/^v/, "")}`;
    const markdown = assertValueFree(
      renderScan({ name: opts.name, inventory, version, base: opts.base, rows }),
      texts,
    );
    const json = assertValueFree(
      JSON.stringify({ name: opts.name, inventory, version, findings: rows }, null, 2),
      texts,
    );
    const exitCode = opts.failOnFindings && rows.some((r) => r.policy === "reported") ? 2 : 0;
    return { markdown, json, exitCode };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** True when merging `branch` into `base` changes nothing: its content is already in the base (squash merges). */
export function contentInBase(repo, base, branch) {
  const r = spawnSync(
    "git",
    ["-C", repo, "merge-tree", "--write-tree", `refs/heads/${base}`, `refs/heads/${branch}`],
    {
      encoding: "utf8",
    },
  );
  if (r.status !== 0) return false;
  return (
    r.stdout.split("\n")[0].trim() === git(repo, "rev-parse", `refs/heads/${base}^{tree}`).trim()
  );
}

/** The classes a branch can have; the first four go on the archive list. */
export const BRANCH_CLASSES = [
  "merged",
  "content in base",
  "PR merged",
  "snapshot",
  "PR closed",
  "PR open",
  "open",
];
const ARCHIVE_CLASSES = new Set(BRANCH_CLASSES.slice(0, 4));

/**
 * A branch's class, from the strongest evidence first: its tip is in the base ("merged"); merging it changes nothing
 * ("content in base"); its tip is the head GitHub merged ("PR merged", the squash merges whose files the base has
 * since changed); a `save/*` or `wt-*` name ("snapshot"); its tip is the head of a closed, unmerged pull request
 * ("PR closed") or of an open one ("PR open"); otherwise "open". `prAtTip` is the pull request whose head is the tip.
 */
export function classifyBranch(repo, base, branch, tip, prAtTip) {
  if (isAncestor(repo, tip, base)) return "merged";
  if (contentInBase(repo, base, branch)) return "content in base";
  if (prAtTip?.state === "MERGED") return "PR merged";
  if (branch.startsWith("save/") || /(^|\/)wt-/.test(branch)) return "snapshot";
  if (prAtTip?.state === "CLOSED") return "PR closed";
  if (prAtTip?.state === "OPEN") return "PR open";
  return "open";
}

/** The pull request whose head is `tip` (a merged one first), else the branch's newest pull request, else null. */
export function prFor(prs, branch, tip) {
  const mine = prs
    .filter((pr) => pr.headRefName === branch)
    .toSorted((a, b) => b.number - a.number);
  const atTip = mine.filter((pr) => pr.headRefOid === tip);
  return {
    atTip: atTip.find((pr) => pr.state === "MERGED") ?? atTip[0] ?? null,
    latest: mine[0] ?? null,
  };
}

/** The `branches` command: every branch but the base, classified, with its tip, last commit date and PR. */
export function branches(opts) {
  const repo = resolve(opts.repo);
  if (!existsSync(repo)) throw new Refusal("--repo does not exist");
  const prs = opts.prs ? JSON.parse(readFileSync(resolve(opts.prs), "utf8")) : [];
  const lines = git(
    repo,
    "for-each-ref",
    "refs/heads",
    "--format=%(refname:lstrip=2)\t%(objectname)\t%(committerdate:short)",
  )
    .split("\n")
    .filter(Boolean);
  const rows = [];
  for (const line of lines) {
    const [branch, tip, date] = line.split("\t");
    if (branch === opts.base) continue;
    const { atTip, latest } = prFor(prs, branch, tip);
    const pr = atTip ?? latest;
    rows.push({
      branch,
      tip,
      date,
      class: classifyBranch(repo, opts.base, branch, tip, atTip),
      protected: PROTECTED_BRANCHES.has(branch) || Boolean(opts.keep?.test(branch)),
      pr: pr ? { number: pr.number, state: pr.state, atTip: pr === atTip } : null,
    });
  }
  rows.sort(
    (a, b) => classOrder(a.class) - classOrder(b.class) || a.branch.localeCompare(b.branch),
  );
  return {
    markdown: renderBranches(opts.name, opts.base, rows),
    json: JSON.stringify({ name: opts.name, base: opts.base, branches: rows }, null, 2),
    rows,
  };
}

/** The sort position of a branch class: the archive classes first. */
const classOrder = (c) => BRANCH_CLASSES.indexOf(c);

/** True when a branch belongs on the archive list: merged by any evidence or a snapshot, and not protected. */
export const archivable = (row) => !row.protected && ARCHIVE_CLASSES.has(row.class);

/** The Markdown section for one repository's branch list. */
export function renderBranches(name, base, rows) {
  const by = (c) => rows.filter((r) => r.class === c);
  const listed = rows.filter(archivable);
  const counts = BRANCH_CLASSES.filter((c) => by(c).length)
    .map((c) => `${c}: ${by(c).length}`)
    .join(", ");
  const out = [
    `### ${name}`,
    "",
    `${rows.length} branches besides \`${base}\` (${counts}). **${listed.length}** go on the archive list.`,
    "",
    "| Branch | Tip | Last commit | Class | Pull request |",
    "| ------ | --- | ----------- | ----- | ------------ |",
  ];
  for (const r of listed)
    out.push(
      `| \`${cell(r.branch)}\` | \`${r.tip.slice(0, 12)}\` | ${r.date} | ${r.class} | ${prCell(r.pr)} |`,
    );
  out.push("");
  const kept = rows.filter((r) => !r.protected && !archivable(r));
  if (kept.length) {
    out.push(
      `Kept, unmerged work (${kept.length}); a branch whose pull request was closed unmerged is the owner's call:`,
      "",
      "| Branch | Tip | Last commit | Class | Pull request |",
      "| ------ | --- | ----------- | ----- | ------------ |",
      ...kept.map(
        (r) =>
          `| \`${cell(r.branch)}\` | \`${r.tip.slice(0, 12)}\` | ${r.date} | ${r.class} | ${prCell(r.pr)} |`,
      ),
      "",
    );
  }
  const guarded = rows
    .filter((r) => r.protected)
    .toSorted((a, b) => a.branch.localeCompare(b.branch));
  if (guarded.length)
    out.push(
      `Never listed (protected or kept on purpose): ${guarded.map((r) => `\`${cell(r.branch)}\``).join(", ")}.`,
      "",
    );
  return out.join("\n");
}

const prCell = (pr) =>
  pr ? `#${pr.number} ${pr.state.toLowerCase()}${pr.atTip ? "" : ", earlier head"}` : "—";

/** A file-safe slug for a branch name. */
export const slugOf = (branch) => branch.replaceAll(/[^A-Za-z0-9._-]+/g, "__");

/**
 * The `archive` command: one bundle per listed branch, verified, its tip checked and hashed; then the manifest and
 * the deletion commands for the owner. Lines of the branch file are branch names; `#` starts a comment.
 */
export function archive(opts) {
  const repo = resolve(opts.repo);
  if (!existsSync(repo)) throw new Refusal("--repo does not exist");
  const wanted = readFileSync(resolve(opts.branches), "utf8")
    .split("\n")
    .map((l) => l.replace(/#.*/, "").trim())
    .filter(Boolean);
  for (const b of wanted) {
    if (PROTECTED_BRANCHES.has(b) || b === opts.base)
      throw new Refusal(`refusing to archive a protected branch: ${b}`);
    if (!/^[A-Za-z0-9._/-]+$/.test(b) || b.includes(".."))
      throw new Refusal("a branch name in --branches is not a plain ref name");
  }
  const dir = resolve(opts.dir);
  mkdirSync(dir, { recursive: true });
  const manifest = ["branch\ttip\tbundle\tsha256"];
  const deletes = [
    "#!/usr/bin/env bash",
    "# Written by secrets-history-scan.mjs archive. Review manifest.tsv, copy the bundles to a second place, then run.",
    "# Each line deletes one remote branch whose bundle verified; a branch that moved since is refused by --force-with-lease.",
    "set -euo pipefail",
  ];
  for (const branch of wanted) {
    const tip = git(repo, "rev-parse", "--verify", `refs/heads/${branch}^{commit}`).trim();
    const file = join(dir, `${slugOf(branch)}.bundle`);
    git(repo, "bundle", "create", file, `refs/heads/${branch}`);
    git(repo, "bundle", "verify", file);
    const heads = git(repo, "bundle", "list-heads", file);
    if (!heads.includes(`${tip} refs/heads/${branch}`))
      throw new Refusal(`bundle for ${branch} does not hold its tip`);
    const sha = createHash("sha256").update(readFileSync(file)).digest("hex");
    manifest.push(`${branch}\t${tip}\t${slugOf(branch)}.bundle\t${sha}`);
    deletes.push(
      `git push ${opts.remote} --force-with-lease=refs/heads/${branch}:${tip} --delete refs/heads/${branch}`,
    );
  }
  writeFileSync(join(dir, "manifest.tsv"), `${manifest.join("\n")}\n`);
  writeFileSync(join(dir, "delete-after-review.sh"), `${deletes.join("\n")}\n`, { mode: 0o644 });
  return { count: wanted.length, dir };
}

/** Entry point; returns the exit code. */
export function main(
  argv,
  io = { out: (s) => process.stdout.write(s), err: (s) => process.stderr.write(s) },
) {
  try {
    const { command, opts } = parseArgs(argv);
    if (command === "archive") {
      const { count, dir } = archive(opts);
      io.out(`archived ${count} branch(es) as verified bundles in ${dir}; nothing was deleted\n`);
      return 0;
    }
    const result = command === "scan" ? scan(opts) : branches(opts);
    if (opts.json) writeFileSync(resolve(opts.json), `${result.json}\n`);
    if (command === "branches" && opts.archiveList) {
      const names = result.rows.filter(archivable).map((r) => r.branch);
      writeFileSync(resolve(opts.archiveList), names.length ? `${names.join("\n")}\n` : "");
    }
    io.out(`${result.markdown}\n`);
    return result.exitCode ?? 0;
  } catch (error) {
    if (error instanceof Refusal) {
      io.err(`secrets-history-scan: ${error.message}\n`);
      return 1;
    }
    io.err(`secrets-history-scan: unexpected ${error?.name ?? "error"}\n`);
    return 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
