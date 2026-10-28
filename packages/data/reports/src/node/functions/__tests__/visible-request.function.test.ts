/**
 * Stackra file contract:
 * Purpose: unit tests of `visibleRequest`: nothing hidden leaves the request as it is; hidden dimensions, measures,
 *          sort keys and pivot axes are dropped; a filter on a hidden dimension or a request of hidden measures only
 *          is forbidden.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0470 (decision 6).
 */
import { ForbiddenError } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import type { ReportRequest } from "#core/types/report-request.type";
import { visibleRequest } from "#node/functions/visible-request.function";

const request: ReportRequest = {
  dimensions: [{ name: "status" }, { name: "email" }],
  measures: ["orders", "margin"],
  sort: [
    { key: "margin", direction: "desc" },
    { key: "status", direction: "asc" },
  ],
  pivot: { rows: ["status"], columns: ["email"] },
};

describe(visibleRequest, () => {
  it("keeps a request with nothing hidden", () => {
    expect(visibleRequest(request, new Set())).toBe(request);
  });

  it("drops hidden dimensions, measures, sort keys and pivot axes", () => {
    expect(visibleRequest(request, new Set(["email", "margin"]))).toEqual({
      dimensions: [{ name: "status" }],
      measures: ["orders"],
      sort: [{ key: "status", direction: "asc" }],
      pivot: { rows: ["status"], columns: [] },
    });
    expect(visibleRequest(request, new Set(["email", "status"]))).not.toHaveProperty("pivot");
  });

  it("forbids a filter on a hidden dimension and a request of hidden measures only", () => {
    expect(() =>
      visibleRequest({ ...request, filters: { email: "a@b.c" } }, new Set(["email"])),
    ).toThrow(ForbiddenError);
    expect(() => visibleRequest(request, new Set(["orders", "margin"]))).toThrow(ForbiddenError);
  });
});
