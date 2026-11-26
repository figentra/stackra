/**
 * Stackra file contract:
 * Purpose: `McpExecOptions`, where `stackra mcp exec` takes secret values from: a local clone of figentra/secrets,
 *          whose `agents` scope holds one sops file per secret (ADR 0525).
 * Boundary: type only; names a location, never a value.
 * Runtime: isomorphic
 * Governing contract: ADR 0173; ADR 0257; ADR 0525.
 */

/** The secret store location `stackra mcp exec` reads. */
export type McpExecOptions = {
  /** The figentra/secrets clone; `execWithSecrets` defaults it to `$STACKRA_SECRETS_DIR` or `~/.stackra/secrets`. */
  readonly secretsDir?: string;
};
