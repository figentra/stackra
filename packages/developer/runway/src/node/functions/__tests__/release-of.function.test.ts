/**
 * Stackra file contract:
 * Purpose: unit tests of `releaseOf`: a bundle's release row under `<origin>/<product>/<surface>/<version>/`, with the
 *          entry, preload and stylesheet URLs under that folder and the shell line carried over; trailing slashes of
 *          the origin are dropped.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0437 (the KV copy); ADR 0436 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { releaseOf } from "#node/functions/release-of.function";
import type { EdgeBundle } from "#node/types/edge-bundle.type";

const BUNDLE: EdgeBundle = {
  surface: "console",
  folder: "/repo/dist/bundles/console/1.2.0",
  manifest: {
    package: "@mezzora/console-ui",
    surface: "console",
    targets: "console@3",
    version: "1.2.0",
    entry: "entry-abc.js",
    modulepreload: ["entry-abc.js", "chunks/view-def.js"],
    css: ["style-123.css"],
    imports: ["react"],
  },
};

describe("releaseOf", () => {
  it("places every URL under the bundle's versioned folder", () => {
    const base = "https://assets.figentra.com/mezzora/console/1.2.0/";

    expect(releaseOf(BUNDLE, "mezzora", "https://assets.figentra.com")).toEqual({
      version: "1.2.0",
      url: `${base}entry-abc.js`,
      base,
      targets: "console@3",
      modulepreload: [`${base}entry-abc.js`, `${base}chunks/view-def.js`],
      css: [`${base}style-123.css`],
    });
  });

  it("drops trailing slashes of the origin", () => {
    expect(releaseOf(BUNDLE, "mezzora", "http://127.0.0.1:4173/assets//").base).toBe(
      "http://127.0.0.1:4173/assets/mezzora/console/1.2.0/",
    );
  });
});
