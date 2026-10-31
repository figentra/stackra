/**
 * Stackra file contract:
 * Purpose: `workflowDispatches(…)`, the `gh` argument lists that dispatch each caller workflow of `targets` on main,
 *          with `sha=<sha>` when the workflow has a `workflow_dispatch` input `sha`. With `promote`, a workflow
 *          without that input cannot deploy a given commit and is returned in `skipped` instead, and one with a
 *          `message` input gets `message=rollback to <sha>`.
 * Boundary: pure; reads each workflow only through `readWorkflow` and dispatches nothing.
 * Runtime: node
 * Governing contract: ADR 0170; STA-268.
 */
import { rollbackMessage } from "#node/functions/rollback-message.function";
import type { DeployRunways } from "#node/types/deploy-runways.type";
import type { WorkflowDispatches } from "#node/types/workflow-dispatches.type";

/** The part of a parsed workflow a dispatch reads. */
type Workflow =
  | {
      readonly on?: {
        readonly workflow_dispatch?: { readonly inputs?: Readonly<Record<string, unknown>> };
      };
    }
  | null
  | undefined;

/**
 * The dispatches of a deploy (or, with `promote`, a promote) of `targets` at `sha`.
 *
 * @example
 * workflowDispatches({ root, targets: ["mintlify"], sha, readWorkflow }).runs[0]?.slice(0, 3); // ["workflow", "run", "deploy-docs.yml"]
 */
export function workflowDispatches({
  root,
  targets,
  sha,
  promote = false,
  readWorkflow,
}: {
  readonly root: DeployRunways["root"];
  readonly targets: readonly string[];
  readonly sha: string;
  readonly promote?: boolean;
  readonly readWorkflow: (file: string) => Workflow;
}): WorkflowDispatches {
  const repo = `${root.providers.github.org}/${root.providers.github.repo}`;
  const runs: string[][] = [];
  const skipped: { target: string; file: string }[] = [];
  for (const target of targets)
    for (const file of Object.values(root.targets?.[target]?.workflows ?? {})) {
      const inputs = readWorkflow(file)?.on?.workflow_dispatch?.inputs ?? {};
      const takesSha = Boolean(inputs["sha"]);
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
          ...(promote && inputs["message"] ? ["-f", `message=${rollbackMessage(sha)}`] : []),
        ]);
    }
  return { runs, skipped };
}
