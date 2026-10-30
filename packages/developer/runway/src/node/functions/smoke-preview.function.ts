/**
 * Stackra file contract:
 * Purpose: `smokePreview(request)`, the smoke step after a preview deploy: lists every subject of the root runway (each
 *          web surface but `ops` at its canonical host for the environment, from `platformRows`; each mobile app on
 *          each platform it has a build for), checks each with the driver of its target, and throws
 *          `RunwaySmokeFailedError` with every result when any failed or had no driver, so promotion is blocked.
 * Boundary: reads the root runway; every effect is a driver's. `only` keeps the targets one CI job checks (the web
 *           job, a mobile job per platform). Subjects are checked one at a time, web first, so a failure leaves the
 *           evidence of all of them. Desktop subjects arrive with the first desktop target.
 * Runtime: node
 * Governing contract: STA-265 spec (D5, D6, FR-009); ADR 0437 (the hosts of `platformRows`).
 */
import { join } from "node:path";

import { EdgeKvPrefix } from "@stackra/app/contracts";

import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { RunwaySmokeFailedError } from "#core/errors/runway-smoke-failed.error";
import type { SmokeResult } from "#core/types/smoke-result.type";
import type { SmokeSubject } from "#core/types/smoke-subject.type";
import { platformRows } from "#node/functions/platform-rows.function";
import { readRunway } from "#node/functions/read-runway.function";
import type { EdgeHostRow } from "#node/types/edge-host-row.type";
import type { SmokePreviewRequest } from "#node/types/smoke-preview-request.type";

/**
 * Runs the smoke step.
 *
 * @returns every result, all passed.
 * @throws RunwaySmokeFailedError when a subject failed or no driver serves its target.
 * @throws RunwayInvalidError when `builds` is given without `templateDir`, or a host does not resolve.
 * @example
 * await smokePreview({ repository: ".", environment: "preview", drivers: [new PlaywrightSmokeDriver()] });
 */
export async function smokePreview(request: SmokePreviewRequest): Promise<SmokeResult[]> {
  const { repository, environment, drivers, builds = {}, templateDir, only } = request;
  const root = readRunway(join(repository, "runway.yaml"), "root");
  const subjects: SmokeSubject[] = [];
  const urls = new Map<string, string>();
  // Without `mobile`: the app-link files need signing keys the smoke step has no use for.
  for (const [key, value] of Object.entries(
    platformRows({ ...root, mobile: {} }, environment, {}),
  )) {
    if (!key.startsWith(`${EdgeKvPrefix.Host}:`)) continue;
    const row = JSON.parse(value) as EdgeHostRow;
    urls.set(row.surface, `https://${row.canonical}/`);
  }
  for (const [name, url] of urls) subjects.push({ target: "web", name, url });
  if (Object.keys(builds).length > 0 && templateDir === undefined)
    throw new RunwayInvalidError("runway.yaml", [
      { path: "templateDir", message: "Mobile builds need the template checkout with their flows" },
    ]);
  for (const app of Object.keys(root.mobile ?? {})) {
    for (const platform of ["ios", "android"] as const) {
      const appPath = builds[app]?.[platform];
      if (appPath !== undefined && templateDir !== undefined)
        subjects.push({ target: "mobile", name: app, platform, appPath, templateDir });
    }
  }

  const results: SmokeResult[] = [];
  for (const subject of subjects.filter((item) => only?.includes(item.target) ?? true)) {
    const driver = drivers.find((item) => item.target === subject.target);
    results.push(
      driver === undefined
        ? {
            target: subject.target,
            name: subject.name,
            passed: false,
            problems: [`no smoke driver for ${subject.target}`],
          }
        : await driver.check(subject, repository),
    );
  }
  if (results.some((result) => !result.passed)) throw new RunwaySmokeFailedError(results);
  return results;
}
