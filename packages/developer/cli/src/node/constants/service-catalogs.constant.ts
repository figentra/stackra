/**
 * Stackra file contract:
 * Purpose: `SERVICE_CATALOGS`, the third-party versions a new service names (`catalog:` as `default`, `catalog:build`,
 *          `catalog:quality`), so a service written into a folder with no workspace gets a `pnpm-workspace.yaml` whose
 *          catalogs resolve them. The `stackra` catalog is not here: it is pinned to the running CLI's version.
 * Boundary: data only. A test holds every value equal to this repository's `pnpm-workspace.yaml`, so a bump there
 *           fails until this table follows it.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 4: `stackra new` is the one scaffolder); versions policy (catalogs, exact pins).
 */

/** Catalog name to its entries; `default` is the unnamed `catalog:`. */
export const SERVICE_CATALOGS: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  default: {
    "@electric-sql/pglite": "0.5.8",
    "@electric-sql/pglite-pgvector": "0.0.9",
    "@faker-js/faker": "10.6.0",
    "@mikro-orm/pglite": "7.2.5",
    "@testcontainers/postgresql": "12.2.0",
    "@types/node": "26.6.4",
    testcontainers: "12.2.1",
  },
  build: { tsdown: "0.23.1", typescript: "7.0.2" },
  quality: { oxfmt: "0.71.0", oxlint: "1.86.0", vitest: "5.0.5" },
};
