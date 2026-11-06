/**
 * Stackra file contract:
 * Purpose: `exportInfisicalFolder({ projectId, environment, path })`, every name → value pair in one Infisical
 *          folder, through the Infisical CLI's JSON export run by the `CommandRunner`, in memory.
 * Boundary: internal; the caller proves the CI job first (`proveGithubJob`). Values are returned, never logged,
 *           printed, written or put in an argument; a failed export throws naming the project and folder only, with
 *           no `cause` and no stderr, because the CLI's output may hold values.
 * Runtime: node
 * Governing contract: ADR 0173 (nobody reads a value; amendment 2026-11-04); ADR 0512; STA-606; STA-2104.
 */
import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { runProgram } from "#node/functions/run-program.function";
import type { CommandRunner } from "#node/types/command-runner.type";

/** One secret as the JSON export prints it. */
type ExportedSecret = { readonly key?: unknown; readonly value?: unknown };

/** The name → value pairs of a JSON export; empty when it is not that shape. */
function exportedPairs(output: string): Map<string, string> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(output);
  } catch {
    return new Map();
  }
  const pairs = new Map<string, string>();
  const entries: readonly ExportedSecret[] = Array.isArray(parsed)
    ? (parsed as ExportedSecret[])
    : typeof parsed === "object" && parsed !== null
      ? Object.entries(parsed).map(([key, value]) => ({ key, value }))
      : [];
  for (const { key, value } of entries)
    if (typeof key === "string" && typeof value === "string") pairs.set(key, value);
  return pairs;
}

/**
 * The pairs of one Infisical folder.
 *
 * @param input.projectId - the Infisical project id.
 * @param input.environment - the Infisical environment slug (`staging`, `prod`).
 * @param input.path - the folder (`/runtime/api`).
 * @param input.domain - the Infisical instance, when not the CLI's default.
 * @param input.run - the command runner; `runProgram` by default.
 * @throws RunwayUnresolvedError when the export fails; names the folder, never a value.
 * @example
 * const pairs = await exportInfisicalFolder({ projectId, environment: "staging", path: "/runtime/api" });
 */
export async function exportInfisicalFolder(input: {
  readonly projectId: string;
  readonly environment: string;
  readonly path: string;
  readonly domain?: string | undefined;
  readonly run?: CommandRunner | undefined;
}): Promise<Map<string, string>> {
  const { projectId, environment, path, domain } = input;
  let output: string;
  try {
    output = await (input.run ?? runProgram)(
      "infisical",
      [
        "export",
        "--env",
        environment,
        "--path",
        path,
        "--projectId",
        projectId,
        "--format",
        "json",
        "--silent",
        ...(domain === undefined ? [] : ["--domain", domain]),
      ],
      {},
    );
  } catch {
    // No `cause` and no stderr: a failed export's output may hold values.
    throw new RunwayUnresolvedError(
      `infisical export of ${environment}:${path} failed: check the job's Infisical login and that its identity may read ${path}`,
    );
  }
  return exportedPairs(output);
}
