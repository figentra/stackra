/**
 * Stackra file contract:
 * Purpose: unit tests of `costLabels`: the project, environment and service labels always present, each required key
 *          the foundation cannot fill reading `shared`, and the known keys never overridden.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0172 (decision 5: every resource carries cost tags).
 */
import { describe, expect, it } from "@stackra/testing";

import { costLabels } from "#core/functions/cost-labels.function";

describe("costLabels", () => {
  it("stamps the project, the environment and the owning package", () => {
    expect(costLabels("acme", "staging", [])).toEqual({
      project: "acme",
      env: "staging",
      service: "infra-gcp",
    });
  });

  it("fills a required key it cannot know with shared", () => {
    expect(costLabels("acme", "staging", ["team", "env"])).toEqual({
      team: "shared",
      project: "acme",
      env: "staging",
      service: "infra-gcp",
    });
  });

  it("keeps a known key's real value when the runway requires it", () => {
    expect(costLabels("acme", "production", ["project", "service"])).toMatchObject({
      project: "acme",
      service: "infra-gcp",
    });
  });
});
