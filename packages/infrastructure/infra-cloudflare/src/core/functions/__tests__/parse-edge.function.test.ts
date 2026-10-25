/**
 * Stackra file contract:
 * Purpose: unit tests of `parseEdge`: the template's edge block parses as written and keeps another owner's key, an
 *          absent block gets the ADR defaults, and an unknown bot mode or a dotted API host fails naming its path.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0175 (decision 1), ADR 0217 (decisions 2 and 3), ADR 0325
 *                     (rule 24).
 */
import { describe, expect, it } from "@stackra/testing";

import { rootRunway, TEMPLATE_EDGE } from "#core/__tests__/fixtures/root-runway.fixture";
import { thrownIssues } from "#core/__tests__/fixtures/thrown-issues.fixture";
import { CloudflareConfigInvalidError } from "#core/errors/cloudflare-config-invalid.error";
import { parseEdge } from "#core/functions/parse-edge.function";

describe("parseEdge", () => {
  it("reads the template's edge block and keeps keys other owners read", () => {
    expect(parseEdge(rootRunway({ edge: TEMPLATE_EDGE }))).toEqual(TEMPLATE_EDGE);
  });

  it("applies the defaults when the runway has no edge block", () => {
    expect(parseEdge(rootRunway())).toEqual({
      proxy: "all",
      waf: "managed",
      bots: { mode: "off" },
      rateLimit: {},
      tls: { minVersion: "1.2", hsts: false },
    });
  });

  it("names each invalid path under edge", () => {
    const root = rootRunway({ edge: { bots: { mode: "block-everyone" }, apiHost: "api.v1" } });

    expect(() => parseEdge(root, "acme/runway.yaml")).toThrow(CloudflareConfigInvalidError);
    expect(thrownIssues(() => parseEdge(root)).map((issue) => issue.path)).toEqual([
      "edge.bots.mode",
      "edge.apiHost",
    ]);
  });
});
