/**
 * Stackra file contract:
 * Purpose: `TESTBED_PLAN_SCHEMA`, the zod schema of the testbed plan. It holds the rules ADR 0484 states: a heavy group is on-demand
 *          and a light group is spot (a heavy job never lands on spot), a group's minimum never exceeds its maximum,
 *          the data volume is mounted at `/data`, both disks are deleted with the instance, and the drain threshold
 *          sits above the cleanup threshold.
 * Boundary: schemas only; pure and Pulumi-free. A secret grant holds ids, environments and paths, never a value.
 * Runtime: isomorphic
 * Governing contract: ADR 0484 (decisions 3, 4, 8, 9); ADR 0173 (names and paths only).
 */
import { z } from "zod";

const COUNT = z.number().int().min(0).max(50);

const GROUP = z
  .object({
    name: z.string().min(1),
    purchase: z.enum(["on-demand", "spot"]),
    instanceTypes: z.array(z.string().regex(/^[a-z0-9]+\.[a-z0-9]+$/)).min(1),
    min: COUNT,
    max: COUNT.min(1),
    slots: z.array(z.enum(["heavy", "light"])).min(1),
  })
  .strict()
  .refine((group) => group.min <= group.max, "min must not exceed max");

const DISK = z.object({
  sizeGb: z.number().int().positive(),
  type: z.literal("gp3"),
  deviceName: z.string().startsWith("/dev/"),
});

const GRANT = z
  .object({
    projectId: z.string().min(1),
    environment: z.string().min(1),
    path: z.string().startsWith("/"),
  })
  .strict();

/** The plan: plain data the program declares and the tests assert. */
export const TESTBED_PLAN_SCHEMA = z
  .object({
    region: z.string().regex(/^[a-z]{2}-[a-z]+-\d$/),
    groups: z
      .object({
        heavy: GROUP.refine((group) => group.purchase === "on-demand", "heavy is on-demand"),
        light: GROUP.refine((group) => group.purchase === "spot", "light is spot"),
      })
      .strict(),
    disks: z
      .object({
        root: DISK,
        data: DISK.extend({ mount: z.literal("/data"), filesystem: z.literal("xfs") }),
        deleteOnTermination: z.literal(true),
      })
      .strict(),
    guard: z
      .object({
        cleanupPercent: z.number().int().min(1).max(99),
        drainPercent: z.number().int().min(1).max(99),
        rootMinFreeGb: z.number().int().positive(),
        turboCacheGb: z.number().int().positive(),
        seedMaxAgeDays: z.number().int().positive(),
        intervalMinutes: z.number().int().positive(),
      })
      .strict()
      .refine((guard) => guard.cleanupPercent < guard.drainPercent, "drain sits above cleanup"),
    idleMinutes: z.number().int().positive(),
    jobTimeoutHours: z.number().int().positive(),
    image: z
      .object({
        schedule: z.string().startsWith("cron("),
        amiParameter: z.string().startsWith("/"),
        baseImageParameter: z.string().startsWith("/"),
      })
      .strict(),
    toolchain: z.record(z.string(), z.string().min(1)),
    secretGrants: z
      .object({
        /** The Infisical machine identity name; its id is a Pulumi config input, an id and not a secret. */
        identityName: z.string().min(1),
        identityId: z.string().min(1).optional(),
        /** Project name (as `stackra testbed run` names it) to the paths a job of it may read. */
        projects: z.record(z.string(), z.array(GRANT)),
      })
      .strict(),
    tags: z
      .object({
        groupKey: z.string().min(1),
        environment: z.string().min(1),
        service: z.string().min(1),
      })
      .strict(),
  })
  .strict();
