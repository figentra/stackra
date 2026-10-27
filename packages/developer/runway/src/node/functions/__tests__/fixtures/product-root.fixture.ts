/**
 * Stackra file contract:
 * Purpose: `PRODUCT_ROOT` and `writeBundle`, the fixtures of the publish tests: a product root runway with a
 *          console (two packages, one host), a landing site on two hosts (one canonical, one the product's own
 *          domain), an ops contribution and a staff app linked to the console host; and a writer of a built bundle
 *          folder with its manifest.
 * Boundary: test only; never exported from an entry.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); app-shells 8.2; owner decisions D2 and D9.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** A product root runway document. */
export const PRODUCT_ROOT = {
  version: 3,
  project: "mezzora",
  product: { key: "mezzora" },
  surfaces: {
    console: { shell: "os/console@3", packages: ["@mezzora/console-ui"], host: "console.mezzora" },
    landing: {
      shell: "os/landing@1",
      content: "assets/landing",
      hosts: [{ host: "mezzora", canonical: true }, { host: "mezzora.com." }],
    },
    ops: { contributes: "@mezzora/ops-ui" },
  },
  mobile: {
    staff: {
      template: "os/mobile@3",
      identity: {
        ios: { bundleId: "com.figentra.mezzora.staff", team: "figentra" },
        android: { package: "com.figentra.mezzora.staff" },
        links: ["console.mezzora.figentra.com"],
      },
    },
  },
  environments: {
    production: { domains: { zone: "figentra.com" }, regions: ["me-central", "eu-west"] },
  },
};

/** Writes a built bundle of `surface` at `version` under `repository`, with its manifest. */
export function writeBundle(
  repository: string,
  surface: string,
  version: string,
  overrides: Record<string, unknown> = {},
): void {
  const folder = join(repository, "dist/bundles", surface, version);
  mkdirSync(join(folder, "chunks"), { recursive: true });
  writeFileSync(join(folder, "entry-abc.js"), "export {};");
  writeFileSync(join(folder, "chunks/view-def.js"), "export {};");
  writeFileSync(join(folder, "style-123.css"), "");
  writeFileSync(
    join(folder, "bundle.manifest.json"),
    JSON.stringify({
      package: "@mezzora/console-ui",
      surface,
      targets: `${surface}@3`,
      version,
      entry: "entry-abc.js",
      modulepreload: ["entry-abc.js", "chunks/view-def.js"],
      css: ["style-123.css"],
      imports: ["react", "@stackra/ui/button"],
      ...overrides,
    }),
  );
}
