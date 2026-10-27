/**
 * Stackra file contract:
 * Purpose: unit tests of `toolsStackPlan`: an environment outside `providers.tools.environments` plans nothing;
 *          production plans every region it lists with every catalogue tool on its pinned image, the region's extract
 *          in Nominatim's variables, Photon pointed at the region's Nominatim, Nominatim on EBS, secrets under the
 *          default parameter path (the worker reads Chatwoot's), the Valkey, the databases with the admin login and
 *          the Infisical folders to sync; overrides replace image (by provider), size, storage and provider; disabling
 *          Chatwoot drops its worker, its Valkey and its database; missing facts fail together, naming their paths.
 * Boundary: test only; the runway goes through `parseRunway`, so the plan reads what the schemas let through.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0444; owner decisions R2-5, R2-9 and R3-5; ADR 0173; ADR 0238.
 */
import { parseRunway, RunwayInvalidError } from "@stackra/runway";
import { describe, expect, it } from "@stackra/testing";

import { OSM_EXTRACTS } from "#core/constants/osm-extracts.constant";
import { toolsStackPlan } from "#core/functions/tools-stack-plan.function";

const NETWORK = {
  vpcId: "ref:network.gcc.vpc",
  subnetIds: ["subnet-a"],
  securityGroupIds: ["sg-tools"],
};

/** A root runway with the tools block `tools`. */
function rootWith(tools: Record<string, unknown>) {
  return parseRunway("root", {
    version: 3,
    project: "acme",
    regions: {
      gcc: { cloud: "aws", location: "me-central-1", account: "ref:aws.accounts.prod" },
      eg: { cloud: "aws", location: "eu-central-1" },
    },
    providers: { tools },
    environments: { staging: { regions: ["gcc"] }, production: { regions: ["gcc", "eg"] } },
  });
}

const TOOLS = {
  environments: ["production"],
  extracts: { gcc: "gcc", eg: "egypt" },
  network: { gcc: NETWORK, eg: { ...NETWORK, vpcId: "vpc-eg" } },
};

/** The error `run` throws. */
function failureOf(run: () => unknown): RunwayInvalidError {
  try {
    run();
  } catch (error) {
    if (error instanceof RunwayInvalidError) return error;
    throw error;
  }
  throw new Error("Expected a RunwayInvalidError");
}

describe("toolsStackPlan", () => {
  it("plans nothing for an environment that runs no stack", () => {
    expect(toolsStackPlan(rootWith(TOOLS), "staging")).toMatchObject({
      regions: [],
      secretsSync: [],
    });
  });

  it("plans every tool in every region, with extracts, secrets and endpoints", () => {
    const plan = toolsStackPlan(rootWith(TOOLS), "production");
    expect(plan.regions.map((region) => region.key)).toEqual(["gcc", "eg"]);
    const [gcc, eg] = plan.regions;
    expect(gcc?.account).toBe("ref:aws.accounts.prod");
    expect(gcc?.namespace).toBe("gcc.tools.acme.internal");
    expect(gcc?.tools.map((tool) => tool.key)).toEqual([
      "documenso",
      "ocr",
      "nominatim",
      "photon",
      "libretranslate",
      "chatwoot",
      "chatwoot-worker",
    ]);

    const nominatim = eg?.tools.find((tool) => tool.key === "nominatim");
    expect(nominatim?.image).toBe("mediagis/nominatim:5.3.2");
    expect(nominatim?.environment.PBF_URL).toBe(OSM_EXTRACTS.egypt?.url);
    expect(nominatim?.environment.REPLICATION_URL).toBe(OSM_EXTRACTS.egypt?.updates);
    expect(nominatim?.ebs).toEqual({ diskGb: 200, instanceType: "m6i.xlarge" });
    expect(nominatim?.endpoint).toEqual({
      tool: "nominatim",
      category: "geocoding",
      provider: "nominatim",
      region: "eg",
      baseUrl: "http://nominatim.eg.tools.acme.internal:8080",
    });

    const photon = eg?.tools.find((tool) => tool.key === "photon");
    expect(photon?.image).toBe("ghcr.io/figentra/tools-photon:1.3.0");
    expect(photon?.environment.NOMINATIM_HOST).toBe("nominatim.eg.tools.acme.internal");
    expect(photon?.ebs).toBeUndefined();

    const ocr = gcc?.tools.find((tool) => tool.key === "ocr");
    expect(ocr?.image).toBe("ghcr.io/figentra/tools-ocr:1.0.0-paddleocr");
    expect(ocr?.endpoint?.provider).toBe("paddleocr");

    const documenso = gcc?.tools.find((tool) => tool.key === "documenso");
    expect(documenso?.name).toBe("acme-production-gcc-documenso");
    expect(documenso?.secrets[0]).toEqual({
      name: "NEXTAUTH_SECRET",
      parameter: "/acme/production/tools/documenso/NEXTAUTH_SECRET",
    });

    const worker = gcc?.tools.find((tool) => tool.key === "chatwoot-worker");
    expect(worker?.image).toBe("chatwoot/chatwoot:v4.18.0");
    expect(worker?.endpoint).toBeUndefined();
    expect(worker?.cacheVariable).toBe("REDIS_URL");
    expect(worker?.secrets.map((secret) => secret.parameter)).toContain(
      "/acme/production/tools/chatwoot/DATABASE_URL",
    );

    expect(gcc?.cache).toEqual({ nodeType: "cache.t4g.micro" });
    expect(gcc?.databases).toEqual([
      {
        tool: "documenso",
        name: "documenso",
        extensions: [],
        passwordParameter: "/acme/production/tools/documenso/DATABASE_PASSWORD",
      },
      {
        tool: "chatwoot",
        name: "chatwoot",
        extensions: ["pg_trgm", "pgcrypto", "pg_stat_statements", "vector"],
        passwordParameter: "/acme/production/tools/chatwoot/DATABASE_PASSWORD",
      },
    ]);
    expect(gcc?.databaseAdmin.map((secret) => secret.parameter)).toEqual([
      "/acme/production/tools/postgres/PGHOST",
      "/acme/production/tools/postgres/PGUSER",
      "/acme/production/tools/postgres/PGPASSWORD",
    ]);
    expect(gcc?.secretsSync).toBeUndefined();

    expect(plan.secretsSync.map((entry) => entry.destination)).toEqual([
      "/acme/production/tools/documenso",
      "/acme/production/tools/nominatim",
      "/acme/production/tools/photon",
      "/acme/production/tools/chatwoot",
      "/acme/production/tools/postgres",
    ]);
    expect(plan.secretsSync.find((entry) => entry.source === "/tools/chatwoot")).toEqual({
      environment: "production",
      source: "/tools/chatwoot",
      destination: "/acme/production/tools/chatwoot",
      names: ["DATABASE_PASSWORD", "SECRET_KEY_BASE", "DATABASE_URL"],
    });
  });

  it("applies overrides and drops a disabled tool with the tools part of it", () => {
    const plan = toolsStackPlan(
      rootWith({
        ...TOOLS,
        tools: {
          ocr: { provider: "surya" },
          nominatim: { storage: "efs" },
          libretranslate: { memoryMb: 8192, replicas: 2 },
          chatwoot: { enabled: false },
        },
        secretsPath: "/acme/prod/tools",
        secretsSync: {
          source: "/runtime/tools",
          principal: "arn:aws:iam::999988887777:root",
          externalId: "ref:infisical.externalId",
        },
      }),
      "production",
    );
    const region = plan.regions[0];
    const tools = region?.tools ?? [];
    const ocr = tools.find((tool) => tool.key === "ocr");
    expect(ocr?.image).toBe("ghcr.io/figentra/tools-ocr:1.0.0-surya");
    expect(ocr?.endpoint?.provider).toBe("surya");
    const translate = tools.find((tool) => tool.key === "libretranslate");
    expect([translate?.memoryMb, translate?.replicas]).toEqual([8192, 2]);
    expect(tools.find((tool) => tool.key === "nominatim")?.ebs).toBeUndefined();
    expect(tools.some((tool) => tool.key.startsWith("chatwoot"))).toBe(false);
    expect(region?.cache).toBeUndefined();
    expect(region?.databases.map((database) => database.name)).toEqual(["documenso"]);
    expect(region?.secretsSync).toEqual({
      principal: "arn:aws:iam::999988887777:root",
      externalId: "ref:infisical.externalId",
    });
    expect(tools.find((tool) => tool.key === "nominatim")?.secrets[0]?.parameter).toBe(
      "/acme/prod/tools/nominatim/NOMINATIM_PASSWORD",
    );
    expect(plan.secretsSync[0]?.source).toBe("/runtime/tools/documenso");
  });

  it("fails naming every missing fact", () => {
    const failure = failureOf(() =>
      toolsStackPlan(
        rootWith({
          environments: ["production"],
          tools: { nominatim: { enabled: false } },
          extracts: { gcc: "atlantis" },
          network: { gcc: NETWORK },
          secretsSync: { principal: "arn:aws:iam::999988887777:root" },
        }),
        "production",
      ),
    );
    const paths = failure.issues.map((issue) => issue.path);
    expect(paths).toContain("providers.tools.tools.photon.enabled");
    expect(paths).toContain("providers.tools.secretsSync.externalId");
    expect(paths).toContain("providers.tools.network.eg");
  });

  it("names an unknown or missing extract", () => {
    const failure = failureOf(() =>
      toolsStackPlan(rootWith({ ...TOOLS, extracts: { gcc: "atlantis" } }), "production"),
    );
    const paths = failure.issues.map((issue) => issue.path);
    expect(paths).toContain("providers.tools.extracts.gcc");
    expect(paths).toContain("providers.tools.extracts.eg");
  });

  it("refuses an unknown tool key", () => {
    expect(() =>
      toolsStackPlan(rootWith({ ...TOOLS, tools: { mapbox: {} } }), "production"),
    ).toThrow(RunwayInvalidError);
  });
});
