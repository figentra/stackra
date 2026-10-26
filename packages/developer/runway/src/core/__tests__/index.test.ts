/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: every value the template imports from `@stackra/runway`
 *          (`baseUrlOf`, `devPorts`, `updateFeed`) and the registry row's schemas check, JSON Schema derivation,
 *          placement, region, surface and dev port checks, deploy and app-shell Runway steps with their ports, enums
 *          and errors are exported, nothing else is (the zod schemas and the facts reader stay internal), and the
 *          public types resolve.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import type { Url } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as runway from "#core/index";
import type {
  AppRunway,
  DevPortIssue,
  DevPorts,
  PlacementIssue,
  RegionIssue,
  RootRunway,
  RunwayDocument,
  RunwayFacts,
  RunwayIssue,
  RunwayRegion,
  ServiceRunway,
  SurfaceIssue,
} from "#core/index";

describe("@stackra/runway", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(runway).sort()).toEqual([
      "AppPublisher",
      "BrandGenerator",
      "CacheEviction",
      "CanonicalHost",
      "DeployKind",
      "EdgeStore",
      "ExtensionBundlePublisher",
      "MobileBuildTrigger",
      "MobileBuilder",
      "RequirementEngine",
      "RunwayCloud",
      "RunwayDeployFailedError",
      "RunwayEnvironment",
      "RunwayInvalidError",
      "RunwayKind",
      "RunwayLockedError",
      "RunwayNotConfiguredError",
      "RunwayProvider",
      "RunwayRefusedError",
      "RunwayUnresolvedError",
      "SurfaceKind",
      "TopologyMode",
      "baseUrlOf",
      "brandGenerateRequest",
      "brandsOf",
      "buildMobileApps",
      "checkDevPorts",
      "checkPlacement",
      "checkRegions",
      "checkSurfaces",
      "deploy",
      "deployTargets",
      "devPorts",
      "edgeRowsOf",
      "generateBrandSet",
      "mobileBuildRequests",
      "parseRunway",
      "productOf",
      "promote",
      "publishExtensionBundles",
      "regionsOf",
      "registerPlatformHosts",
      "rollback",
      "runwayJsonSchema",
      "updateFeed",
      "withDeployLock",
    ]);
  });

  it("types the template's reader calls", () => {
    expectTypeOf(runway.baseUrlOf).parameters.toEqualTypeOf<[member: string]>();
    expectTypeOf(runway.baseUrlOf).returns.toEqualTypeOf<Url>();
    expectTypeOf(runway.devPorts).returns.toEqualTypeOf<DevPorts>();
    expectTypeOf(runway.updateFeed).returns.toEqualTypeOf<Url | null>();
  });

  it("resolves the public types", () => {
    expectTypeOf<RunwayDocument["root"]>().toEqualTypeOf<RootRunway>();
    expectTypeOf<RunwayDocument["app"]>().toEqualTypeOf<AppRunway>();
    expectTypeOf<RunwayDocument["service"]>().toEqualTypeOf<ServiceRunway>();
    expectTypeOf<RunwayFacts["lane"]>().toEqualTypeOf<number>();
    expectTypeOf<RunwayIssue["path"]>().toEqualTypeOf<string>();
    expectTypeOf<PlacementIssue["subject"]>().toEqualTypeOf<string>();
    expectTypeOf<RegionIssue["code"]>().toEqualTypeOf<"unknown_region" | "cloud_unconfigured">();
    expectTypeOf(runway.regionsOf).returns.toEqualTypeOf<RunwayRegion[]>();
    expectTypeOf<RunwayRegion["cloud"]>().toEqualTypeOf<"aws" | "gcp">();
    expectTypeOf<DevPortIssue["code"]>().toEqualTypeOf<
      "dev_port_duplicate" | "dev_port_out_of_range"
    >();
    expectTypeOf<SurfaceIssue["path"]>().toEqualTypeOf<string>();
  });
});
