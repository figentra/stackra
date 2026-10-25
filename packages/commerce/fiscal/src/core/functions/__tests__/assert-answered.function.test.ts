/**
 * Stackra file contract:
 * Purpose: unit tests of `assertAnswered`: answers about the document pass; server errors, throttling and refused
 *          credentials throw.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { FiscalAuthorityUnavailableError } from "#core/errors/fiscal-authority-unavailable.error";
import { assertAnswered } from "#core/functions/assert-answered.function";

const response = (status: number) => ({ status, headers: {}, body: "" });

describe("assertAnswered", () => {
  it.each([200, 202, 303, 400, 404, 409, 422])("returns status %s", (status) => {
    const answer = response(status);
    expect(assertAnswered(answer, "d")).toBe(answer);
  });

  it.each([401, 403, 408, 429, 500, 503])("throws on status %s", (status) => {
    try {
      assertAnswered(response(status), "d");
      expect.unreachable();
    } catch (error) {
      expect(isRefusal(error, FiscalAuthorityUnavailableError)).toBe(true);
      expect((error as FiscalAuthorityUnavailableError).details).toEqual({ driver: "d", status });
    }
  });
});
