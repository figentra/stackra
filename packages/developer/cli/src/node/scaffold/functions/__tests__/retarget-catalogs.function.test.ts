/**
 * Stackra file contract:
 * Purpose: unit tests of `retargetCatalogs`: a reference whose catalog holds the package is kept, one whose catalog
 *          does not is pointed at the catalog that does (the default catalog as `catalog:`, from the top-level
 *          `catalog` or `catalogs.default`), a package no catalog holds is kept and named in `missing`, a
 *          `workspace:` reference moves to the catalog that holds the package (a product's `catalog:stackra`) or stays
 *          (core's own member), and other versions are left alone.
 * Boundary: test only; pure inputs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0013; ADR 0126.
 */
import { describe, expect, it } from "@stackra/testing";

import { retargetCatalogs } from "#node/scaffold/functions/retarget-catalogs.function";

const PRODUCT = `catalogs:
  default:
    react: 19.2.0
    "@types/node": 24.0.0
  build:
    vite: 8.0.0
  stackra:
    "@stackra/app": 0.33.1
`;

describe("retargetCatalogs", () => {
  it("points each reference at the catalog that holds the package and keeps the right ones", () => {
    const { manifest, missing } = retargetCatalogs(
      {
        name: "@acme/console",
        dependencies: {
          react: "catalog:frontend",
          "@stackra/app": "catalog:stackra",
          left: "workspace:*",
        },
        devDependencies: {
          vite: "catalog:frontend",
          "@types/node": "catalog:",
          tailwindcss: "catalog:frontend",
        },
      },
      PRODUCT,
    );
    expect(manifest).toEqual({
      name: "@acme/console",
      dependencies: { react: "catalog:", "@stackra/app": "catalog:stackra", left: "workspace:*" },
      devDependencies: {
        vite: "catalog:build",
        "@types/node": "catalog:",
        tailwindcss: "catalog:frontend",
      },
    });
    expect(missing).toEqual(["tailwindcss@catalog:frontend"]);
  });

  it("reads the top-level default catalog and treats catalog:default as the default", () => {
    const { manifest, missing } = retargetCatalogs(
      {
        peerDependencies: { react: "catalog:default" },
        optionalDependencies: { zod: "catalog:x" },
      },
      "catalog:\n  react: 19.2.0\n  zod: 4.0.0\n",
    );
    expect(manifest).toEqual({
      peerDependencies: { react: "catalog:default" },
      optionalDependencies: { zod: "catalog:" },
    });
    expect(missing).toEqual([]);
  });

  it("moves a workspace reference to the catalog that holds it and keeps the others", () => {
    const { manifest, missing } = retargetCatalogs(
      {
        devDependencies: {
          "@stackra/vitest-config": "workspace:*",
          "@acme/kit": "workspace:*",
          x: "^1.0.0",
        },
      },
      PRODUCT.replace('"@stackra/app"', '"@stackra/vitest-config"'),
    );
    expect(manifest).toEqual({
      devDependencies: {
        "@stackra/vitest-config": "catalog:stackra",
        "@acme/kit": "workspace:*",
        x: "^1.0.0",
      },
    });
    expect(missing).toEqual([]);
  });

  it("names every package when the workspace has no catalogs", () => {
    expect(
      retargetCatalogs({ dependencies: { b: "catalog:x", a: "catalog:" } }, "packages: []\n")
        .missing,
    ).toEqual(["a@catalog:", "b@catalog:x"]);
  });
});
