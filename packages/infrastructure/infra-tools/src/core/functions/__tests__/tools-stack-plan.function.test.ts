/**
 * Stackra file contract:
 * Purpose: unit tests of `toolsStackPlan`: an environment outside `providers.tools.environments` plans nothing;
 *          production plans every region it lists with every catalogue tool, the region's extract in the geocoders'
 *          variables, secrets under the default parameter path and private endpoints; overrides replace image, size
 *          and provider; disabling Chatwoot drops its worker; missing facts fail together, naming their paths.
 * Boundary: test only; the runway goes through `parseRunway`, so the plan reads what the schemas let through.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0444; owner decisions R2-9 and R3-5.
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

const IMAGES = {
  ocr: { image: "ghcr.io/figentra/tools-ocr:1.0.0" },
  photon: { image: "ghcr.io/figentra/tools-photon:0.6.0" },
};

const TOOLS = {
  environments: ["production"],
  tools: IMAGES,
  extracts: { gcc: "gcc", eg: "egypt" },
  network: { gcc: NETWORK, eg: { ...NETWORK, vpcId: "vpc-eg" } },
};

describe("toolsStackPlan", () => {
  it("plans nothing for an environment that runs no stack", () => {
    expect(toolsStackPlan(rootWith(TOOLS), "staging").regions).toEqual([]);
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
    expect(nominatim?.environment.PBF_URL).toBe(OSM_EXTRACTS.egypt?.url);
    expect(nominatim?.environment.REPLICATION_URL).toBe(OSM_EXTRACTS.egypt?.updates);
    expect(nominatim?.endpoint).toEqual({
      tool: "nominatim",
      category: "geocoding",
      provider: "nominatim",
      region: "eg",
      baseUrl: "http://nominatim.eg.tools.acme.internal:8080",
    });

    const documenso = gcc?.tools.find((tool) => tool.key === "documenso");
    expect(documenso?.name).toBe("acme-production-gcc-documenso");
    expect(documenso?.secrets[0]).toEqual({
      name: "NEXTAUTH_SECRET",
      parameter: "/acme/production/tools/documenso/NEXTAUTH_SECRET",
    });

    const worker = gcc?.tools.find((tool) => tool.key === "chatwoot-worker");
    expect(worker?.image).toBe("chatwoot/chatwoot:v4.1.0");
    expect(worker?.endpoint).toBeUndefined();
  });

  it("applies overrides and drops a disabled tool with the tools part of it", () => {
    const plan = toolsStackPlan(
      rootWith({
        ...TOOLS,
        tools: {
          ...IMAGES,
          ocr: {
            image: "ghcr.io/figentra/tools-ocr:surya-1.0.0",
            provider: "surya",
            environment: { OCR_ENGINE: "surya" },
          },
          libretranslate: { memoryMb: 8192, replicas: 2 },
          chatwoot: { enabled: false },
        },
        secretsPath: "/acme/prod/tools",
      }),
      "production",
    );
    const tools = plan.regions[0]?.tools ?? [];
    const ocr = tools.find((tool) => tool.key === "ocr");
    expect(ocr?.endpoint?.provider).toBe("surya");
    expect(ocr?.environment).toEqual({ OCR_ENGINE: "surya", OCR_LANGUAGES: "ar,en" });
    const translate = tools.find((tool) => tool.key === "libretranslate");
    expect([translate?.memoryMb, translate?.replicas]).toEqual([8192, 2]);
    expect(tools.some((tool) => tool.key.startsWith("chatwoot"))).toBe(false);
    expect(tools.find((tool) => tool.key === "nominatim")?.secrets[0]?.parameter).toBe(
      "/acme/prod/tools/nominatim/NOMINATIM_PASSWORD",
    );
  });

  it("fails naming every missing fact", () => {
    const failure = (() => {
      try {
        toolsStackPlan(
          rootWith({
            environments: ["production"],
            extracts: { gcc: "atlantis" },
            network: { gcc: NETWORK },
          }),
          "production",
        );
      } catch (error) {
        return error;
      }
      return undefined;
    })();
    expect(failure).toBeInstanceOf(RunwayInvalidError);
    const paths = (failure as RunwayInvalidError).issues.map((issue) => issue.path);
    expect(paths).toContain("providers.tools.tools.ocr.image");
    expect(paths).toContain("providers.tools.tools.photon.image");
    expect(paths).toContain("providers.tools.extracts.gcc");
    expect(paths).toContain("providers.tools.extracts.eg");
    expect(paths).toContain("providers.tools.network.eg");
  });

  it("refuses an unknown tool key", () => {
    expect(() =>
      toolsStackPlan(rootWith({ ...TOOLS, tools: { ...IMAGES, mapbox: {} } }), "production"),
    ).toThrow(RunwayInvalidError);
  });
});
