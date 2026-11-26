/**
 * Stackra file contract:
 * Purpose: `devInfraEnv(memberRoot, env)`, the variables a member's `stackra dev` run gets from the dev compose the
 *          workspace's `stackra dev` started (`*_VALKEY_URL`, `AWS_ENDPOINT_URL_S3`, `SMTP_PORT`, …), for its lane and
 *          opt-ins, so a member that picks those drivers reaches the containers with no value written anywhere.
 * Boundary: reads the state file and the root runway; nothing when no dev compose was started or the runway is
 *           refused. A variable already in `env` is left out, so a value the developer set wins; the dev-secrets file
 *           is laid over this by the caller and wins too.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 3); ADR 0525 (amendment of 2026-11-10: dev values by name); STA-2664
 *                     (item 6).
 */
import { planDevInfra } from "#node/dev-infra/functions/plan-dev-infra.function";
import { readDevInfraState } from "#node/dev-infra/functions/read-dev-infra-state.function";
import { workspaceRoot } from "#node/functions/workspace-root.function";

/**
 * The dev compose variables of the member at `memberRoot`.
 *
 * @param memberRoot - the absolute member folder a tool runs in.
 * @param env - the environment the tool inherits; a name set there is not overridden.
 * @example
 * runProcess({ ...tool, env: { ...tool.env, ...devInfraEnv(cwd), ...devSecretEnv(cwd) } }, io);
 */
export function devInfraEnv(
  memberRoot: string,
  env: Readonly<Record<string, string | undefined>> = process.env,
): Readonly<Record<string, string>> {
  const root = workspaceRoot(memberRoot);
  const state = readDevInfraState(root);
  if (state === undefined) return {};
  const plan = planDevInfra(root, state.lane, state.optIn);
  if (plan === undefined || plan.issues.length > 0) return {};
  return Object.fromEntries(Object.entries(plan.env).filter(([name]) => env[name] === undefined));
}
