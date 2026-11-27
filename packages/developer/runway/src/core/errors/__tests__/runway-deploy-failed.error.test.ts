/**
 * Stackra file contract:
 * Purpose: unit tests of `RunwayDeployFailedError`: names the target and the provider's detail, and keeps the results
 *          in order, frozen; a rollback's error carries the detail of every down result, not of the last result.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0352 (decision 3); STA-2786.
 */
import { describe, expect, it } from "@stackra/testing";

import { RunwayDeployFailedError } from "#core/errors/runway-deploy-failed.error";

/** A record of `target`. */
const record = (target: string) => ({ target, sha: "a", reference: "a" });

describe("RunwayDeployFailedError", () => {
  it("names the target and the detail and keeps the results", () => {
    const results = [
      {
        record: { target: "production/services/ksa", sha: "a", reference: "a" },
        report: { status: "down" as const, detail: "branch ksa points to nothing" },
      },
    ];
    const error = new RunwayDeployFailedError("production/services/ksa", results);

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("RunwayDeployFailedError");
    expect(error.message).toBe(
      "production/services/ksa did not verify: branch ksa points to nothing",
    );
    expect(error.target).toBe("production/services/ksa");
    expect(error.results).toEqual(results);
    expect(Object.isFrozen(error.results)).toBe(true);
  });

  it("carries every down result's detail when a rollback names several targets", () => {
    const error = new RunwayDeployFailedError("production/web, production/docs", [
      {
        record: record("production/web"),
        report: { status: "down" as const, detail: "web is split" },
      },
      { record: record("production/api"), report: { status: "up" as const } },
      {
        record: record("production/docs"),
        report: { status: "down" as const, detail: "docs answered 503" },
      },
    ]);
    expect(error.message).toBe(
      "production/web, production/docs did not verify: web is split; docs answered 503",
    );
  });
});
