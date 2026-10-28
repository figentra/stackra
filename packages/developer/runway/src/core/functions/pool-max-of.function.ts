/**
 * Stackra file contract:
 * Purpose: `poolMaxOf(root, service, member, environment)`, the connections one instance of a service may open in an
 *          environment: its `database.poolBudget` (else the root's `defaults.service.database.poolBudget`) divided by
 *          the most instances its topology group may run, rounded down. The deploy hands it to the service process as
 *          `DATABASE_POOL_MAX`, which the generated boot puts over `DatabaseConfig.pool.max`.
 * Boundary: pure; parsed runways in, a number out. A member outside a grouped topology's groups, an isolated member
 *           and a monolith or split environment count one instance unless a group states more. No budget means
 *           `undefined`: the pool keeps its configured size.
 * Runtime: isomorphic
 * Governing contract: ADR 0473 (decision 2); ADR 0238 (implementation note 2, closed by 0473); ADR 0296 (decision 1).
 */
import type { RunwayEnvironment } from "#core/enums/runway-environment.enum";
import { TopologyMode } from "#core/enums/topology-mode.enum";
import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import type { RootRunway } from "#core/types/root-runway.type";
import type { ServiceRunway } from "#core/types/service-runway.type";

/**
 * The per-instance pool size.
 *
 * @param root - the parsed root runway (topology and defaults).
 * @param service - the parsed service runway of `member`.
 * @param member - the service member key, as the topology lists it.
 * @param environment - the environment being deployed.
 * @throws RunwayInvalidError when the budget is below the instance count, which would leave an instance no connection.
 * @example
 * poolMaxOf(root, commerce, "commerce", "production"); // 50 connections over 4 instances: 12
 */
export function poolMaxOf(
  root: RootRunway,
  service: ServiceRunway,
  member: string,
  environment: RunwayEnvironment,
): number | undefined {
  const own = service.environments[environment]?.database?.poolBudget;
  const budget = own ?? root.environments[environment]?.defaults?.service?.database?.poolBudget;
  if (budget === undefined) return undefined;
  const topology = root.environments[environment]?.topology;
  const groups = Object.entries(topology?.groups ?? {});
  const group =
    topology?.mode === TopologyMode.Grouped && !(topology.isolate ?? []).includes(member)
      ? (groups.find(([, entry]) => entry.members.includes(member)) ??
        groups.find(([name]) => name === topology.default))
      : undefined;
  const instances = group?.[1].instances?.max ?? 1;
  if (budget < instances)
    throw new RunwayInvalidError(own === undefined ? "root runway" : `${member} runway`, [
      {
        path:
          own === undefined
            ? `environments.${environment}.defaults.service.database.poolBudget`
            : `environments.${environment}.database.poolBudget`,
        message: `A budget of ${budget} connections cannot give each of ${instances} instances of ${member} one (ADR 0473)`,
      },
    ]);
  return Math.floor(budget / instances);
}
