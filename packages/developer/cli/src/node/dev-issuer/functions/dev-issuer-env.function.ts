/**
 * Stackra file contract:
 * Purpose: `devIssuerEnv(memberRoot, layout, env)`, the variables a service's `stackra dev` run adds for the dev
 *          sign-in (STA-2795): the dev issuer's public key set in `STACKRA_DEV_ISSUER_KEYS` and
 *          `STACKRA_ENVIRONMENT=dev`, the one running environment `@stackra/app`'s `devIssuerKeys` accepts it in. The
 *          key pair comes from `ensureDevIssuer`, made on the first run.
 * Boundary: a service only (an app or a package runs no auth handler). The developer's environment is read through the
 *           one reader (`readEnvironment` of @stackra/config, STA-2844): when it answers anything but `dev` (a local
 *           run against staging settings, a test run) or refuses the variable (a typo), nothing is added, so the
 *           service never gets dev keys there and reports a typo itself at boot. Only the public key travels; the
 *           private key stays in the workspace file.
 * Runtime: node
 * Governing contract: ADR 0206 (amendment of 2026-11-26: the dev issuer); ADR 0296 (amendment 2026-11-26: the
 *                     environment comes from the runtime only); ADR 0170 (decision 5: `dev` is a developer machine);
 *                     STA-2795; STA-2844.
 */
import { DEV_ISSUER } from "@stackra/app";
import { ConfigInvalidError, ENVIRONMENT_VARIABLE, readEnvironment } from "@stackra/config";

import { ensureDevIssuer } from "#node/dev-issuer/functions/ensure-dev-issuer.function";
import { workspaceRoot } from "#node/functions/workspace-root.function";
import type { Member } from "#node/types/member.type";

/** Whether the one reader answers `dev` for `env`; a refused variable is not `dev`. */
function readsAsDev(env: Readonly<Record<string, string | undefined>>): boolean {
  try {
    return readEnvironment(env) === DEV_ISSUER.environment;
  } catch (error) {
    if (error instanceof ConfigInvalidError) return false;
    throw error;
  }
}

/**
 * The dev sign-in variables of the member at `memberRoot`.
 *
 * @param memberRoot - the absolute member folder the tool runs in.
 * @param layout - the member's layout; only a service gets the variables.
 * @param env - the developer's environment.
 * @example
 * runProcess({ ...tool, env: { ...tool.env, ...(await devIssuerEnv(cwd, member.layout, process.env)) } }, io);
 */
export async function devIssuerEnv(
  memberRoot: string,
  layout: Member["layout"],
  env: Readonly<Record<string, string | undefined>>,
): Promise<Readonly<Record<string, string>>> {
  if (layout !== "service" || !readsAsDev(env)) return {};
  const { key } = await ensureDevIssuer(workspaceRoot(memberRoot));
  return {
    [DEV_ISSUER.keysVariable]: JSON.stringify({ keys: [key.publicKey] }),
    [ENVIRONMENT_VARIABLE]: DEV_ISSUER.environment,
  };
}
