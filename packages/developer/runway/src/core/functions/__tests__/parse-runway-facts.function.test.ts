/**
 * Stackra file contract:
 * Purpose: unit tests of `parseRunwayFacts`: a valid facts document comes back with the defaults applied; an invalid
 *          one fails with a `RunwayInvalidError` naming the source and every invalid path.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0296 (decision 1), ADR 0295 (decision 5).
 */
import { describe, expect, it } from "@stackra/testing";

import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { parseRunwayFacts } from "#core/functions/parse-runway-facts.function";

describe("parseRunwayFacts", () => {
  it("applies the defaults", () => {
    expect(
      parseRunwayFacts(
        { version: 1, members: { console: { url: "http://localhost:5173", port: 5173 } } },
        "ports.json",
      ),
    ).toEqual({
      version: 1,
      environment: "dev",
      lane: 0,
      infra: {},
      members: {
        console: {
          url: "http://localhost:5173",
          port: 5173,
          https: false,
          open: false,
          desktop: {},
        },
      },
    });
  });

  it("names the source and every invalid path", () => {
    let caught: unknown;
    try {
      parseRunwayFacts(
        { version: 2, lane: -1, members: { console: { port: 70_000 } } },
        "ports.json",
      );
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(RunwayInvalidError);
    const error = caught as RunwayInvalidError;
    expect(error.source).toBe("ports.json");
    expect(error.issues.map((issue) => issue.path)).toEqual([
      "version",
      "lane",
      "members.console.port",
    ]);
    expect(error.message).toMatch(/^ports\.json is invalid: version: /);
  });
});
