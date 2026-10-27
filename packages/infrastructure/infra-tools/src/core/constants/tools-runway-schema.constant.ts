/**
 * Stackra file contract:
 * Purpose: `TOOLS_RUNWAY_SCHEMA`, the parts of an already parsed root runway the tools stack reads, checked strictly:
 *          the project, the regions, each environment's region list, and `providers.tools`: the environments that run
 *          the stack, per-tool overrides, the extract each region imports, extra or replaced extracts, each region's
 *          network, the secret parameter path, the log retention, the Valkey node type, and the Infisical sync (the
 *          source folder, and the principal and external id of the role it assumes). A tool override may move its
 *          volume to EBS (`storage`, `diskGb`, `instanceType`).
 * Boundary: internal; `toolsStackPlan` is its only reader. `@stackra/runway` leaves provider blocks open (`providers`
 *           has a catch-all, "a new vendor needs no schema change"), so `providers.tools` reaches here unchecked and is
 *           checked here. An unknown tool key fails.
 * Runtime: isomorphic
 * Governing contract: ADR 0444; ADR 0296 (root runway); ADR 0171 (`ref:` values); ADR 0173 (secret names only).
 */
import { Enum } from "@stackra/contracts";
import { RunwayEnvironment } from "@stackra/runway";
import { z } from "zod";

import { TOOLS_CATALOGUE } from "#core/constants/tools-catalogue.constant";
import type { ToolKey } from "#core/types/tool-key.type";

/** A tool key of the catalogue. */
const TOOL_KEY = z.enum(Object.keys(TOOLS_CATALOGUE) as [ToolKey, ...ToolKey[]]);

/** One tool's overrides. */
const TOOL = z.strictObject({
  enabled: z.boolean().optional(),
  image: z.string().min(1).optional(),
  cpu: z.int().min(256).optional(),
  memoryMb: z.int().min(512).optional(),
  replicas: z.int().min(0).optional(),
  provider: z.string().min(1).optional(),
  environment: z.record(z.string(), z.string()).optional(),
  storage: z.enum(["efs", "ebs"]).optional(),
  diskGb: z.int().min(20).optional(),
  instanceType: z.string().min(1).optional(),
});

/** The `providers.tools` block. */
const TOOLS = z.strictObject({
  environments: z
    .array(z.enum(Enum.values(RunwayEnvironment) as [RunwayEnvironment, ...RunwayEnvironment[]]))
    .default([]),
  tools: z.partialRecord(TOOL_KEY, TOOL).default({}),
  extracts: z.record(z.string(), z.string()).default({}),
  sources: z
    .record(z.string(), z.strictObject({ url: z.url(), updates: z.url().optional() }))
    .default({}),
  network: z
    .record(
      z.string(),
      z.strictObject({
        vpcId: z.string().min(1),
        subnetIds: z.array(z.string().min(1)).min(1),
        securityGroupIds: z.array(z.string().min(1)).min(1),
      }),
    )
    .default({}),
  secretsPath: z
    .string()
    .regex(/^(\/[A-Za-z0-9_.-]+)+$/, "Expected a parameter path such as /acme/production/tools")
    .optional(),
  logRetentionDays: z.int().min(1).default(30),
  cacheNodeType: z.string().min(1).default("cache.t4g.micro"),
  secretsSync: z
    .strictObject({
      source: z
        .string()
        .regex(/^(\/[A-Za-z0-9_.-]+)+$/)
        .default("/tools"),
      principal: z.string().min(1).optional(),
      externalId: z.string().min(1).optional(),
    })
    .default({ source: "/tools" }),
});

/** The root runway, narrowed to what the tools stack reads. */
export const TOOLS_RUNWAY_SCHEMA = z.looseObject({
  project: z.string(),
  providers: z.looseObject({ tools: TOOLS.optional() }).default({}),
  regions: z
    .record(
      z.string(),
      z.looseObject({
        cloud: z.string(),
        location: z.string(),
        account: z.union([z.string(), z.number()]).optional(),
      }),
    )
    .default({}),
  environments: z
    .record(z.string(), z.looseObject({ regions: z.array(z.string()).optional() }))
    .default({}),
});
