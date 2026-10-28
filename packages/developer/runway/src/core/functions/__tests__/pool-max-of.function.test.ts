/**
 * Stackra file contract:
 * Purpose: unit tests of `poolMaxOf`: a service's budget is divided by its group's most instances, the root default
 *          stands in for a missing budget, a monolith and an isolated member count one instance, no budget gives
 *          `undefined`, and a budget below the instance count is refused at its path.
 * Boundary: test only; runways are built through `parseRunway`, so each is a checked shape.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0473 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { RunwayEnvironment } from "#core/enums/runway-environment.enum";
import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { parseRunway } from "#core/functions/parse-runway.function";
import { poolMaxOf } from "#core/functions/pool-max-of.function";

const production = RunwayEnvironment.Production;

/** A root runway with the given production block. */
function root(environment: Record<string, unknown>) {
  return parseRunway("root", {
    version: 3,
    project: "acme-platform",
    environments: { production: environment },
  });
}

/** A service runway whose production database has `poolBudget`, or none. */
function service(poolBudget?: number) {
  return parseRunway("service", {
    version: 3,
    environments: { production: poolBudget === undefined ? {} : { database: { poolBudget } } },
  });
}

const grouped = {
  topology: {
    mode: "grouped",
    default: "core",
    isolate: ["billing"],
    groups: {
      commerce: { members: ["commerce"], instances: { min: 1, max: 4 } },
      core: { members: ["notifications"], instances: { min: 1, max: 3 } },
    },
  },
};

describe("poolMaxOf", () => {
  it("divides the budget by the group's most instances, rounding down", () => {
    expect(poolMaxOf(root(grouped), service(50), "commerce", production)).toBe(12);
  });

  it("puts an unlisted member in the default group and counts one for an isolated one", () => {
    expect(poolMaxOf(root(grouped), service(30), "search", production)).toBe(10);
    expect(poolMaxOf(root(grouped), service(30), "billing", production)).toBe(30);
    expect(poolMaxOf(root({ topology: { mode: "monolith" } }), service(20), "commerce", production)).toBe(20);
  });

  it("takes the root default when the service names no budget, and nothing without either", () => {
    const withDefault = root({
      ...grouped,
      defaults: { service: { database: { poolBudget: 40 } } },
    });
    expect(poolMaxOf(withDefault, service(), "commerce", production)).toBe(10);
    expect(poolMaxOf(root(grouped), service(), "commerce", production)).toBeUndefined();
  });

  it("refuses a budget that leaves an instance no connection", () => {
    expect(() => poolMaxOf(root(grouped), service(3), "commerce", production)).toThrow(
      RunwayInvalidError,
    );
    try {
      poolMaxOf(root(grouped), service(3), "commerce", production);
    } catch (error) {
      expect((error as RunwayInvalidError).issues[0]?.path).toBe(
        "environments.production.database.poolBudget",
      );
    }
  });
});
