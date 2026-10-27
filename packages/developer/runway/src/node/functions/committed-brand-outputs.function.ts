/**
 * Stackra file contract:
 * Purpose: `committedBrandOutputs(repository, runs, run?)`, the repository check that fails when generated brand outputs
 *          are committed: it reads the asset manifest each brand-kit run left and asks git which of those files, and
 *          which manifests, are tracked.
 * Boundary: reads the manifests and runs `git ls-files` through the command runner; writes nothing. It answers issues
 *           and throws only when a manifest is missing or unreadable (run the brand step in write mode first).
 * Runtime: node
 * Governing contract: ADR 0441 (as amended: D17, generated files are never committed; enforcement: the kit's asset
 *                     manifest lists them).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import type { RunwayIssue } from "#core/types/runway-issue.type";
import { BRAND_STEP_SETTINGS } from "#node/constants/brand-step-settings.constant";
import { runCommand } from "#node/functions/run-command.function";
import type { BrandStepRun } from "#node/types/brand-step-run.type";
import type { CommandRunner } from "#node/types/command-runner.type";

/** The repository paths `outDir`'s asset manifest lists, with the manifest itself. */
function manifestPaths(repository: string, outDir: string): string[] {
  const manifest = `${outDir}/${BRAND_STEP_SETTINGS.manifestFile}`;
  let files: unknown;
  try {
    files = (JSON.parse(readFileSync(join(repository, manifest), "utf8")) as { files?: unknown })
      .files;
  } catch {
    throw new RunwayUnresolvedError(
      `The committed-outputs check cannot read ${manifest}; run the brand step without --check first`,
    );
  }
  if (!Array.isArray(files)) {
    throw new RunwayUnresolvedError(`${manifest} has no "files" list`);
  }
  return [
    manifest,
    ...files.flatMap((file) => {
      const path = (file as { path?: unknown } | null)?.path;
      return typeof path === "string" ? [`${outDir}/${path}`] : [];
    }),
  ];
}

/**
 * The generated brand files git tracks, one issue each; empty when none is committed.
 *
 * @param repository - the repository root.
 * @param runs - the runs `runBrandStep` made (write mode), whose manifests list the generated files.
 * @param run - the command runner; `runCommand` when absent.
 * @throws RunwayUnresolvedError when a run's asset manifest is missing or has no file list.
 * @example
 * const issues = await committedBrandOutputs(".", runs);
 * if (issues.length > 0) throw new RunwayInvalidError(".stackra/brand", issues);
 */
export async function committedBrandOutputs(
  repository: string,
  runs: readonly BrandStepRun[],
  run: CommandRunner = runCommand,
): Promise<RunwayIssue[]> {
  const paths = runs.flatMap((entry) => manifestPaths(repository, entry.outDir));
  if (paths.length === 0) return [];
  const tracked = await run("git", ["ls-files", "-z", "--", ...paths], { cwd: repository });
  return tracked
    .split("\0")
    .filter((path) => path !== "")
    .sort()
    .map((path) => ({
      path,
      message:
        "A generated brand output is committed; untrack it (git rm --cached) and ignore .stackra/",
    }));
}
