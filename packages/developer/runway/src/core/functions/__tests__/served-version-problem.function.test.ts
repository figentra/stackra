/**
 * Stackra file contract:
 * Purpose: unit tests of `servedVersionProblem`: an answer passes only when its header (and, for `/-/version`, its
 *          body) names the version under test; another version, no header, or a route body naming another or none
 *          each fail with a line that says what answered.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0536; STA-2786.
 */
import { describe, expect, it } from "@stackra/testing";

import { servedVersionProblem } from "#core/functions/served-version-problem.function";

const NEW = "11111111-2222-3333-4444-555555555555";
const OLD = "99999999-2222-3333-4444-555555555555";

describe("servedVersionProblem", () => {
  it("passes an answer that names the version under test", () => {
    expect(servedVersionProblem(NEW, { header: NEW })).toBeUndefined();
    expect(
      servedVersionProblem(NEW, { header: NEW, route: true, body: { version: NEW } }),
    ).toBeUndefined();
  });

  it("fails an answer from another version, or one that names none", () => {
    expect(servedVersionProblem(NEW, { header: OLD })).toBe(
      `was answered by version ${OLD}, not ${NEW}`,
    );
    expect(servedVersionProblem(NEW, { header: null })).toBe(
      `named no version (no x-stackra-version header), not ${NEW}`,
    );
    expect(servedVersionProblem(NEW, { header: "" })).toMatch(/named no version/);
  });

  it("fails a /-/version answer whose body names another version or none", () => {
    expect(servedVersionProblem(NEW, { header: NEW, route: true, body: { version: OLD } })).toBe(
      `/-/version named version ${OLD}, not ${NEW}`,
    );
    for (const body of [undefined, null, "text", {}, { version: "" }, { version: 7 }])
      expect(servedVersionProblem(NEW, { header: NEW, route: true, body })).toBe(
        `/-/version named version none, not ${NEW}`,
      );
  });
});
