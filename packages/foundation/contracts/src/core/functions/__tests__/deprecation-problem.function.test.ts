/**
 * Stackra file contract:
 * Purpose: unit tests of `deprecationProblem`: a good deprecation passes in either form; malformed options, unknown
 *          names, a since or sunset in neither form or in different forms and an empty replacement are
 *          `deprecation_invalid`; a sunset inside the window is `deprecation_window_short`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0131 (decision 4); ADR 0136 (decision 4); ADR 0177 (decision 6); STA-2836.
 */
import { describe, expect, it } from "@stackra/testing";

import { deprecationProblem } from "#core/functions/deprecation-problem.function";

describe(deprecationProblem, () => {
  it("passes a deprecation whose sunset is at or past the end of its window", () => {
    expect(deprecationProblem({ since: "0.34.0", sunset: "0.35.0" })).toBeUndefined();
    expect(
      deprecationProblem({ since: "0.34.2", sunset: "0.36.0", replacement: "OrderPlaced.total" }),
    ).toBeUndefined();
    expect(deprecationProblem({ since: "1.2.0", sunset: "2.0.0" })).toBeUndefined();
    expect(deprecationProblem({ since: "2026-11-26", sunset: "2027-05-26" })).toBeUndefined();
  });

  it("refuses options that are not an object or name an unknown option", () => {
    expect(deprecationProblem(undefined)?.code).toBe("deprecation_invalid");
    expect(deprecationProblem("0.35.0")?.code).toBe("deprecation_invalid");
    expect(deprecationProblem(["0.34.0"])?.code).toBe("deprecation_invalid");
    expect(deprecationProblem({ since: "0.34.0", sunset: "0.35.0", removeIn: "0.35.0" })).toEqual({
      code: "deprecation_invalid",
      message: "the deprecation names `removeIn`; it takes since, sunset and replacement",
    });
  });

  it("refuses a since or sunset in neither form, or in different forms", () => {
    expect(deprecationProblem({ since: "soon", sunset: "0.35.0" })?.message).toMatch(
      /^since "soon" is neither/,
    );
    expect(deprecationProblem({ sunset: "0.35.0" })?.message).toMatch(
      /^since undefined is neither/,
    );
    expect(deprecationProblem({ since: "0.34.0", sunset: "next" })?.message).toMatch(
      /^sunset "next" is neither/,
    );
    expect(deprecationProblem({ since: "0.34.0", sunset: "2027-05-26" })?.message).toMatch(
      /not the same form/,
    );
  });

  it("refuses an empty replacement", () => {
    expect(deprecationProblem({ since: "0.34.0", sunset: "0.35.0", replacement: " " })?.code).toBe(
      "deprecation_invalid",
    );
    expect(deprecationProblem({ since: "0.34.0", sunset: "0.35.0", replacement: 3 })?.code).toBe(
      "deprecation_invalid",
    );
  });

  it("refuses a sunset inside the window, naming the earliest one", () => {
    expect(deprecationProblem({ since: "0.34.0", sunset: "0.34.9" })).toEqual({
      code: "deprecation_window_short",
      message:
        'sunset "0.34.9" is inside the window: an API deprecated in 0.34.0 stays until 0.35.0 at least (ADR 0177 decision 6: one minor before 1.0, one major after)',
    });
    expect(deprecationProblem({ since: "1.2.0", sunset: "1.9.0" })?.code).toBe(
      "deprecation_window_short",
    );
    expect(deprecationProblem({ since: "0.35.0", sunset: "0.34.0" })?.code).toBe(
      "deprecation_window_short",
    );
    expect(deprecationProblem({ since: "2026-11-26", sunset: "2027-03-01" })).toEqual({
      code: "deprecation_window_short",
      message:
        'sunset "2027-03-01" is inside the window: a public API deprecated on 2026-11-26 answers until 2027-05-26 at least (ADR 0136 decision 4)',
    });
  });
});
