/**
 * Stackra file contract:
 * Purpose: `deployPlan(env, runways)`, what a deploy of `env` does, from the runways (`runway plan`); a member's sync
 *          names are its runway secrets and the `secret` and `config` names its manifest declares (STA-2104), a name
 *          only code declares, as `required: false` everywhere, marked `optional` (STA-258). A
 *          `public` name is a build variable (EAS environment, Vite define, Worker var), never a server secret, so it
 *          is not in the secret sync; pushing it as a build variable is STA-2009's. The secret values of `env` live
 *          in one figentra/secrets scope, `products/<project>/<dev|staging|production>` (ADR 0525), and a preview
 *          reads dev's.
 * Boundary: pure; names only, never a value (a member var's value is never copied).
 * Runtime: node
 * Governing contract: ADR 0170; ADR 0525 (sops scopes); STA-268 (the secret sync is STA-606).
 */
import type { DeployPlan } from "#node/types/deploy-plan.type";
import type { DeployRunways } from "#node/types/deploy-runways.type";

/** The sops environment of a runway environment: figentra/secrets keeps dev, staging and production per product. */
const sopsEnvironment = (env: string): string =>
  env === "production" || env === "staging" ? env : "dev";

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
  return {
    environment: env,
    secretScope:
      root.project === undefined || root.project === ""
        ? null
        : `products/${root.project}/${sopsEnvironment(env)}`,
    steps: (root.release?.buildOrder ?? [])
      .filter((target) => root.targets?.[target])
      .map((target) => ({
        target,
        destination: destinations.has(target),
        workflows: root.targets?.[target]?.workflows ?? {},
      })),
    ci: root.secrets?.ci ?? [],
    sync: members.flatMap(({ member, runway, env: declared = [] }) => {
      const own = runway.environments?.[env] ?? {};
      // The names code declares (gen's manifest rows, ADR 0173 amendment 2026-11-04) sync beside the runway's own;
      // a public name is a build variable, never a server secret (decision 3).
      const rows = declared
        .filter((row) => row.kind !== "public")
        .filter((row) => row.environments === undefined || row.environments.includes(env));
      const listed = [...(runway.secrets ?? []), ...(own.secrets ?? [])];
      // A runway list asks for a value; a code row asks unless it says `required: false` (STA-258).
      const required = new Set([
        ...listed,
        ...rows.filter((row) => row.required !== false).map((row) => row.name),
      ]);
      return [
        ...[...new Set([...listed, ...rows.map((row) => row.name)])].map((name) => ({
          member,
          kind: "secret" as const,
          name,
          ...(required.has(name) ? {} : { optional: true as const }),
        })),
        ...Object.keys(own.vars ?? {}).map((name) => ({ member, kind: "var" as const, name })),
      ];
    }),
  };
}
