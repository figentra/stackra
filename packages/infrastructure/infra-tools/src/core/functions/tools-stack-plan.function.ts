/**
 * Stackra file contract:
 * Purpose: `toolsStackPlan(root, environment)`, one environment's self-hosted tools stacks from the root runway: for
 *          each region the environment lists (when `providers.tools.environments` includes it), every enabled tool of
 *          the catalogue with the runway's overrides, the region's OpenStreetMap extract in the geocoders' variables,
 *          each secret's parameter, and the endpoint OS integrations registers as a managed Connection.
 * Boundary: pure and isomorphic; reads the parsed root runway only. Every missing fact (a region's definition,
 *           network or extract, an unknown extract, a tool image no upstream builds) is collected and thrown at once
 *           as `RunwayInvalidError` naming its runway path. A disabled tool also disables the tools `partOf` it.
 * Runtime: isomorphic
 * Governing contract: owner decision R3-5 (2026-10-26); ADR 0444; ADR 0296; ADR 0354 (decision 4); ADR 0173.
 */
import { RunwayInvalidError } from "@stackra/runway";
import type { RootRunway, RunwayEnvironment, RunwayIssue } from "@stackra/runway";

import { OSM_EXTRACTS } from "#core/constants/osm-extracts.constant";
import { ROOT_SOURCE } from "#core/constants/root-source.constant";
import { TOOLS_CATALOGUE } from "#core/constants/tools-catalogue.constant";
import type { ToolKey } from "#core/types/tool-key.type";
import { TOOLS_RUNWAY_SCHEMA } from "#core/constants/tools-runway-schema.constant";
import type { ToolDefinition } from "#core/types/tool-definition.type";
import type { ToolPlan } from "#core/types/tool-plan.type";
import type { ToolsRegionPlan } from "#core/types/tools-region-plan.type";
import type { ToolsStackPlan } from "#core/types/tools-stack-plan.type";

/**
 * The tools stacks of `environment`.
 *
 * @throws RunwayInvalidError naming every missing or invalid runway path.
 * @example
 * toolsStackPlan(root, "production").regions[0]?.tools.map((tool) => tool.endpoint?.baseUrl);
 */
export function toolsStackPlan(root: RootRunway, environment: RunwayEnvironment): ToolsStackPlan {
  const parsed = TOOLS_RUNWAY_SCHEMA.safeParse(root);
  if (!parsed.success)
    throw new RunwayInvalidError(
      ROOT_SOURCE,
      parsed.error.issues.map((issue) => ({
        path: issue.path.map(String).join("."),
        message: issue.message,
      })),
    );
  const runway = parsed.data;
  const tools = runway.providers.tools;
  const project = runway.project;
  if (tools === undefined || !tools.environments.includes(environment))
    return { project, environment, regions: [] };

  const issues: RunwayIssue[] = [];
  const regionKeys = runway.environments[environment]?.regions ?? [];
  if (regionKeys.length === 0)
    issues.push({
      path: `environments.${environment}.regions`,
      message: "List the regions this environment's tools stack runs in",
    });
  const secretsPath = tools.secretsPath ?? `/${project}/${environment}/tools`;
  const catalogue: Readonly<Record<string, ToolDefinition>> = TOOLS_CATALOGUE;

  const regions = regionKeys.map((regionKey): ToolsRegionPlan => {
    const region = runway.regions[regionKey];
    if (region === undefined)
      issues.push({ path: `regions.${regionKey}`, message: "Define this region" });
    const namespace = `${regionKey}.tools.${project}.internal`;

    const planned = Object.entries(catalogue).flatMap(([key, definition]): ToolPlan[] => {
      const override = tools.tools[key as ToolKey] ?? {};
      const parent = definition.partOf === undefined ? undefined : catalogue[definition.partOf];
      const parentOverride =
        definition.partOf === undefined ? {} : (tools.tools[definition.partOf as ToolKey] ?? {});
      if (override.enabled === false || parentOverride.enabled === false) return [];

      const path = `providers.tools.tools.${key}`;
      const image = override.image ?? definition.image ?? parentOverride.image ?? parent?.image;
      if (image === undefined || image === null) {
        issues.push({
          path: `${path}.image`,
          message: "No upstream image: name the image Figentra builds, or set enabled: false",
        });
        return [];
      }

      const environmentVars: Record<string, string> = {
        ...definition.environment,
        ...override.environment,
      };
      if (definition.extract !== undefined) {
        const extractKey = tools.extracts[regionKey];
        const source =
          extractKey === undefined
            ? undefined
            : (tools.sources[extractKey] ?? OSM_EXTRACTS[extractKey]);
        if (extractKey === undefined)
          issues.push({
            path: `providers.tools.extracts.${regionKey}`,
            message: `Name the OpenStreetMap extract this region's ${key} imports (${Object.keys(OSM_EXTRACTS).join(", ")})`,
          });
        else if (source === undefined)
          issues.push({
            path: `providers.tools.extracts.${regionKey}`,
            message: `Unknown extract "${extractKey}": add it under providers.tools.sources`,
          });
        else {
          environmentVars[definition.extract.url] = source.url;
          if (definition.extract.updates !== undefined && source.updates !== undefined)
            environmentVars[definition.extract.updates] = source.updates;
        }
      }

      const port = definition.port;
      const connection = definition.connection;
      return [
        {
          key,
          name: `${project}-${environment}-${regionKey}-${key}`,
          image,
          ...(port === undefined ? {} : { port }),
          cpu: override.cpu ?? definition.cpu,
          memoryMb: override.memoryMb ?? definition.memoryMb,
          replicas: override.replicas ?? definition.replicas,
          ...(definition.command === undefined ? {} : { command: definition.command }),
          environment: environmentVars,
          secrets: definition.secrets.map((name) => ({
            name,
            parameter: `${secretsPath}/${key}/${name}`,
          })),
          ...(definition.volume === undefined ? {} : { volume: definition.volume }),
          ...(port === undefined || connection === undefined
            ? {}
            : {
                endpoint: {
                  tool: key,
                  category: connection.category,
                  provider: override.provider ?? connection.provider,
                  region: regionKey,
                  baseUrl: `http://${key}.${namespace}:${port}`,
                },
              }),
        },
      ];
    });

    const network = tools.network[regionKey];
    if (network === undefined && planned.length > 0)
      issues.push({
        path: `providers.tools.network.${regionKey}`,
        message:
          "Name the VPC, private subnets and security groups this region's tools stack runs in",
      });

    return {
      key: regionKey,
      cloud: region?.cloud ?? "",
      location: region?.location ?? "",
      ...(region?.account === undefined ? {} : { account: String(region.account) }),
      ...(network === undefined ? {} : { network }),
      namespace,
      logRetentionDays: tools.logRetentionDays,
      tools: planned,
    };
  });

  if (issues.length > 0) throw new RunwayInvalidError(ROOT_SOURCE, issues);
  return { project, environment, regions };
}
