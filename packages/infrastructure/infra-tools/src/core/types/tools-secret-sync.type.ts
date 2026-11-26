/**
 * Stackra file contract:
 * Purpose: `ToolsSecretSync`, one vault to SSM Parameter Store sync of the tools stack: the vault environment and
 *          folder it reads, the parameter path it writes (`<secretsPath>/<tool>`), and the secret names expected
 *          there.
 * Boundary: type only; plain data. The deploy runs the matching sync (ADR 0173 decision 1); `awsToolsStack` declares
 *           the role the sync assumes to write the parameters. Names only, never a value.
 * Runtime: isomorphic
 * Governing contract: ADR 0444; ADR 0525 (sops in `figentra/secrets` is the source; runway syncs).
 */

/** One folder synced into one parameter path. */
export type ToolsSecretSync = {
  /** The vault environment slug (the runway environment). */
  readonly environment: string;
  /** The vault folder (`/tools/documenso`). */
  readonly source: string;
  /** The SSM parameter path prefix (`/acme/production/tools/documenso`). */
  readonly destination: string;
  /** The secret names the stack reads from that path. */
  readonly names: readonly string[];
};
