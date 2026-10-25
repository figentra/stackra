/**
 * Stackra file contract:
 * Purpose: unit tests of `parseBranchProtection`: this repository's committed `.github/branch-protection.json` shape
 *          passes with its `$schema` and `comment`; the four nullable keys GitHub requires must be present; a push
 *          restriction, an approval count above six and an unmapped setting that is on are refused with their paths,
 *          while an unmapped setting that is off passes.
 * Boundary: test only; the document is an inline copy of the committed JSON shape.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0171 (decision 8); `tools/schemas/branch-protection.schema.json`.
 */
import { describe, expect, it } from "@stackra/testing";

import { GithubInfraInvalidError } from "#core/errors/github-infra-invalid.error";
import { parseBranchProtection } from "#core/functions/parse-branch-protection.function";

/** The shape of `.github/branch-protection.json`. */
const PROTECTION = {
  $schema: "https://static.stackra.figentra.com/schemas/branch-protection.json",
  comment: "Branch protection rules for the main branch.",
  branch: "main",
  rules: {
    required_status_checks: { strict: false, contexts: ["Quality Gate"] },
    enforce_admins: false,
    required_pull_request_reviews: {
      dismiss_stale_reviews: true,
      require_code_owner_reviews: false,
      required_approving_review_count: 0,
    },
    restrictions: null,
    required_linear_history: true,
    allow_force_pushes: false,
    allow_deletions: false,
  },
};

/** The paths a refused file names. */
const pathsOf = (document: unknown): string[] => {
  try {
    parseBranchProtection(document, ".github/branch-protection.json");
  } catch (error) {
    if (error instanceof GithubInfraInvalidError) return error.issues.map((issue) => issue.path);
    throw error;
  }
  throw new Error("Expected a GithubInfraInvalidError");
};

describe("parseBranchProtection", () => {
  it("accepts the committed shape", () => {
    const protection = parseBranchProtection(PROTECTION);

    expect(protection.branch).toBe("main");
    expect(protection.rules.required_status_checks?.contexts).toEqual(["Quality Gate"]);
  });

  it("passes an unmapped setting while it is off", () => {
    expect(() =>
      parseBranchProtection({
        ...PROTECTION,
        rules: { ...PROTECTION.rules, block_creations: false, allow_fork_syncing: false },
      }),
    ).not.toThrow();
  });

  it("refuses what GitHub requires missing, a push restriction, a count above six and an unmapped setting that is on", () => {
    const withoutAdmins = Object.fromEntries(
      Object.entries(PROTECTION.rules).filter(([key]) => key !== "enforce_admins"),
    );

    expect(pathsOf({ ...PROTECTION, rules: withoutAdmins })).toEqual(["rules.enforce_admins"]);
    expect(
      pathsOf({
        ...PROTECTION,
        rules: {
          ...PROTECTION.rules,
          restrictions: { users: ["octo-owner"], teams: [] },
          required_pull_request_reviews: {
            ...PROTECTION.rules.required_pull_request_reviews,
            required_approving_review_count: 7,
          },
        },
      }),
    ).toEqual([
      "rules.required_pull_request_reviews.required_approving_review_count",
      "rules.restrictions",
    ]);
    expect(
      pathsOf({ ...PROTECTION, rules: { ...PROTECTION.rules, block_creations: true } }),
    ).toEqual(["rules.block_creations"]);
  });
});
