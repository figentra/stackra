/**
 * Stackra file contract:
 * Purpose: `runRunway(argv, io)`, Runway's one deploy command (STA-268, ADR 0170), the body of the `runway` binary.
 *          Whatever starts a deploy, a merge to main or a person, the same caller workflow runs it in CI, in its
 *          protected GitHub environment, from a commit of main, so nothing is ever built or deployed from a
 *          workstation and GitHub records every deployment.
 *            plan [env]          what a deploy of `env` (default production) does, as JSON: each build-order target with
 *                                its caller workflows, the CI secret names the jobs read, and the member secret and var
 *                                names a deploy syncs into the runtimes (names only, never a value; the sync is STA-606)
 *            deploy <target>     needs a clean checkout of the head of origin/main; prints that SHA and dispatches each
 *                                caller workflow of <target>, with the SHA when the workflow takes a `sha` input
 *            promote <sha>       needs <sha> on origin/main; prints it and dispatches every caller workflow of the
 *                                `production` destinations that takes a `sha` input (a promote, or a rollback to a
 *                                recorded release); a caller that only builds the head of main is listed as skipped. A
 *                                caller with a `message` input gets `rollback to <sha>`, the provider's deployment
 *                                message, so the rollback has its own record (runbooks/deploys)
 *          `--dry-run` prints the `gh` commands instead of running them.
 * Boundary: reads runway.yaml, the member runways and the caller workflows under `io.root`; runs git and gh only
 *           through `io.git` and `io.gh`. Whether a runway file is valid is `pnpm validate`'s check
 *           (checkRunwayFiles). Never reads a secret value; gh uses the person's own login. The guard asks the owner
 *           before an agent runs deploy or promote (`runway-deploy`, .agents/hooks/_rules.mjs).
 * Runtime: node
 * Governing contract: ADR 0170 (what deploys where and how a release is promoted); STA-268.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";

import { parse } from "yaml";

import { deployPlan } from "#node/functions/deploy-plan.function";
import { deployPreflight } from "#node/functions/deploy-preflight.function";
import { readRunways } from "#node/functions/read-runways.function";
import { rollbackMessage } from "#node/functions/rollback-message.function";
import { workflowDispatches } from "#node/functions/workflow-dispatches.function";

/** How to call the binary; the error of a bad command. */
const USAGE = "usage: pnpm runway plan [env] | deploy <target> | promote <sha> [--dry-run]";

/**
 * Runs one `runway` command.
 *
 * @throws Error with the usage, or the reason a check failed.
 * @example
 * runRunway(["plan"], { root, git, gh, log: console.log }); // prints the production plan as JSON
 */
export function runRunway(
  argv: readonly string[],
  io: {
    readonly root: string;
    readonly git: (args: readonly string[]) => string;
    readonly gh: (args: readonly string[]) => void;
    readonly log: (line: string) => void;
  },
): void {
  const { values, positionals } = parseArgs({
    args: [...argv],
    allowPositionals: true,
    options: { "dry-run": { type: "boolean" } },
  });
  const [command, arg] = positionals;
  const runways = readRunways(io.root);
  if (command === "plan") {
    io.log(JSON.stringify(deployPlan(arg ?? "production", runways), null, 2));
    return;
  }
  if ((command !== "deploy" && command !== "promote") || !arg) throw new Error(USAGE);
  const { root } = runways;
  if (command === "deploy" && !root.targets?.[arg]?.workflows)
    throw new Error(
      `runway.yaml has no target "${arg}" with caller workflows (${Object.keys(root.targets ?? {}).join(", ")})`,
    );
  const sha = deployPreflight({ command, sha: arg, git: io.git });
  io.log(`commit ${sha}`);
  if (command === "promote") io.log(`record: ${rollbackMessage(sha)}`);
  const { runs, skipped } = workflowDispatches({
    root,
    targets:
      command === "deploy"
        ? [arg]
        : deployPlan("production", runways)
            .steps.filter((step) => step.destination)
            .map((step) => step.target),
    sha,
    promote: command === "promote",
    readWorkflow: (file) => parse(readFileSync(join(io.root, ".github/workflows", file), "utf8")),
  });
  for (const { target, file } of skipped)
    io.log(`skipped ${target}: ${file} builds the head of main and takes no sha`);
  for (const args of runs) {
    io.log(`gh ${args.join(" ")}`);
    if (!values["dry-run"]) io.gh(args);
  }
  // Readiness is the provider's smoke step; the run, its environment approval and its record are on GitHub.
  if (!values["dry-run"] && runs.length)
    io.log(
      `follow the runs: gh run list --repo ${root.providers.github.org}/${root.providers.github.repo} --event workflow_dispatch`,
    );
}
