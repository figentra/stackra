/**
 * Stackra file contract:
 * Purpose: `ROOT_RUNWAY_SCHEMA`, the repository's root `runway.yaml` at format version 3: the managed `resources` and the
 *          container `workloads` it provisions (ADR 0493), the project, the product (an edition's base), the web
 *          surfaces and mobile apps the product ships into the OS shells (`surfaces`, `mobile`), the providers
 *          and accounts (AWS and GCP among them, and the npm registry packages publish to), the regions (each with its cloud and cloud region), each environment (destinations, shared resources, defaults, topology), the deploy targets,
 *          the edge, the secret defaults with the CI and gateway secret names, the release policy and observability.
 * Boundary: internal; `parseRunway("root", …)` and `runwayJsonSchema("root")` read it, and it accepts what the
 *           canonical `tools/schemas/runway-root.schema.json` accepts. Strict at the top and in `secrets`, so a
 *           misspelt section fails; the targets Runway knows (`TARGETS_SCHEMA`, STA-1975), the edge, release,
 *           observability and `providers.github` (their `*-section-schema.constant.ts`, STA-1976) are closed objects
 *           that mirror their owners' keys without defaults; the other providers stay open, as their owners check them
 *           (`definesFor` reads `targets.electron-release.feed.publicOrigin` itself). Fields typed here but not read
 *           yet say "Not read yet (<reader>)" in the JSON Schema, and repo-checks' `RUNWAY_UNREAD_FIELDS` holds them to
 *           it (STA-2001); `environments.*.deploy.gate` is a deprecated alias of `release.gate`, and
 *           `providers.aws.region`, `providers.aws.accounts` and `environments.<env>.cloud` are deprecated by
 *           `environments.<env>.region` (ADR 0524), which `runway validate` warns about for one release; so are
 *           `providers.infisical` (now untyped, an open provider) and `secrets.defaultPath`, replaced by sops (ADR 0525).
 *           `providers.aws.account` and `providers.gcp.project` are the opt-ins figentra/infra vends a product's one
 *           account and one project from (both default false), and `providers.gcp.apis` the services it enables.
 * Runtime: isomorphic
 * Governing contract: ADR 0296; ADR 0493 (resources, workloads, limits, uses); (decision 2 and its 2026-10-24 note), ADR 0168 (decisions 1 to 3 and 6), ADR 0171
 *                     (`ref:` values), ADR 0173 (secret names only), ADR 0237 (gateway secret names), ADR 0335 (decision 2: product), ADR 0354
 *                     (decisions 4 and 5: the cloud dimension and GCP), ADR 0401 (GCP projects as `{ id, number }`), ADR 0441 (decision 3: `surfaces` and `mobile`),
 *                     ADR 0453 (decision 6: `providers.npm.registry`, the Stackra registry the release workflow publishes to).
 */
import { Enum } from "@stackra/contracts";
import { z } from "zod";

import { EDGE_SECTION_SCHEMA } from "#core/constants/edge-section-schema.constant";
import { GITHUB_SECTION_SCHEMA } from "#core/constants/github-section-schema.constant";
import { MOBILE_APP_SCHEMA } from "#core/constants/mobile-app-schema.constant";
import { OBSERVABILITY_SECTION_SCHEMA } from "#core/constants/observability-section-schema.constant";
import { OPEN_OBJECT_SCHEMA } from "#core/constants/open-object-schema.constant";
import { ROOT_ENVIRONMENT_SCHEMA } from "#core/constants/root-environment-schema.constant";
import { PRODUCT_SCHEMA } from "#core/constants/product-schema.constant";
import { REGION_SCHEMA } from "#core/constants/region-schema.constant";
import { RELEASE_SECTION_SCHEMA } from "#core/constants/release-section-schema.constant";
import { RESOURCE_SCHEMA } from "#core/constants/resource-schema.constant";
import { SECRET_NAMES_SCHEMA } from "#core/constants/secret-names-schema.constant";
import { SURFACES_SCHEMA } from "#core/constants/surfaces-schema.constant";
import { TARGETS_SCHEMA } from "#core/constants/targets-schema.constant";
import { ZONE_SCHEMA } from "#core/constants/zone-schema.constant";
import { WORKLOAD_SCHEMA } from "#core/constants/workload-schema.constant";
import { ResourceKind } from "#core/enums/resource-kind.enum";
import { RunwayEnvironment } from "#core/enums/runway-environment.enum";

/** A runway environment name. */
const ENVIRONMENT = z.enum(
  Enum.values(RunwayEnvironment) as [RunwayEnvironment, ...RunwayEnvironment[]],
);

/** A public value, or `ref:<path>` resolved from the stacks repository at infra time. */
const VALUE = z.union([z.string(), z.number(), z.boolean()]);

/** The DNS record types a root runway may declare beside its Worker hosts. */
const DNS_RECORD_TYPES = ["A", "AAAA", "CNAME", "TXT", "MX", "CAA", "NS", "SRV"] as const;

/** The types Cloudflare can proxy. */
const PROXIABLE = new Set(["A", "AAAA", "CNAME"]);

/** One non-Worker DNS record (verification TXT, MX, CAA); figentra/infra writes it into its zone. */
const DNS_RECORD_SCHEMA = z
  .strictObject({
    name: z
      .string()
      .regex(/^(?:[a-z0-9_*-]+\.)+[a-z]{2,}$/, "Expected a full host name in lower case"),
    type: z.enum(DNS_RECORD_TYPES),
    content: z.string().min(1),
    proxied: z.boolean().optional(),
    priority: z.int().min(0).max(65_535).optional(),
  })
  .superRefine((record, context) => {
    if (record.type === "MX" && record.priority === undefined)
      context.addIssue({
        code: "custom",
        path: ["priority"],
        message: "An MX record needs a priority",
      });
    if (record.proxied === true && !PROXIABLE.has(record.type))
      context.addIssue({
        code: "custom",
        path: ["proxied"],
        message: `A ${record.type} record cannot be proxied`,
      });
  });

/** A resource or workload name. */
const NAME = z.string().regex(/^[a-z][a-z0-9-]*$/, "Expected a lower-case name");

/** The root runway. */
export const ROOT_RUNWAY_SCHEMA = z
  .strictObject({
    $schema: z.string().optional(),
    version: z.literal(3),
    project: z.string().regex(/^[a-z][a-z0-9-]*$/, "Expected a lower-case project name"),
    product: PRODUCT_SCHEMA.optional(),
    surfaces: SURFACES_SCHEMA.optional(),
    mobile: z
      .record(
        z.string().regex(/^[a-z][a-z0-9-]*$/, "Expected a lower-case app key"),
        MOBILE_APP_SCHEMA,
      )
      .optional(),
    providers: z
      .object({
        aws: z
          .looseObject({
            // Opt-in: figentra/infra vends the product's one account only when this is true (ADR 0524).
            account: z.boolean().default(false),
            region: z.string().optional(),
            accounts: z.record(z.string(), VALUE).optional(),
            state: OPEN_OBJECT_SCHEMA.optional(),
            ecr: OPEN_OBJECT_SCHEMA.optional(),
            // Thresholds and the non-production stop stay open; the monthly cap is what figentra/infra budgets on.
            // A number is the product's one account (ADR 0524); the per-role record (infra-aws's nonprod and prod) is
            // the deprecated three-account layout, kept parsing for one release.
            budgets: z
              .looseObject({
                monthlyUsd: z
                  .union([z.number().positive(), z.record(z.string(), VALUE)])
                  .default(300),
              })
              .optional(),
            requiredTags: z.array(z.string()).optional(),
          })
          .optional(),
        gcp: z
          .looseObject({
            // A plain value, or the `{ id, number }` object infra-gcp checks itself (ADR 0401).
            projects: z.record(z.string(), z.union([VALUE, OPEN_OBJECT_SCHEMA])).optional(),
            // Opt-in: figentra/infra vends the product's one GCP project only when this is true (ADR 0524).
            project: z.boolean().default(false),
            apis: z
              .array(
                z
                  .string()
                  .regex(/^[a-z0-9-]+\.googleapis\.com$/, "Expected a *.googleapis.com service"),
              )
              .refine(
                (apis) => new Set(apis).size === apis.length,
                "A service is listed more than once",
              )
              .optional(),
            state: OPEN_OBJECT_SCHEMA.optional(),
          })
          .optional(),
        encore: z.looseObject({ app: z.string().optional() }).optional(),
        cloudflare: z
          .looseObject({
            accountId: VALUE.optional(),
            zones: z.record(z.string(), ZONE_SCHEMA).optional(),
            // Non-Worker DNS only: Worker hosts stay in wrangler and Runway (ADR 0519).
            records: z.array(DNS_RECORD_SCHEMA).optional(),
          })
          .optional(),
        github: GITHUB_SECTION_SCHEMA.optional(),
        // ADR 0525: `infisical` is no longer typed; an old block passes as an open provider and `runway validate`
        // warns (`deprecatedFields`).
        // ADR 0453: the one place a repository sets where its packages publish; the release workflow passes it on.
        npm: z
          .looseObject({
            registry: z
              .string()
              .regex(/^https:\/\/.+\/$/, "Expected an https:// registry URL ending in /")
              .optional(),
            scope: z
              .string()
              .regex(/^@[a-z0-9][a-z0-9-]*$/, "Expected an npm scope such as @stackra")
              .optional(),
          })
          .optional(),
      })
      .catchall(OPEN_OBJECT_SCHEMA)
      .optional(),
    regions: z
      .record(
        z.string().regex(/^[a-z][a-z0-9-]*$/, "Expected a lower-case region key"),
        REGION_SCHEMA,
      )
      .optional(),
    environments: z.partialRecord(ENVIRONMENT, ROOT_ENVIRONMENT_SCHEMA),
    resources: z.record(NAME, RESOURCE_SCHEMA).optional(),
    workloads: z.record(NAME, WORKLOAD_SCHEMA).optional(),
    targets: TARGETS_SCHEMA.optional(),
    edge: EDGE_SECTION_SCHEMA.optional(),
    secrets: z
      .strictObject({
        sync: z.enum(["on-deploy"]).optional(),
        // Deprecated and ignored (ADR 0525): it named a `providers.infisical.paths` key.
        defaultPath: z.string().optional(),
        ci: SECRET_NAMES_SCHEMA.optional(),
        gateway: SECRET_NAMES_SCHEMA.optional(),
      })
      .optional(),
    release: RELEASE_SECTION_SCHEMA.optional(),
    observability: OBSERVABILITY_SECTION_SCHEMA.optional(),
  })
  .superRefine((root, context) => {
    // A record lives in the declared zone its name ends with, so figentra/infra knows where to write it.
    const zones = Object.keys(root.providers?.cloudflare?.zones ?? {});
    for (const [index, record] of (root.providers?.cloudflare?.records ?? []).entries())
      if (!zones.some((zone) => record.name === zone || record.name.endsWith(`.${zone}`)))
        context.addIssue({
          code: "custom",
          path: ["providers", "cloudflare", "records", index, "name"],
          message: `${record.name} is under no zone in providers.cloudflare.zones`,
        });
    // One PDF engine per runway: its consumers read it under DocumentsConfig's fixed names, which two would share.
    const engines = Object.entries(root.resources ?? {}).filter(
      ([, resource]) => resource.kind === ResourceKind.Gotenberg,
    );
    for (const [name] of engines.slice(1))
      context.addIssue({
        code: "custom",
        path: ["resources", name, "kind"],
        message: `A runway has one gotenberg resource; ${engines[0]?.[0]} is it`,
      });
    // A workload may use only a declared resource (ADR 0493 decision 1); members are checked where the plan joins them.
    for (const [name, workload] of Object.entries(root.workloads ?? {}))
      for (const [index, used] of (workload.uses ?? []).entries())
        if (root.resources?.[used] === undefined)
          context.addIssue({
            code: "custom",
            path: ["workloads", name, "uses", index],
            message: `No resource named ${used} in resources`,
          });
  });
