/**
 * Stackra file contract:
 * Purpose: unit tests of `workflowDispatches` and `rollbackMessage`: main, the SHA only where the caller takes one, a
 *          promote skips the others, and a promote passes the rollback message to a caller that takes one.
 * Boundary: test only; workflows are stand-ins and nothing is dispatched.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0170; STA-268.
 */
import { describe, expect, it } from "@stackra/testing";

import { rollbackMessage } from "#node/functions/rollback-message.function";
import { workflowDispatches } from "#node/functions/workflow-dispatches.function";

import { MAIN, OLD, ROOT_RUNWAY } from "./fixtures/deploy-runways.fixture";

/** The `gh` arguments of a deploy or promote of `mintlify` whose caller takes `sha` and `message`. */
const mintlifyArgs = (promote: boolean) =>
  workflowDispatches({
    root: ROOT_RUNWAY,
    targets: ["mintlify"],
    sha: OLD,
    promote,
    readWorkflow: () => ({ on: { workflow_dispatch: { inputs: { sha: {}, message: {} } } } }),
  }).runs[0];

describe("workflowDispatches", () => {
  it("dispatches on main, the SHA only where the caller takes one, and a promote skips the others", () => {
    const takesSha = new Set(["deploy-web.yml", "deploy-static.yml"]);
    const readWorkflow = (file: string) =>
      takesSha.has(file) ? { on: { workflow_dispatch: { inputs: { sha: {} } } } } : { on: {} };
    expect(
      workflowDispatches({ root: ROOT_RUNWAY, targets: ["mintlify"], sha: MAIN, readWorkflow }),
    ).toEqual({
      runs: [["workflow", "run", "deploy-docs.yml", "--repo", "acme/platform", "--ref", "main"]],
      skipped: [],
    });
    const promote = workflowDispatches({
      root: ROOT_RUNWAY,
      targets: ["cloudflare-workers", "mintlify"],
      sha: OLD,
      promote: true,
      readWorkflow,
    });
    expect(promote.runs.map((args) => [args[2], args.at(-1)])).toEqual([
      ["deploy-web.yml", `sha=${OLD}`],
      ["deploy-static.yml", `sha=${OLD}`],
    ]);
    expect(promote.skipped).toEqual([{ target: "mintlify", file: "deploy-docs.yml" }]);
  });

  it("passes the rollback message on a promote to a caller that takes one, never on a deploy", () => {
    expect(mintlifyArgs(true)?.slice(-4)).toEqual([
      "-f",
      `sha=${OLD}`,
      "-f",
      `message=rollback to ${OLD}`,
    ]);
    expect(rollbackMessage(OLD)).toBe(`rollback to ${OLD}`);
    expect(mintlifyArgs(false)?.at(-1)).toBe(`sha=${OLD}`);
  });
});
