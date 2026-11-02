/**
 * Stackra file contract:
 * Purpose: `TARGETS_SCHEMA`, the root runway's `targets` block: the settings of each destination. The nine destinations
 *          Runway knows (`encore-cloud`, `cloudflare-workers`, `aws-ecs`, `compose`, `helm`, `eas`, `electron-release`,
 *          `mintlify`, `npm`) are closed objects with the keys the repositories use, so a misspelt key fails; any other
 *          destination name (`vite-dev`, `expo-dev`, `mint-dev`, a new one) stays open. Every target may name the caller
 *          workflows `pnpm runway deploy|promote` dispatches (`workflows`).
 * Boundary: internal; validation only. Each provider still parses its own settings with its own schema
 *           (`CLOUDFLARE_WORKERS_SETTINGS_SCHEMA` for Workers members), so this schema never adds defaults. A key typed
 *           here is not proof that something reads it: the Runway inventory of 2026-11-02 lists which are read.
 * Runtime: isomorphic
 * Governing contract: ADR 0296; ADR 0289; ADR 0517; the Runway inventory of 2026-11-02 (static/ finding 1); STA-1975.
 */
import { z } from "zod";

import { OPEN_OBJECT_SCHEMA } from "#core/constants/open-object-schema.constant";

/** Caller workflows by member or purpose (`docs: deploy-docs.yml`). */
const WORKFLOWS_SCHEMA = z.record(
  z.string(),
  z.string().regex(/\.ya?ml$/, "Expected a workflow file name"),
);

/** A percentage, 0 to 100. */
const PERCENT_SCHEMA = z.number().min(0).max(100);

/** A staged rollout: from a start percentage to an end one, a step every so many hours. */
const ROLLOUT_SCHEMA = z.strictObject({
  startPercent: PERCENT_SCHEMA,
  endPercent: PERCENT_SCHEMA.optional(),
  stepHours: z.number().positive().optional(),
});

/** One value per desktop platform. */
const PER_PLATFORM_SCHEMA = z.strictObject({
  mac: z.string().min(1).optional(),
  windows: z.string().min(1).optional(),
  linux: z.string().min(1).optional(),
});

/** The root runway's `targets`. */
export const TARGETS_SCHEMA = z
  .object({
    "encore-cloud": z
      .strictObject({
        cloud: z.enum(["aws", "gcp"]).optional(),
        workflows: WORKFLOWS_SCHEMA.optional(),
      })
      .optional(),
    // Members are checked by the provider (`CLOUDFLARE_WORKERS_SETTINGS_SCHEMA`); their shape stays the provider's.
    "cloudflare-workers": z
      .strictObject({
        compatibilityDate: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
        observability: z.strictObject({ headSamplingRate: z.number().min(0).max(1) }).optional(),
        members: z.record(z.string(), OPEN_OBJECT_SCHEMA).optional(),
        workflows: WORKFLOWS_SCHEMA.optional(),
      })
      .optional(),
    "aws-ecs": z
      .strictObject({
        compute: z.enum(["fargate", "ec2"]).optional(),
        cloudfront: z.strictObject({ enabled: z.boolean() }).optional(),
        images: z.strictObject({ arch: z.array(z.enum(["amd64", "arm64"])).min(1) }).optional(),
        workflows: WORKFLOWS_SCHEMA.optional(),
      })
      .optional(),
    compose: z
      .strictObject({
        bundled: z.array(z.string().min(1)).optional(),
        registry: z.string().min(1).optional(),
        workflows: WORKFLOWS_SCHEMA.optional(),
      })
      .optional(),
    helm: z
      .strictObject({
        namespace: z.string().min(1).optional(),
        ingressClass: z.string().min(1).optional(),
        storageClass: z.string().min(1).optional(),
        zarf: z.boolean().optional(),
        workflows: WORKFLOWS_SCHEMA.optional(),
      })
      .optional(),
    eas: z
      .strictObject({
        buildTrigger: z.string().min(1).optional(),
        monthlyBuildCap: z.int().min(0).optional(),
        credentials: z.string().min(1).optional(),
        submit: z
          .strictObject({
            ios: z.string().min(1).optional(),
            android: z.string().min(1).optional(),
          })
          .optional(),
        ota: z
          .strictObject({
            rollout: ROLLOUT_SCHEMA.optional(),
            gate: z.strictObject({ crashFreeSessions: PERCENT_SCHEMA }).optional(),
            rollback: z.string().min(1).optional(),
          })
          .optional(),
        storeRollout: z.strictObject({ startPercent: PERCENT_SCHEMA }).optional(),
        minimumVersion: z
          .strictObject({ gate: z.boolean(), supportedStoreVersions: z.int().min(1).optional() })
          .optional(),
        workflows: WORKFLOWS_SCHEMA.optional(),
      })
      .optional(),
    "electron-release": z
      .strictObject({
        feed: z.strictObject({ bucket: z.string().min(1), publicOrigin: z.url() }).optional(),
        rollout: ROLLOUT_SCHEMA.optional(),
        signing: PER_PLATFORM_SCHEMA.optional(),
        runners: PER_PLATFORM_SCHEMA.optional(),
        workflows: WORKFLOWS_SCHEMA.optional(),
      })
      .optional(),
    mintlify: z
      .strictObject({
        deployOn: z.enum(["pull-request", "merge-to-main", "promote"]).optional(),
        checks: z.array(z.string().min(1)).optional(),
        branch: z.string().min(1).optional(),
        pushDeploy: z.boolean().optional(),
        adminKey: z
          .string()
          .regex(/^[A-Z][A-Z0-9_]*$/, "Expected the admin key's secret NAME")
          .optional(),
        smoke: z.strictObject({ pages: z.string().min(1) }).optional(),
        workflows: WORKFLOWS_SCHEMA.optional(),
      })
      .optional(),
    npm: z
      .strictObject({
        access: z.enum(["public", "restricted"]).optional(),
        provenance: z.boolean().optional(),
        // The workflow file the registry trusts to publish (`release.yml`).
        trustedPublisher: z
          .string()
          .regex(/\.ya?ml$/, "Expected a workflow file name")
          .optional(),
        workflows: WORKFLOWS_SCHEMA.optional(),
      })
      .optional(),
  })
  .catchall(OPEN_OBJECT_SCHEMA);
