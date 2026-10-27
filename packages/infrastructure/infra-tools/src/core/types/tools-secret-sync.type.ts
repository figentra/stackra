/**
 * Stackra file contract:
 * Purpose: `ToolsSecretSync`, one Infisical to SSM Parameter Store sync of the tools stack: the Infisical environment
 *          and folder it reads, the parameter path it writes (`<secretsPath>/<tool>`), and the secret names expected
 *          there.
 * Boundary: type only; plain data. The deploy creates the matching Infisical secret sync (ADR 0173 decision 1);
 *           `awsToolsStack` declares the role Infisical assumes to write the parameters. Names only, never a value.
 * Runtime: isomorphic
 * Governing contract: ADR 0444; ADR 0173 (Infisical is the source; runway syncs).
 */

/** One folder synced into one parameter path. */
export type ToolsSecretSync = {
  /** The Infisical environment slug (the runway environment). */
  readonly environment: string;
  /** The Infisical folder (`/tools/documenso`). */
  readonly source: string;
  /** The SSM parameter path prefix (`/acme/production/tools/documenso`). */
  readonly destination: string;
  /** The secret names the stack reads from that path. */
  readonly names: readonly string[];
};
