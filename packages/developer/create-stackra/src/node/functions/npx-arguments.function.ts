/**
 * Stackra file contract:
 * Purpose: `npxArguments(origin, cli, forwarded)`, npx's arguments for one run of `stackra create`: `--yes` (the
 *          developer asked for this package), `--@stackra:registry=<origin>` (the scope mapping, for this run only:
 *          nothing is written to an `.npmrc`, and every other package still resolves from the developer's own
 *          registry, because the Stackra registry never proxies npmjs), `@stackra/cli@<cli>`, `create` and the
 *          forwarded arguments.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0453 (decision 4: no upstream proxy; decision 10: the scope mapping); ADR 0199 (amendment of
 *                     2026-11-27).
 */
import { STACKRA_CLI_PACKAGE } from "#node/constants/stackra-cli-package.constant";

/**
 * Builds the npx arguments of one `stackra create` run.
 *
 * @param origin - the Stackra registry origin, ending in `/`.
 * @param cli - the `@stackra/cli` version or dist-tag.
 * @param forwarded - the arguments for `stackra create`.
 * @example
 * npxArguments("https://npm.stackra.figentra.com/", "latest", ["my-app"]);
 * // ["--yes", "--@stackra:registry=https://npm.stackra.figentra.com/", "@stackra/cli@latest", "create", "my-app"]
 */
export function npxArguments(origin: string, cli: string, forwarded: readonly string[]): string[] {
  return [
    "--yes",
    `--@stackra:registry=${origin}`,
    `${STACKRA_CLI_PACKAGE}@${cli}`,
    "create",
    ...forwarded,
  ];
}
