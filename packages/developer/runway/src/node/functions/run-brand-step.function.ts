/**
 * Stackra file contract:
 * Purpose: `runBrandStep(request)`, Runway's brand step: runs @stackra/brand-kit in CI once per web surface and per
 *          mobile app of the root runway (or, for a scope-started white-label build, once for that app from the
 *          scope's theme kit), each with the outputs its kind needs and its own output folder under `.stackra/brand`,
 *          then, after a write, fails when any generated output is committed.
 * Boundary: reads the root runway; runs the kit's binary and `git` through the command runner and writes nothing
 *           itself (the kit writes only under its `--out-dir`). The `ops` surface has no shell and gets no run. Wiring
 *           the outputs into an app's config is the build's (the mobile job, the surface build), not this step's.
 * Runtime: node
 * Governing contract: ADR 0441 (as amended: D17, the brand kit runs in CI as a Runway step and its outputs are never
 *                     committed); ADR 0439 (decision 8); ADR 0352 (decision 3); app-shells section 14.
 */
import { join } from "node:path";

import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import type { RunwayIssue } from "#core/types/runway-issue.type";
import { BRAND_STEP_SETTINGS } from "#node/constants/brand-step-settings.constant";
import { committedBrandOutputs } from "#node/functions/committed-brand-outputs.function";
import { readRunway } from "#node/functions/read-runway.function";
import { runCommand } from "#node/functions/run-command.function";
import type { BrandStepRequest } from "#node/types/brand-step-request.type";
import type { BrandStepRun } from "#node/types/brand-step-run.type";

/** A path segment safe to put in an output folder: a scope id or a key. */
const SEGMENT = /^[A-Za-z0-9_-]+$/;

/** A repository-relative folder that does not climb out or start with `/`. */
function isInside(path: string): boolean {
  return path !== "" && !path.startsWith("/") && !path.split(/[\\/]/).includes("..");
}

/** The runs a request asks for, checked against the root runway. */
function plan(request: BrandStepRequest): BrandStepRun[] {
  const root = readRunway(join(request.repository, "runway.yaml"), "root");
  const { outDir, outputs } = BRAND_STEP_SETTINGS;
  const variant = request.variant;
  if (variant !== undefined) {
    const issues: RunwayIssue[] = [];
    const at = `mobile.${variant.app}`;
    if (root.mobile?.[variant.app]?.whiteLabel === undefined) {
      issues.push({ path: `${at}.whiteLabel`, message: "The app has no white-label variants" });
    }
    if (!SEGMENT.test(variant.scope)) {
      issues.push({
        path: "variant.scope",
        message: "Expected a scope id of letters, digits, _ or -",
      });
    }
    if (!isInside(variant.kitDir)) {
      issues.push({ path: "variant.kitDir", message: "Expected a folder inside the repository" });
    }
    if (issues.length > 0) throw new RunwayInvalidError("runway.yaml", issues);
    return [
      {
        surface: variant.app,
        scope: variant.scope,
        outDir: `${outDir}/scopes/${variant.scope}/${variant.app}`,
        outputs: outputs.whiteLabel,
      },
    ];
  }

  const runs: BrandStepRun[] = [
    ...Object.keys(root.surfaces ?? {})
      .filter((surface) => surface !== "ops")
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
      .sort()
      .map((surface) => ({ surface, outDir: `${outDir}/web/${surface}`, outputs: outputs.web })),
    ...Object.keys(root.mobile ?? {})
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
      .sort()
      .map((app) => ({ surface: app, outDir: `${outDir}/mobile/${app}`, outputs: outputs.mobile })),
  ];
  if (runs.length === 0) {
    throw new RunwayInvalidError("runway.yaml", [
      { path: "surfaces", message: "No web surface or mobile app to build the brand for" },
    ]);
  }
  return runs;
}

/**
 * Runs the brand step.
 *
 * @param request - the repository, check or write, the parent kit and, for a white-label build, the variant.
 * @returns the brand-kit runs made, in order.
 * @throws RunwayInvalidError when the root runway has nothing to brand, a variant's app has no white-label, a scope
 *         id or kit folder is unsafe, or (after a write) a generated output is committed.
 * @throws Error from the command runner when the kit exits with an error (a failed `--check` included).
 * @example
 * await runBrandStep({ repository: ".", parentKitDir: "../os/tools/brand-kit/figentra" });
 * await runBrandStep({ repository: ".", variant: { app: "shopper", scope: "sc_42", kitDir: ".stackra/scope-kits/sc_42" } });
 */
export async function runBrandStep(request: BrandStepRequest): Promise<BrandStepRun[]> {
  const run = request.run ?? runCommand;
  const runs = plan(request);
  for (const entry of runs) {
    await run(
      request.command ?? BRAND_STEP_SETTINGS.command,
      [
        "--root",
        ".",
        "--out-dir",
        entry.outDir,
        "--outputs",
        entry.outputs.join(","),
        ...(request.variant === undefined ? [] : ["--kit-dir", request.variant.kitDir]),
        ...(request.parentKitDir === undefined ? [] : ["--parent-kit-dir", request.parentKitDir]),
        ...(request.check === true ? ["--check"] : []),
      ],
      { cwd: request.repository },
    );
  }
  if (request.check !== true) {
    const issues = await committedBrandOutputs(request.repository, runs, run);
    if (issues.length > 0) throw new RunwayInvalidError(BRAND_STEP_SETTINGS.outDir, issues);
  }
  return runs;
}
