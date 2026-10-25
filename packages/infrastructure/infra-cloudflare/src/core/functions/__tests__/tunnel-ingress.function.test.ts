/**
 * Stackra file contract:
 * Purpose: unit tests of `tunnelIngress`: every member with a port, sorted, gets `<member>-<dev>.<zone>` to its local
 *          port and the catch-all closes the list; a named member list is kept in its order; a member without a port
 *          and a host longer than one DNS label each fail naming the tunnel.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0290 (decisions 2 and 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { thrownIssues } from "#core/__tests__/fixtures/thrown-issues.fixture";
import { tunnelIngress } from "#core/functions/tunnel-ingress.function";

const ports = { web: 5174, console: 5173 };

describe("tunnelIngress", () => {
  it("exposes every member with a dev port, then the catch-all", () => {
    expect(tunnelIngress({ label: "akouta", zone: "figentra.cloud", ports })).toEqual([
      { hostname: "console-akouta.figentra.cloud", service: "http://localhost:5173" },
      { hostname: "web-akouta.figentra.cloud", service: "http://localhost:5174" },
      { service: "http_status:404" },
    ]);
  });

  it("exposes only the named members, in their order", () => {
    expect(
      tunnelIngress({ label: "box", zone: "figentra.cloud", ports, members: ["web"] }),
    ).toEqual([
      { hostname: "web-box.figentra.cloud", service: "http://localhost:5174" },
      { service: "http_status:404" },
    ]);
  });

  it("refuses a member without a port and a host that is not one label", () => {
    const issues = thrownIssues(() =>
      tunnelIngress({
        label: "a".repeat(60),
        zone: "figentra.cloud",
        ports,
        members: ["docs", "web"],
      }),
    );

    expect(issues.map((issue) => issue.message)).toEqual([
      "docs has no dev port in its runway",
      expect.stringContaining("is not one DNS label"),
      expect.stringContaining("is not one DNS label"),
    ]);
  });
});
