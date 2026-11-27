/**
 * Stackra file contract:
 * Purpose: unit tests of `resolveRegion`: a key of the root `regions` wins over a preset of the same name, the presets
 *          `me`, `eu` and `ksa` resolve to their cloud regions, AWS and Google Cloud region ids resolve to themselves on
 *          their cloud, and a name that is none of these (a bare area, an Azure name, a mangled id) resolves to nothing.
 * Boundary: test only; plain objects, no runway file.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0524 (amendment 2026-11-27, STA-2896).
 */
import { describe, expect, it } from "@stackra/testing";

import { resolveRegion } from "#core/functions/resolve-region.function";

describe("resolveRegion", () => {
  it("resolves a key of `regions` first, even over a preset of the same name", () => {
    const root = {
      regions: {
        us: { cloud: "aws", location: "us-east-2", account: "ref:aws.account" },
        me: { cloud: "aws", location: "me-south-1", jurisdiction: "bh" },
      },
    } as const;
    expect(resolveRegion(root, "us")).toEqual({
      key: "us",
      cloud: "aws",
      location: "us-east-2",
      account: "ref:aws.account",
    });
    expect(resolveRegion(root, "me")).toEqual({
      key: "me",
      cloud: "aws",
      location: "me-south-1",
      jurisdiction: "bh",
    });
  });

  it("resolves the three named presets", () => {
    expect(resolveRegion({}, "me")).toEqual({
      key: "me",
      cloud: "aws",
      location: "me-central-1",
      jurisdiction: "ae",
    });
    expect(resolveRegion({}, "eu")).toEqual({
      key: "eu",
      cloud: "aws",
      location: "eu-central-1",
      jurisdiction: "eu",
    });
    expect(resolveRegion({}, "ksa")).toEqual({
      key: "ksa",
      cloud: "gcp",
      location: "me-central2",
      jurisdiction: "sa",
    });
  });

  it("resolves an AWS region id to itself on aws", () => {
    for (const id of ["us-east-1", "ap-south-1", "ap-southeast-5", "us-gov-west-1", "il-central-1"])
      expect(resolveRegion({}, id)).toEqual({ key: id, cloud: "aws", location: id });
  });

  it("resolves a Google Cloud region id to itself on gcp", () => {
    for (const id of ["us-central1", "europe-west1", "asia-south1", "northamerica-northeast2"])
      expect(resolveRegion({}, id)).toEqual({ key: id, cloud: "gcp", location: id });
  });

  it("resolves nothing for a name that is neither declared, a preset nor a provider id", () => {
    for (const name of ["us", "eastus", "us-east", "us-east-1a", "xx-east-1", "europe-west"])
      expect(resolveRegion({ regions: {} }, name)).toBeUndefined();
  });
});
