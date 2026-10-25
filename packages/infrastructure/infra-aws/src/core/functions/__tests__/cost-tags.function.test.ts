/**
 * Stackra file contract:
 * Purpose: unit tests of `costTags`: the project, environment and service tags always present, each required key
 *          the foundation cannot fill reading `shared`, and the known keys never overridden.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0172 (decision 5: every resource carries cost tags).
 */
import { describe, expect, it } from "@stackra/testing";

import { costTags } from "#core/functions/cost-tags.function";

describe("costTags", () => {
  it("stamps the project, the environment and the owning package", () => {
    expect(costTags("acme", "staging", [])).toEqual({
      project: "acme",
      env: "staging",
      service: "infra-aws",
    });
  });

  it("fills a required key it cannot know with shared", () => {
    expect(costTags("acme", "staging", ["team", "env"])).toEqual({
      team: "shared",
      project: "acme",
      env: "staging",
      service: "infra-aws",
    });
  });

  it("keeps a known key's real value when the runway requires it", () => {
    expect(costTags("acme", "production", ["project", "service"])).toMatchObject({
      project: "acme",
      service: "infra-aws",
    });
  });
});
