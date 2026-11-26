/**
 * Stackra file contract:
 * Purpose: `McpExecOptions`, what `stackra mcp exec` hands a server: the `agents` secret names it reads from its
 *          environment, and the local clone of figentra/secrets that holds one sops file per secret (ADR 0525).
 * Boundary: type only; names secrets and a location, never a value.
 * Runtime: isomorphic
 * Governing contract: ADR 0173; ADR 0257; ADR 0525; STA-1617 (a secret reaches a server through its environment only).
 */

/** The secrets `stackra mcp exec` decrypts and where it reads them. */
export type McpExecOptions = {
  /** The figentra/secrets clone; `execWithSecrets` defaults it to `$STACKRA_SECRETS_DIR` or `~/.stackra/secrets`. */
  readonly secretsDir?: string;
  /**
   * The SCREAMING_SNAKE names (`--env A,B`) decrypted into the server's environment, never its arguments: the server
   * reads each from there, or expands a `${NAME}` placeholder in a file it reads itself (mcp-remote's `--header-file`).
   */
  readonly secrets?: readonly string[];
};
