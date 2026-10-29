#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: `pnpm runway` — Runway's one deploy command (STA-268, ADR 0170). Whatever starts a deploy, a merge to main or
 *   a person, the same caller workflow runs it in CI, in its protected GitHub environment, from a commit of main, so
 *   nothing is ever built or deployed from a workstation and GitHub records every deployment.
 *     plan [env]          what a deploy of `env` (default production) does, as JSON: each build-order target with its
 *                         caller workflows, the CI secret names the jobs read, and the member secret and var names a
 *                         deploy syncs into the runtimes (names only, never a value; the sync is STA-606)
 *     deploy <target>     needs a clean checkout of the head of origin/main; prints that SHA and dispatches each
 *                         caller workflow of <target>, with the SHA when the workflow takes a `sha` input
 *     promote <sha>       needs <sha> on origin/main; prints it and dispatches every caller workflow of the
 *                         `production` destinations that takes a `sha` input (a promote, or a rollback to a recorded
 *                         release); a caller that only builds the head of main is listed as skipped. A caller with a
 *                         `message` input gets `rollback to <sha>`, the provider's deployment message, so the
 *                         rollback has its own record (runbooks/deploys)
 *   `--dry-run` prints the `gh` commands instead of running them.
 * Boundary: reads runway.yaml, the member runways and the caller workflows; runs git and gh. Whether a runway file is
 *   valid is `pnpm validate`'s check (checkRunwayFiles). Never reads a secret value.
 * Runtime: node
 * Governing contract: ADR 0170 (what deploys where and how a release is promoted); STA-268.
 * Secrets: none; gh uses the person's own login. The guard asks the owner before an agent runs deploy or promote
 *   (`runway-deploy`, .agents/hooks/_rules.mjs).
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { parse } from "yaml";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
/** The member roots that may hold a member runway (ADR 0296; `workers/` per ADR 0284). */
const MEMBER_ROOTS = ["apps", "services", "workers"];
const USAGE = "usage: pnpm runway plan [env] | deploy <target> | promote <sha> [--dry-run]";

/** The root runway and every member runway under `root`, parsed. */
export function readRunways(root = ROOT) {
  const read = (path) => parse(readFileSync(join(root, path), "utf8"));
  const members = MEMBER_ROOTS.flatMap((dir) =>
    existsSync(join(root, dir))
      ? readdirSync(join(root, dir))
          .filter((name) => existsSync(join(root, dir, name, "runway.yaml")))
          .map((name) => ({ member: name, runway: read(`${dir}/${name}/runway.yaml`) }))
      : [],
  );
  return { root: read("runway.yaml"), members };
}

/** What a deploy of `env` does, from the runways (names only). */
export function plan(env, { root, members }) {
  const environment = root.environments?.[env];
  if (!environment) throw new Error(`runway.yaml has no environment "${env}"`);
  const destinations = new Set(Object.values(environment.destinations ?? {}));
  const infisical = root.providers?.infisical ?? {};
  const defaultPath = root.secrets?.defaultPath;
  return {
    environment: env,
    infisicalEnvironment: infisical.environments?.[env] ?? null,
    steps: (root.release?.buildOrder ?? [])
      .filter((target) => root.targets?.[target])
      .map((target) => ({
        target,
        destination: destinations.has(target),
        workflows: root.targets[target].workflows ?? {},
      })),
    ci: root.secrets?.ci ?? [],
    sync: members.flatMap(({ member, runway }) => {
      const own = runway.environments?.[env] ?? {};
      return [
        ...[...new Set([...(runway.secrets ?? []), ...(own.secrets ?? [])])].map((name) => ({
          member,
          kind: "secret",
          name,
          path: infisical.paths?.[defaultPath] ?? null,
        })),
        ...Object.keys(own.vars ?? {}).map((name) => ({ member, kind: "var", name })),
      ];
    }),
  };
}

/**
 * The full SHA a command deploys, after its checks. `git(args)` returns trimmed stdout and throws on a non-zero exit.
 * deploy: a clean tree whose HEAD is the head of origin/main. promote: `sha` names a commit on origin/main.
 */
export function preflight({ command, sha, git }) {
  git(["fetch", "--quiet", "origin", "main"]);
  const mainSha = git(["rev-parse", "origin/main"]);
  if (command === "deploy") {
    if (git(["status", "--porcelain"]) !== "")
      throw new Error(
        "the working tree has uncommitted changes; deploy from a clean checkout of main",
      );
    const head = git(["rev-parse", "HEAD"]);
    if (head !== mainSha)
      throw new Error(
        `HEAD ${head} is not the head of origin/main (${mainSha}); check out main and pull, then run it again`,
      );
    return head;
  }
  let full;
  try {
    full = git(["rev-parse", "--verify", "--quiet", `${sha}^{commit}`]);
  } catch {
    throw new Error(`"${sha}" names no commit here; fetch it first`);
  }
  try {
    git(["merge-base", "--is-ancestor", full, mainSha]);
  } catch {
    throw new Error(`${full} is not on origin/main; only commits of main are promoted`);
  }
  return full;
}

/** The deployment message a promote records: the provider keeps it beside its own record of the deploy. */
export const rollbackMessage = (sha) => `rollback to ${sha}`;

/**
 * The `gh` argument lists that dispatch each caller workflow of `targets` on main, with `sha=<sha>` when the workflow
 * has a `workflow_dispatch` input `sha`. With `promote`, a workflow without that input cannot deploy a given commit
 * and is returned in `skipped` instead, and one with a `message` input gets `message=rollback to <sha>`.
 * `readWorkflow(file)` returns the parsed workflow.
 */
export function dispatches({ root, targets, sha, promote = false, readWorkflow }) {
  const repo = `${root.providers.github.org}/${root.providers.github.repo}`;
  const runs = [];
  const skipped = [];
  for (const target of targets)
    for (const file of Object.values(root.targets?.[target]?.workflows ?? {})) {
      const inputs = readWorkflow(file)?.on?.workflow_dispatch?.inputs ?? {};
      const takesSha = Boolean(inputs.sha);
      if (promote && !takesSha) skipped.push({ target, file });
      else
        runs.push([
          "workflow",
          "run",
          file,
          "--repo",
          repo,
          "--ref",
          "main",
          ...(takesSha ? ["-f", `sha=${sha}`] : []),
          ...(promote && inputs.message ? ["-f", `message=${rollbackMessage(sha)}`] : []),
        ]);
    }
  return { runs, skipped };
}

/** Runs git in the repository root; returns trimmed stdout and throws on a non-zero exit. */
const runGit = (args) =>
  execFileSync("git", args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();

function main(argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: { "dry-run": { type: "boolean" } },
  });
  const [command, arg] = positionals;
  const runways = readRunways();
  if (command === "plan") {
    console.log(JSON.stringify(plan(arg ?? "production", runways), null, 2));
    return;
  }
  if ((command !== "deploy" && command !== "promote") || !arg) throw new Error(USAGE);
  const { root } = runways;
  if (command === "deploy" && !root.targets?.[arg]?.workflows)
    throw new Error(
      `runway.yaml has no target "${arg}" with caller workflows (${Object.keys(root.targets ?? {}).join(", ")})`,
    );
  const sha = preflight({ command, sha: arg, git: runGit });
  console.log(`commit ${sha}`);
  if (command === "promote") console.log(`record: ${rollbackMessage(sha)}`);
  const { runs, skipped } = dispatches({
    root,
    targets:
      command === "deploy"
        ? [arg]
        : plan("production", runways)
            .steps.filter((step) => step.destination)
            .map((step) => step.target),
    sha,
    promote: command === "promote",
    readWorkflow: (file) => parse(readFileSync(join(ROOT, ".github/workflows", file), "utf8")),
  });
  for (const { target, file } of skipped)
    console.log(`skipped ${target}: ${file} builds the head of main and takes no sha`);
  for (const args of runs) {
    console.log(`gh ${args.join(" ")}`);
    if (!values["dry-run"]) execFileSync("gh", args, { stdio: "inherit" });
  }
  // Readiness is the provider's smoke step; the run, its environment approval and its record are on GitHub.
  if (!values["dry-run"] && runs.length)
    console.log(
      `follow the runs: gh run list --repo ${root.providers.github.org}/${root.providers.github.repo} --event workflow_dispatch`,
    );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(`runway: ${error.message}`);
    process.exit(1);
  }
}
