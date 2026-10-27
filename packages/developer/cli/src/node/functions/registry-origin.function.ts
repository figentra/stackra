/**
 * Stackra file contract:
 * Purpose: `registryOrigin(root, flag)`, the registry setting: `--registry`, else `STACKRA_REGISTRY`, else the
 *          `@stackra:registry` line of the workspace `.npmrc` (the one place stackra-185 sets it), else
 *          `REGISTRY_ORIGIN_DEFAULT`.
 * Boundary: reads `<root>/.npmrc` and the environment only; refuses a value that is not a URL.
 * Runtime: node
 * Governing contract: ADR 0453 (decisions 1 and 10: the consumer `.npmrc` maps the scopes to the host).
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { REGISTRY_ORIGIN_DEFAULT } from "#node/constants/registry-origin-default.constant";
import { CliUsageError } from "#node/errors/cli-usage.error";

/**
 * The registry origin for the workspace at `root`.
 *
 * @param root - the workspace root.
 * @param flag - the `--registry` value, if given.
 * @example
 * registryOrigin("/repo", undefined); // "https://npm.stackra.figentra.com/"
 */
export function registryOrigin(root: string, flag: string | undefined): string {
  const npmrc = join(root, ".npmrc");
  const fromNpmrc = existsSync(npmrc)
    ? /^\s*@stackra:registry\s*=\s*(\S+)\s*$/m.exec(readFileSync(npmrc, "utf8"))?.[1]
    : undefined;
  const origin = flag || process.env["STACKRA_REGISTRY"] || fromNpmrc || REGISTRY_ORIGIN_DEFAULT;
  if (!URL.canParse(origin)) throw new CliUsageError(`the registry is not a URL: ${origin}`);
  return origin.endsWith("/") ? origin : `${origin}/`;
}
