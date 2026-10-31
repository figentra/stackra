/**
 * Stackra file contract:
 * Purpose: `deployPlan(env, runways)`, what a deploy of `env` does, from the runways (`runway plan`).
 * Boundary: pure; names only, never a value (a member var's value is never copied).
 * Runtime: node
 * Governing contract: ADR 0170; STA-268 (the secret sync is STA-606).
 */
import type { DeployPlan } from "#node/types/deploy-plan.type";
import type { DeployRunways } from "#node/types/deploy-runways.type";

/**
 * The deploy plan of `env`.
 *
 * @throws Error when the root runway has no environment `env`.
 * @example
 * deployPlan("production", readRunways(root)).steps.map((s) => s.target); // ["npm", "cloudflare-workers"]
 */
export function deployPlan(env: string, { root, members }: DeployRunways): DeployPlan {
  const environment = root.environments?.[env];
  if (!environment) throw new Error(`runway.yaml has no environment "${env}"`);
  const destinations = new Set(Object.values(environment.destinations ?? {}));
  const infisical = root.providers?.infisical ?? {};
  const defaultPath = root.secrets?.defaultPath;
  return {
    environment: env,
    infisicalEnvironment: infisical.environments?.[env] ?? null,
    steps: (root.release?.buildOrder ?? [])
      .filter((target) => root.targets?.[target])
      .map((target) => ({
        target,
        destination: destinations.has(target),
        workflows: root.targets?.[target]?.workflows ?? {},
      })),
    ci: root.secrets?.ci ?? [],
    sync: members.flatMap(({ member, runway }) => {
      const own = runway.environments?.[env] ?? {};
      return [
        ...[...new Set([...(runway.secrets ?? []), ...(own.secrets ?? [])])].map((name) => ({
          member,
          kind: "secret" as const,
          name,
          path: (defaultPath === undefined ? undefined : infisical.paths?.[defaultPath]) ?? null,
        })),
        ...Object.keys(own.vars ?? {}).map((name) => ({ member, kind: "var" as const, name })),
      ];
    }),
  };
}
