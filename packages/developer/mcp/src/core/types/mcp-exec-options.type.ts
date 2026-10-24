/**
 * Stackra file contract:
 * Purpose: `McpExecOptions`, where `stackra mcp exec` takes secret values from: the Infisical environment and folder
 *          of the project linked by `.infisical.yaml`.
 * Boundary: type only; names a location, never a value.
 * Runtime: isomorphic
 * Governing contract: ADR 0173; ADR 0257 (default environment `dev`, default folder `/agents`).
 */

/** The secret store location `stackra mcp exec` reads. */
export type McpExecOptions = {
  /** The Infisical environment; defaults to `dev`. */
  readonly environment?: string;
  /** The Infisical folder; defaults to `/agents`. */
  readonly path?: string;
};
