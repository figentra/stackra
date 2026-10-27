/**
 * Stackra file contract:
 * Purpose: unit tests of `memberNaming`: the framework and OS names with no product, the product key from the root
 *          runway, `--scope` as a product key or an npm scope, and `catalog:stackra` when the workspace has that
 *          catalog.
 * Boundary: test only; writes a throwaway workspace in the OS temp directory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0349 (decision 2); STA-1210.
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
    writeFileSync(join(root, "runway.yaml"), "version: 3\nproduct:\n  key: beautilon\n");
    writeFileSync(join(root, "pnpm-workspace.yaml"), "catalogs:\n  stackra: {}\n");
    expect(memberNaming(root, "service", "salon")).toEqual({
      packageName: "@figentra/beautilon-service-salon",
      stackraVersion: "catalog:stackra",
    });
    expect(memberNaming(root, "package", "rules").packageName).toBe("@figentra/beautilon-rules");
  });

  it("lets --scope win", () => {
    writeFileSync(join(root, "runway.yaml"), "version: 3\nproduct:\n  key: beautilon\n");
    expect(memberNaming(root, "service", "orders", "commerce").packageName).toBe(
      "@figentra/commerce-service-orders",
    );
    expect(memberNaming(root, "service", "orders", "@acme").packageName).toBe(
      "@acme/service-orders",
    );
    expect(memberNaming(root, "package", "kit", "@acme").packageName).toBe("@acme/kit");
  });
});
