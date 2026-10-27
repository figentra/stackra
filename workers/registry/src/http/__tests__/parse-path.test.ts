/**
 * Stackra file contract:
 * Purpose: unit tests of `parsePath` and `splitName`: every route of ADR 0453 decision 4, `%2f` and `/` forms, and
 *          the unknown paths.
 * Boundary: pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0453 (decision 4).
 */
import { parsePath } from "#src/http/parse-path";
import { splitName } from "#src/http/split-name";

describe("parsePath", () => {
  it.each([
    ["/-/ping", { kind: "ping" }],
    ["/-/whoami", { kind: "whoami" }],
    ["/-/npm/v1/keys", { kind: "keys" }],
    ["/-/user/org.couchdb.user:me", { kind: "login" }],
    ["/@stackra%2fcore", { kind: "package", name: "@stackra/core" }],
    ["/@stackra%2Fcore", { kind: "package", name: "@stackra/core" }],
    ["/@stackra/core", { kind: "package", name: "@stackra/core" }],
    ["/@stackra/core/latest", { kind: "version", name: "@stackra/core", spec: "latest" }],
    ["/@stackra/core/1.0.0", { kind: "version", name: "@stackra/core", spec: "1.0.0" }],
    [
      "/@stackra/core/-/core-1.0.0.tgz",
      { kind: "tarball", name: "@stackra/core", file: "core-1.0.0.tgz" },
    ],
    ["/@stackra%2fcore/-rev/3-abc", { kind: "unpublish", name: "@stackra/core" }],
    [
      "/-/package/@stackra%2fcore/dist-tags",
      { kind: "distTags", name: "@stackra/core", tag: null },
    ],
    [
      "/-/package/@stackra%2fcore/dist-tags/canary",
      { kind: "distTags", name: "@stackra/core", tag: "canary" },
    ],
    [
      "/-/npm/v1/oidc/token/exchange/package/@stackra%2fcore",
      { kind: "exchange", name: "@stackra/core" },
    ],
    [
      "/-/npm/v1/attestations/@stackra%2fcore@1.0.0",
      { kind: "attestations", name: "@stackra/core", version: "1.0.0" },
    ],
    ["/-/stackra/v1/catalogue", { kind: "catalogue" }],
    ["/-/stackra/v1/catalogue/@stackra/core", { kind: "catalogueItem", name: "@stackra/core" }],
    ["/-/stackra/v1/entitlements", { kind: "entitlements" }],
  ])("parses %s", (path, route) => {
    expect(parsePath(path)).toEqual(route);
  });

  it.each(["/lodash", "/@Stackra/core", "/-/v1/search", "/@stackra/core/a/b", "/%E0%A4%A", "/"])(
    "refuses %s",
    (path) => {
      expect(parsePath(path)).toEqual({ kind: "unknown" });
    },
  );
});

describe("splitName", () => {
  it("splits a scoped name", () => {
    expect(splitName("@stackra-pro/sync")).toEqual({ scope: "@stackra-pro", bare: "sync" });
  });
});
