/**
 * Stackra file contract:
 * Purpose: `BootstrapArgs`, the command line of `create-stackra` once its own options are taken out: the registry
 *          flag, the `@stackra/cli` version or tag, whether help was asked, and the arguments for `stackra create`.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0199 (amendment of 2026-11-27).
 */

/** What `parseBootstrapArgs` returns. */
export type BootstrapArgs = {
  /** `--registry <url>`, when given. */
  readonly registry: string | undefined;

  /** `--cli <version|tag>`: the `@stackra/cli` to run; `latest` when not given. */
  readonly cli: string;

  /** `-h` or `--help` before `--`. */
  readonly help: boolean;

  /** Every other argument, in order, for `stackra create`. */
  readonly forwarded: readonly string[];
};
