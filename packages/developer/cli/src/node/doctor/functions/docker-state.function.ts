/**
 * Stackra file contract:
 * Purpose: `dockerState(status, stdout)`, whether a Docker engine answers: `running` when
 *          `docker info --format json` exited 0 with a server version, `stopped` when the CLI ran but no engine
 *          answered, `missing` when there is no CLI (`status` null). Encore's local infrastructure and Testcontainers
 *          need a running engine.
 * Boundary: pure; the output is parsed, never printed.
 * Runtime: node
 * Governing contract: STA-1952 spec User Story 0.
 */

/**
 * The state of the Docker engine.
 *
 * @param status - the exit status of `docker info --format json`, or null when `docker` could not start.
 * @param stdout - its standard output.
 * @example
 * dockerState(0, '{"ServerVersion":"27.3.1"}'); // "running"
 */
export function dockerState(
  status: number | null,
  stdout: string,
): "running" | "stopped" | "missing" {
  if (status === null) return "missing";
  try {
    const info = JSON.parse(stdout) as { readonly ServerVersion?: unknown };
    return status === 0 && typeof info.ServerVersion === "string" && info.ServerVersion !== ""
      ? "running"
      : "stopped";
  } catch {
    return "stopped";
  }
}
