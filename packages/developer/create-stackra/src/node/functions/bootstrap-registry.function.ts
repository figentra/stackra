/**
 * Stackra file contract:
 * Purpose: `bootstrapRegistry(flag, env)`, the Stackra registry origin for one `create-stackra` run: `--registry`,
 *          else `STACKRA_REGISTRY`, else `STACKRA_REGISTRY_DEFAULT`; ending in `/`. The same order as
 *          `@stackra/cli`'s `registryOrigin`, minus the workspace `.npmrc` (a new app has none yet).
 * Boundary: pure; refuses a value that is not an http or https URL.
 * Runtime: node
 * Governing contract: ADR 0453 (decisions 1 and 10: one host, the consumer maps the scope to it).
 */
import { STACKRA_REGISTRY_DEFAULT } from "#node/constants/stackra-registry-default.constant";
import { BootstrapUsageError } from "#node/errors/bootstrap-usage.error";
import type { BootstrapEnv } from "#node/types/bootstrap-env.type";

/**
 * The registry origin.
 *
 * @param flag - the `--registry` value, if given.
 * @param env - the environment (`STACKRA_REGISTRY`).
 * @throws BootstrapUsageError when the origin is not an http or https URL.
 * @example
 * bootstrapRegistry(undefined, {}); // "https://npm.stackra.figentra.com/"
 */
export function bootstrapRegistry(flag: string | undefined, env: BootstrapEnv): string {
  const origin = flag || env["STACKRA_REGISTRY"] || STACKRA_REGISTRY_DEFAULT;
  const url = URL.canParse(origin) ? new URL(origin) : undefined;
  if (url?.protocol !== "https:" && url?.protocol !== "http:")
    throw new BootstrapUsageError(`the registry is not an http(s) URL: ${origin}`);
  return origin.endsWith("/") ? origin : `${origin}/`;
}
