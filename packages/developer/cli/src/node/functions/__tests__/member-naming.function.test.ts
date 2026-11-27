/**
 * Stackra file contract:
 * Purpose: unit tests of `memberNaming`: the framework and OS names with no product, the product key from the root
 *          runway, `--scope` as a product key or an npm scope, the workspace's own scope (root package.json
 *          `stackra.scope`, else the root package's non-first-party scope) over the product key, the refusal of a
 *          malformed `stackra.scope`, and `catalog:stackra` when the workspace has that catalog.
 * Boundary: test only; writes a throwaway workspace in the OS temp directory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0349 (decision 2); STA-1210; STA-2890.
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { memberNaming } from "#node/functions/member-naming.function";

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-naming-"));
  writeFileSync(join(root, "pnpm-workspace.yaml"), "packages: []\n");
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("memberNaming", () => {
  it("keeps the framework and OS names with no product", () => {
    expect(memberNaming(root, "package", "loyalty-kit")).toEqual({
      packageName: "@stackra/loyalty-kit",
      stackraVersion: "workspace:*",
    });
    expect(memberNaming(root, "service", "orders").packageName).toBe("@figentra/service-orders");
  });

  it("uses the root runway product key and the stackra catalog", () => {
    writeFileSync(join(root, "runway.yaml"), "version: 3\nproduct:\n  key: velora\n");
    writeFileSync(join(root, "pnpm-workspace.yaml"), "catalogs:\n  stackra: {}\n");
    expect(memberNaming(root, "service", "salon")).toEqual({
      packageName: "@figentra/velora-service-salon",
      stackraVersion: "catalog:stackra",
    });
    expect(memberNaming(root, "package", "rules").packageName).toBe("@figentra/velora-rules");
  });

  it("lets --scope win", () => {
    writeFileSync(join(root, "runway.yaml"), "version: 3\nproduct:\n  key: velora\n");
    expect(memberNaming(root, "service", "orders", "commerce").packageName).toBe(
      "@figentra/commerce-service-orders",
    );
    expect(memberNaming(root, "service", "orders", "@acme").packageName).toBe(
      "@acme/service-orders",
    );
    expect(memberNaming(root, "package", "kit", "@acme").packageName).toBe("@acme/kit");
  });

  it("names a created app's members in its own scope, not Figentra's", () => {
    // What `stackra create --scope @acme` leaves: the runway product key and the stored scope.
    writeFileSync(join(root, "runway.yaml"), "version: 3\nproduct:\n  key: acme\n");
    writeFileSync(join(root, "pnpm-workspace.yaml"), "catalogs:\n  stackra: {}\n");
    writeFileSync(
      join(root, "package.json"),
      JSON.stringify({ name: "acme", stackra: { scope: "@acme-co" } }),
    );
    expect(memberNaming(root, "service", "orders")).toEqual({
      packageName: "@acme-co/service-orders",
      stackraVersion: "catalog:stackra",
    });
    expect(memberNaming(root, "package", "kit").packageName).toBe("@acme-co/kit");
    // --scope still wins.
    expect(memberNaming(root, "service", "orders", "@other").packageName).toBe(
      "@other/service-orders",
    );
    expect(memberNaming(root, "service", "orders", "commerce").packageName).toBe(
      "@figentra/commerce-service-orders",
    );
  });

  it("falls back to the root package's own scope, never a first-party one", () => {
    writeFileSync(join(root, "runway.yaml"), "version: 3\nproduct:\n  key: velora\n");
    writeFileSync(join(root, "package.json"), JSON.stringify({ name: "@acme/platform" }));
    expect(memberNaming(root, "service", "orders").packageName).toBe("@acme/service-orders");
    for (const name of ["@figentra/velora", "@stackra/velora", "@stackra-pro/velora", "velora"]) {
      writeFileSync(join(root, "package.json"), JSON.stringify({ name }));
      expect(memberNaming(root, "service", "salon").packageName).toBe(
        "@figentra/velora-service-salon",
      );
    }
  });

  it.each(["acme", "@Acme", 7])("refuses a root stackra.scope of %j", (scope) => {
    writeFileSync(join(root, "package.json"), JSON.stringify({ name: "x", stackra: { scope } }));
    expect(() => memberNaming(root, "service", "orders")).toThrow(
      /stackra\.scope must be an npm scope/,
    );
  });
});
