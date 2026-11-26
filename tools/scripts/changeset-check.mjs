#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: refuse a change to a published package that carries no changeset (STA-2604). `pnpm changeset:check`
 *   (chained into `pnpm verify` and run by the Quality Gate on every pull request) diffs the working tree against the
 *   base, maps each changed file to the workspace member that owns it, and fails unless every changed published
 *   member is named by a changeset the change adds or edits. `changeset status` alone passes when any changeset is
 *   pending, so one changeset for package A let a change to package B ship with no note (stackra#766, #770).
 * What counts: a file under a member that is not `private` and not in `.changeset/config.json` `ignore`, other than
 *   its tests and its generated `CHANGELOG.md`. Tests are `__tests__/` and `__fixtures__/` folders and `*.test.*` /
 *   `*.spec.*` files at any depth (ADR 0022), plus a `test/`, `tests/` or `e2e/` tier at the member root only: the
 *   same folder name inside `src/` is published source (`@stackra/testing` ships `src/e2e/` as its `./e2e` export),
 *   so it counts. When the config sets `changedFilePatterns`, only member-relative paths matching one of them count.
 *   A catalog bump counts too: an entry of `pnpm-workspace.yaml` `catalog` / `catalogs.<name>` whose version differs
 *   from the base touches every published member that ships it (a `dependencies`, `peerDependencies` or
 *   `optionalDependencies` spec of `catalog:`, `catalog:default` or `catalog:<name>`), because pnpm writes that
 *   version into the published manifest. A `devDependencies` entry does not ship, so it does not count.
 * Coverage: a changeset names the member with `major`, `minor`, `patch` or `none` (an explicit "no release" for that
 *   member). A changeset with no packages and a written reason (`pnpm changeset --empty`, then say why) waives the
 *   change only when no other changeset in it names a package; beside one that does, the empty one waives nothing
 *   and each member it would have covered must be named (`none` when it needs no release). The waived members are
 *   printed. An empty changeset with no reason fails. A changeset naming a member that is not a published workspace
 *   member fails, as `changeset version` would. Editing a pending changeset that already names a member counts as
 *   covering it: that pending note releases the member, so the change ships with it.
 * Base: `--base <ref>` (CI passes `HEAD~1`, the pull request's merge parent), else the merge base of HEAD and
 *   `origin/<baseBranch>` (else `<baseBranch>`). With no explicit base and neither ref present (a shallow checkout),
 *   it warns and passes; an explicit base that does not resolve fails. Uncommitted and untracked files count, so a
 *   local verify sees the changeset before it is committed. The changesets version branch is skipped, because it
 *   consumes changesets by design: only `changeset-release/<baseBranch>` exactly (from `GITHUB_HEAD_REF`, else the
 *   checked-out branch), and in a pull request (`GITHUB_EVENT_PATH`) only when its head repository is the base
 *   repository, so a fork cannot name its branch that way to pass.
 * Boundary: reads git and the working tree; writes nothing.
 * Runtime: node
 * Governing contract: ADR 0013 (Enforcement: changeset per changed member, chained into verify); ADR 0025; ADR 0177
 *   decision PK4 (a changeset is required); runbooks/release.mdx; STA-2604.
 * Exit: 0 covered (or skipped), 1 a changed published member has no changeset or a changeset is invalid, 2 usage or
 *   an unresolvable explicit base.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, matchesGlob } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

const BUMPS = new Set(["major", "minor", "patch", "none"]);
/** Test paths, member-relative: test folders and files at any depth, test tiers only at the member root. */
const TEST_PATH = /^(tests?|e2e)\/|(^|\/)(__tests__|__fixtures__)\/|\.(test|spec)\.[^/]+$/;

/**
 * Parse one changeset file.
 * @param {string} text the file's contents
 * @returns {{ releases: { name: string, type: string }[], summary: string } | { error: string }}
 */
export function parseChangeset(text) {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/);
  if (lines[0]?.trim() !== "---") return { error: "does not open with a --- front matter line" };
  const close = lines.indexOf("---", 1);
  if (close === -1) return { error: "front matter is not closed by a --- line" };
  const releases = [];
  for (const raw of lines.slice(1, close)) {
    const line = raw.trim();
    if (line === "" || line.startsWith("#")) continue;
    const m = /^(["']?)(.+?)\1\s*:\s*([a-z]+)$/.exec(line);
    if (!m || !BUMPS.has(m[3])) return { error: `unreadable front matter line: ${line}` };
    releases.push({ name: m[2], type: m[3] });
  }
  return {
    releases,
    summary: lines
      .slice(close + 1)
      .join("\n")
      .trim(),
  };
}

/**
 * Expand pnpm-workspace.yaml `packages` globs into member directories (repo-relative, posix).
 * Supports literal and `*` segments plus `!` exclusions, the forms this workspace uses.
 * @param {string} root
 * @param {string[]} globs
 * @returns {string[]}
 */
export function workspaceDirs(root, globs) {
  const include = globs.filter((g) => !g.startsWith("!"));
  const exclude = globs.filter((g) => g.startsWith("!")).map((g) => g.slice(1));
  const found = new Set();
  for (const glob of include) {
    let dirs = [""];
    for (const segment of glob.replace(/\/+$/, "").split("/")) {
      if (segment === "**") throw new Error(`workspace glob ${glob}: ** is not supported`);
      const next = [];
      for (const dir of dirs) {
        const abs = join(root, dir);
        if (!existsSync(abs) || !statSync(abs).isDirectory()) continue;
        const names = segment.includes("*")
          ? readdirSync(abs, { withFileTypes: true })
              .filter((e) => e.isDirectory() && matchesGlob(e.name, segment))
              .map((e) => e.name)
          : [segment];
        for (const name of names) next.push(dir ? `${dir}/${name}` : name);
      }
      dirs = next;
    }
    for (const dir of dirs) {
      if (existsSync(join(root, dir, "package.json")) && !exclude.some((x) => matchesGlob(dir, x)))
        found.add(dir);
    }
  }
  return [...found].toSorted();
}

/**
 * The published members: name and directory of every workspace member that changesets would release.
 * @param {string} root
 * @param {{ ignore?: string[] }} config
 * @returns {{ name: string, dir: string, manifest: Record<string, unknown> }[]}
 */
export function publishedMembers(root, config) {
  const workspace = parseYaml(readFileSync(join(root, "pnpm-workspace.yaml"), "utf8")) ?? {};
  const ignore = new Set(config.ignore ?? []);
  const members = [];
  for (const dir of workspaceDirs(root, workspace.packages ?? [])) {
    const pkg = JSON.parse(readFileSync(join(root, dir, "package.json"), "utf8"));
    if (pkg.name && pkg.private !== true && !ignore.has(pkg.name))
      members.push({ name: pkg.name, dir, manifest: pkg });
  }
  return members;
}

/**
 * Whether a changed file, relative to its member, counts as a change that needs a release note.
 * @param {string} rel member-relative posix path
 * @param {string[] | undefined} patterns `changedFilePatterns` from the config
 */
export function countsAsChange(rel, patterns) {
  if (rel === "CHANGELOG.md" || TEST_PATH.test(rel)) return false;
  if (!patterns || patterns.length === 0) return true;
  return patterns.some((p) => matchesGlob(rel, p));
}

/**
 * Decide whether the changed files are covered by changesets.
 * @param {{
 *   changed: string[],
 *   members: { name: string, dir: string }[],
 *   changesets: { file: string, text: string }[],
 *   changedFilePatterns?: string[],
 *   catalogTouched?: Map<string, string[]>,
 * }} input `catalogTouched`: member name to the catalog entries it ships that changed (see `catalogTouches`)
 * @returns {{ ok: boolean, missing: { name: string, files: string[] }[], invalid: string[], waivedBy: string[], waived: string[], ignoredWaivers: string[], covered: string[] }}
 */
export function check({ changed, members, changesets, changedFilePatterns, catalogTouched }) {
  const byDepth = members.toSorted((a, b) => b.dir.length - a.dir.length);
  const touched = new Map();
  for (const file of changed) {
    const member = byDepth.find((m) => file.startsWith(`${m.dir}/`));
    if (!member || !countsAsChange(file.slice(member.dir.length + 1), changedFilePatterns))
      continue;
    if (!touched.has(member.name)) touched.set(member.name, []);
    touched.get(member.name).push(file);
  }
  for (const [name, entries] of catalogTouched ?? []) {
    if (!touched.has(name)) touched.set(name, []);
    touched.get(name).push(...entries);
  }
  const known = new Set(members.map((m) => m.name));
  const named = new Set();
  const invalid = [];
  const empties = [];
  let naming = 0;
  for (const { file, text } of changesets) {
    const parsed = parseChangeset(text);
    if ("error" in parsed) {
      invalid.push(`${file}: ${parsed.error}`);
      continue;
    }
    if (parsed.releases.length === 0) {
      if (parsed.summary === "")
        invalid.push(`${file}: names no package and gives no reason; say why no release is needed`);
      else empties.push(file);
      continue;
    }
    naming += 1;
    for (const { name } of parsed.releases) {
      if (known.has(name)) named.add(name);
      else invalid.push(`${file}: ${name} is not a published workspace member`);
    }
  }
  // An empty changeset waives a whole change only when it is the change's only kind of note: beside a changeset that
  // names packages, one reason would silently cover every member the named ones leave out.
  const waivedBy = naming === 0 ? empties : [];
  const ignoredWaivers = naming === 0 ? [] : empties;
  const missing = [];
  const covered = [];
  const waived = [];
  for (const [name, files] of [...touched].toSorted(([a], [b]) => a.localeCompare(b))) {
    if (named.has(name)) covered.push(name);
    else if (waivedBy.length > 0) {
      covered.push(name);
      waived.push(name);
    } else missing.push({ name, files });
  }
  return {
    ok: missing.length === 0 && invalid.length === 0,
    missing,
    invalid,
    waivedBy,
    waived,
    ignoredWaivers,
    covered,
  };
}

/**
 * Read a `pnpm-workspace.yaml` document's catalogs: `catalog` is the default catalog, as is `catalogs.default`.
 * @param {unknown} workspace the parsed document
 * @returns {Map<string, Map<string, string>>} catalog name to dependency name to version
 */
function readCatalogs(workspace) {
  const out = new Map();
  const add = (catalog, entries) => {
    if (!entries || typeof entries !== "object") return;
    const into = out.get(catalog) ?? new Map();
    for (const [dep, version] of Object.entries(entries)) into.set(dep, String(version));
    out.set(catalog, into);
  };
  const doc = workspace && typeof workspace === "object" ? workspace : {};
  add("default", doc.catalog);
  for (const [catalog, entries] of Object.entries(doc.catalogs ?? {})) add(catalog, entries);
  return out;
}

/**
 * The catalog entries whose version differs between two `pnpm-workspace.yaml` documents (added and removed ones too).
 * @param {unknown} before the parsed base document
 * @param {unknown} after the parsed working-tree document
 * @returns {Map<string, Set<string>>} catalog name (`default` for `catalog`) to the changed dependency names
 */
export function changedCatalogEntries(before, after) {
  const a = readCatalogs(before);
  const b = readCatalogs(after);
  const changed = new Map();
  for (const catalog of new Set([...a.keys(), ...b.keys()])) {
    const was = a.get(catalog) ?? new Map();
    const is = b.get(catalog) ?? new Map();
    for (const dep of new Set([...was.keys(), ...is.keys()])) {
      if (was.get(dep) === is.get(dep)) continue;
      if (!changed.has(catalog)) changed.set(catalog, new Set());
      changed.get(catalog).add(dep);
    }
  }
  return changed;
}

/** The dependency fields pnpm publishes with the catalog's version written in; `devDependencies` never ship. */
const SHIPPED_DEPENDENCIES = ["dependencies", "peerDependencies", "optionalDependencies"];

/**
 * Which published members ship a changed catalog entry, so a catalog bump needs their changeset.
 * @param {{ name: string, manifest?: Record<string, unknown> }[]} members
 * @param {Map<string, Set<string>>} changed from `changedCatalogEntries`
 * @returns {Map<string, string[]>} member name to labels such as `pnpm-workspace.yaml (catalog default: zod)`
 */
export function catalogTouches(members, changed) {
  const touched = new Map();
  if (changed.size === 0) return touched;
  for (const { name, manifest } of members) {
    const labels = new Set();
    for (const field of SHIPPED_DEPENDENCIES) {
      const deps = manifest?.[field];
      if (!deps || typeof deps !== "object") continue;
      for (const [dep, spec] of Object.entries(deps)) {
        if (typeof spec !== "string" || !spec.startsWith("catalog:")) continue;
        const catalog = spec.slice("catalog:".length).trim() || "default";
        if (changed.get(catalog)?.has(dep))
          labels.add(`pnpm-workspace.yaml (catalog ${catalog}: ${dep})`);
      }
    }
    if (labels.size > 0) touched.set(name, [...labels].toSorted());
  }
  return touched;
}

function git(root, args) {
  const r = spawnSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return { ok: r.status === 0, out: (r.stdout ?? "").trim(), err: (r.stderr ?? "").trim() };
}

const lines = (s) => s.split("\n").filter(Boolean);

/**
 * Resolve the base commit to diff against.
 * @returns {{ sha: string } | { skip: string } | { fail: string }}
 */
export function resolveBase(root, explicit, baseBranch) {
  if (explicit) {
    const r = git(root, ["rev-parse", "--verify", "--quiet", `${explicit}^{commit}`]);
    return r.ok ? { sha: r.out } : { fail: `base ${explicit} does not resolve to a commit` };
  }
  for (const ref of [`origin/${baseBranch}`, baseBranch]) {
    if (!git(root, ["rev-parse", "--verify", "--quiet", `${ref}^{commit}`]).ok) continue;
    const mb = git(root, ["merge-base", "HEAD", ref]);
    if (mb.ok) return { sha: mb.out };
    return { skip: `no merge base between HEAD and ${ref} (shallow checkout?)` };
  }
  return { skip: `neither origin/${baseBranch} nor ${baseBranch} exists in this checkout` };
}

/**
 * Run the check against a repository.
 * @param {string} root repository root
 * @param {{
 *   base?: string,
 *   headRef?: string,
 *   pullRequest?: { headRepo?: string, baseRepo?: string },
 *   log?: (s: string) => void,
 *   warn?: (s: string) => void,
 * }} [opts] `pullRequest`: the repositories of the pull request being checked (CI), from `pullRequestRepos`
 * @returns {number} exit code
 */
export function run(
  root,
  { base, headRef, pullRequest, log = console.log, warn = console.error } = {},
) {
  const config = JSON.parse(readFileSync(join(root, ".changeset", "config.json"), "utf8"));
  const baseBranch = config.baseBranch ?? "main";
  const branch = headRef || git(root, ["rev-parse", "--abbrev-ref", "HEAD"]).out;
  if (branch === `changeset-release/${baseBranch}`) {
    const fork = pullRequest && pullRequest.headRepo !== pullRequest.baseRepo;
    if (!fork) {
      log(`changeset-check: ${branch} is the changesets version branch; skipped`);
      return 0;
    }
    warn(
      `changeset-check: ${branch} comes from ${pullRequest.headRepo ?? "an unknown repository"}, not ${pullRequest.baseRepo}; checked`,
    );
  }
  const resolved = resolveBase(root, base, baseBranch);
  if ("fail" in resolved) {
    warn(`changeset-check: ${resolved.fail}`);
    return 2;
  }
  if ("skip" in resolved) {
    warn(`changeset-check: skipped, ${resolved.skip}; pass --base <ref> to check`);
    return 0;
  }
  const diff = git(root, ["diff", "--name-only", "--no-renames", resolved.sha, "--"]);
  const untracked = git(root, ["ls-files", "--others", "--exclude-standard"]);
  if (!diff.ok || !untracked.ok) {
    warn(`changeset-check: git failed: ${diff.err || untracked.err}`);
    return 2;
  }
  const changed = [...new Set([...lines(diff.out), ...lines(untracked.out)])].toSorted();
  const changesets = changed
    .filter((f) => /^\.changeset\/[^/]+\.md$/.test(f) && f !== ".changeset/README.md")
    .filter((f) => existsSync(join(root, f)))
    .map((file) => ({ file, text: readFileSync(join(root, file), "utf8") }));
  const members = publishedMembers(root, config);
  let catalogTouched;
  if (changed.includes("pnpm-workspace.yaml")) {
    const was = git(root, ["show", `${resolved.sha}:pnpm-workspace.yaml`]);
    if (was.ok) {
      const entries = changedCatalogEntries(
        parseYaml(was.out),
        parseYaml(readFileSync(join(root, "pnpm-workspace.yaml"), "utf8")),
      );
      catalogTouched = catalogTouches(members, entries);
    }
  }
  const result = check({
    changed,
    members,
    changesets,
    changedFilePatterns: config.changedFilePatterns,
    catalogTouched,
  });
  for (const line of result.invalid) warn(`changeset-check: invalid changeset ${line}`);
  for (const { name, files } of result.missing) {
    const shown =
      files.slice(0, 3).join(", ") + (files.length > 3 ? `, +${files.length - 3} more` : "");
    warn(`changeset-check: ${name} changed (${shown}) and no changeset names it`);
  }
  if (!result.ok) {
    if (result.missing.length > 0 && result.ignoredWaivers.length > 0) {
      warn(
        `changeset-check: ${result.ignoredWaivers.join(", ")} waives nothing beside a changeset that names packages; ` +
          'name each package above in a changeset instead, with `"<package>": none` when it needs no release (ADR 0013).',
      );
    } else if (result.missing.length > 0) {
      warn(
        "changeset-check: add one with `pnpm changeset` naming each package above, or, when no release is needed, " +
          "`pnpm changeset --empty` and write why in its body (ADR 0013).",
      );
    }
    return 1;
  }
  const since = resolved.sha.slice(0, 10);
  if (result.covered.length === 0)
    log(`changeset-check: no published package changed since ${since}`);
  else if (result.waived.length > 0)
    log(
      `changeset-check: ${result.waived.length} changed package(s) waived by ${result.waivedBy.join(", ")}: ` +
        result.waived.join(", "),
    );
  else
    log(
      `changeset-check: ${result.covered.length} changed package(s) covered by changesets since ${since}`,
    );
  return 0;
}

/**
 * The head and base repositories of the pull request a GitHub Actions run checks, from its event payload.
 * @param {string | undefined} eventPath `GITHUB_EVENT_PATH`
 * @returns {{ headRepo?: string, baseRepo?: string } | undefined} undefined outside a pull request event
 */
export function pullRequestRepos(eventPath) {
  if (!eventPath || !existsSync(eventPath)) return undefined;
  let event;
  try {
    event = JSON.parse(readFileSync(eventPath, "utf8"));
  } catch {
    return undefined;
  }
  const pr = event?.pull_request;
  if (!pr) return undefined;
  return { headRepo: pr.head?.repo?.full_name, baseRepo: pr.base?.repo?.full_name };
}

function main(argv) {
  let base;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--base" && argv[i + 1]) base = argv[(i += 1)];
    else if (argv[i].startsWith("--base=")) base = argv[i].slice("--base=".length);
    else {
      console.error("usage: node tools/scripts/changeset-check.mjs [--base <ref>]");
      return 2;
    }
  }
  const top = spawnSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" });
  if (top.status !== 0) {
    console.error("changeset-check: not inside a git repository");
    return 2;
  }
  return run(top.stdout.trim(), {
    base,
    headRef: process.env.GITHUB_HEAD_REF,
    pullRequest: pullRequestRepos(process.env.GITHUB_EVENT_PATH),
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) process.exit(main(process.argv.slice(2)));
