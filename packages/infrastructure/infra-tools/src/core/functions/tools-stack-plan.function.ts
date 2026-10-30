/**
 * Stackra file contract:
 * Purpose: `toolsStackPlan(root, environment)`, one environment's self-hosted tools stacks from the root runway: for
 *          each region the environment lists (when `providers.tools.environments` includes it), every enabled tool of
 *          the catalogue with the runway's overrides (the image chosen by provider, `{namespace}` filled in), the
 *          region's OpenStreetMap extract in the geocoders' variables, each secret's parameter, where its volume lives
 *          (EFS, or EBS on one EC2 instance), its Valkey variable, its GPU
 *          instance type and its endpoint; per region the Valkey, the tools'
 *          databases on the shared Postgres server and the Infisical role; and the Infisical folders to sync.
 * Boundary: pure and isomorphic; reads the parsed root runway only. Every missing fact (a region's definition,
 *           network or extract, an unknown extract, a tool image no upstream builds, a required tool turned off, a
 *           sync principal without an external id) is collected and thrown at once as `RunwayInvalidError` naming its
 *           runway path. A disabled tool also disables the tools `partOf` it, which read their parent's parameters.
 * Runtime: isomorphic
 * Governing contract: owner decision R3-5 (2026-10-26); ADR 0444; ADR 0296; ADR 0354 (decision 4); ADR 0173; ADR 0238.
 */
import { RunwayInvalidError } from "@stackra/runway";
import type { RootRunway, RunwayEnvironment, RunwayIssue } from "@stackra/runway";

import { OSM_EXTRACTS } from "#core/constants/osm-extracts.constant";
import { ROOT_SOURCE } from "#core/constants/root-source.constant";
import { TOOLS_CATALOGUE } from "#core/constants/tools-catalogue.constant";
import { TOOLS_RUNWAY_SCHEMA } from "#core/constants/tools-runway-schema.constant";
import type { ToolDatabase } from "#core/types/tool-database.type";
import type { ToolDefinition } from "#core/types/tool-definition.type";
import type { ToolKey } from "#core/types/tool-key.type";
import type { ToolPlan } from "#core/types/tool-plan.type";
import type { ToolsRegionPlan } from "#core/types/tools-region-plan.type";
import type { ToolsStackPlan } from "#core/types/tools-stack-plan.type";

/** The libpq variables of the shared server's admin login, read by the database task. */
const DATABASE_ADMIN = ["PGHOST", "PGUSER", "PGPASSWORD"] as const;

/** The instance type of a GPU tool that names none: one NVIDIA L4. */
const DEFAULT_GPU_INSTANCE = "g6.xlarge";

/** The parameter folder of the admin login, under the secret path. */
const DATABASE_ADMIN_FOLDER = "postgres";

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
    return { project, environment, regions: [], secretsSync: [] };

  const issues: RunwayIssue[] = [];
  const regionKeys = runway.environments[environment]?.regions ?? [];
  if (regionKeys.length === 0)
    issues.push({
      path: `environments.${environment}.regions`,
      message: "List the regions this environment's tools stack runs in",
    });
  const secretsPath = tools.secretsPath ?? `/${project}/${environment}/tools`;
  const sync = tools.secretsSync;
  if (sync.principal !== undefined && sync.externalId === undefined)
    issues.push({
      path: "providers.tools.secretsSync.externalId",
      message: "Name the external id Infisical presents when it assumes the sync role",
    });
  const catalogue: Readonly<Record<string, ToolDefinition>> = TOOLS_CATALOGUE;
  const isEnabled = (key: string): boolean =>
    tools.tools[key as ToolKey]?.enabled ?? catalogue[key]?.enabled ?? true;
  // Parameter folder to the secret names the stack reads from it.
  const synced = new Map<string, Set<string>>();
  const parameterOf = (folder: string, name: string): string => {
    synced.set(folder, (synced.get(folder) ?? new Set()).add(name));
    return `${secretsPath}/${folder}/${name}`;
  };

  const regions = regionKeys.map((regionKey): ToolsRegionPlan => {
    const region = runway.regions[regionKey];
    if (region === undefined)
      issues.push({ path: `regions.${regionKey}`, message: "Define this region" });
    const namespace = `${regionKey}.tools.${project}.internal`;
    const databases: ToolDatabase[] = [];

    const planned = Object.entries(catalogue).flatMap(([key, definition]): ToolPlan[] => {
      const override = tools.tools[key as ToolKey] ?? {};
      const parent = definition.partOf === undefined ? undefined : catalogue[definition.partOf];
      const parentOverride =
        definition.partOf === undefined ? {} : (tools.tools[definition.partOf as ToolKey] ?? {});
      if (!isEnabled(key) || (definition.partOf !== undefined && !isEnabled(definition.partOf)))
        return [];

      const path = `providers.tools.tools.${key}`;
      if (definition.requires !== undefined && !isEnabled(definition.requires))
        issues.push({
          path: `${path}.enabled`,
          message: `${key} reads from ${definition.requires}: enable ${definition.requires} or set enabled: false`,
        });
      const provider = override.provider ?? definition.connection?.provider;
      const image =
        override.image ??
        (provider === undefined ? undefined : definition.providerImages?.[provider]) ??
        definition.image ??
        parentOverride.image ??
        parent?.image;
      if (image === undefined || image === null) {
        issues.push({
          path: `${path}.image`,
          message: "No upstream image: name the image Figentra builds, or set enabled: false",
        });
        return [];
      }

      const environmentVars: Record<string, string> = Object.fromEntries(
        Object.entries({ ...definition.environment, ...override.environment }).map(
          ([name, value]) => [name, value.replaceAll("{namespace}", namespace)],
        ),
      );
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

      if (definition.database !== undefined)
        databases.push({
          tool: key,
          name: definition.database.name,
          extensions: definition.database.extensions ?? [],
          passwordParameter: parameterOf(key, "DATABASE_PASSWORD"),
        });

      const folder = definition.partOf ?? key;
      const storage = override.storage ?? definition.storage ?? "efs";
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
            parameter: parameterOf(folder, name),
          })),
          ...(definition.volume === undefined ? {} : { volume: definition.volume }),
          ...(definition.volume === undefined || storage !== "ebs"
            ? {}
            : {
                ebs: {
                  diskGb: override.diskGb ?? definition.diskGb ?? 100,
                  instanceType: override.instanceType ?? definition.instanceType ?? "m6i.large",
                },
              }),
          ...(definition.gpu === true
            ? {
                gpu: {
                  instanceType:
                    override.instanceType ?? definition.instanceType ?? DEFAULT_GPU_INSTANCE,
                },
              }
            : {}),
          ...(definition.cache === undefined ? {} : { cacheVariable: definition.cache }),
          ...(port === undefined || connection === undefined || provider === undefined
            ? {}
            : {
                endpoint: {
                  tool: key,
                  category: connection.category,
                  provider,
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
      ...(planned.some((tool) => tool.cacheVariable !== undefined)
        ? { cache: { nodeType: tools.cacheNodeType } }
        : {}),
      databases,
      databaseAdmin:
        databases.length === 0
          ? []
          : DATABASE_ADMIN.map((name) => ({
              name,
              parameter: parameterOf(DATABASE_ADMIN_FOLDER, name),
            })),
      ...(sync.principal === undefined || sync.externalId === undefined
        ? {}
        : { secretsSync: { principal: sync.principal, externalId: sync.externalId } }),
    };
  });

  if (issues.length > 0) throw new RunwayInvalidError(ROOT_SOURCE, issues);
  return {
    project,
    environment,
    regions,
    secretsSync: [...synced].map(([folder, names]) => ({
      environment,
      source: `${sync.source}/${folder}`,
      destination: `${secretsPath}/${folder}`,
      names: [...names],
    })),
  };
}
