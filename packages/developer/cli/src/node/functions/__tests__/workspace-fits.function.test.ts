/**
 * Stackra file contract:
 * Purpose: unit tests of `workspaceFits`: mobile from the root runway or a react-native member, surfaces from the
 *          root runway, product from either, a package from a member's name or any dependency section, and seed packs
 *          from the root folder.
 * Boundary: test only; the seed-packs case writes a temp folder.
 * Runtime: node (vitest)
 * Governing contract: STA-2872 spec FR-002; ADR 0022 (test placement).
 */
// @covers sta-2872:FR-002
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "@stackra/testing";

import { workspaceFits } from "#node/functions/workspace-fits.function";

const workspace = (manifests: unknown[], runway?: unknown) => ({
  manifests,
  scripts: {},
  devPorts: [],
  ...(runway === undefined ? {} : { runway }),
});

describe("workspaceFits", () => {
  it("finds nothing in an empty workspace", () => {
    const fits = workspaceFits("/nowhere", workspace([]));
    for (const fit of ["mobile", "surfaces", "product", "seed-packs", "@stackra/search"] as const)
      expect(fits(fit)).toBe(false);
  });

  it("reads surfaces and mobile from the root runway", () => {
    const surfaces = workspaceFits("/x", workspace([], { surfaces: { landing: {} } }));
    expect([surfaces("surfaces"), surfaces("mobile"), surfaces("product")]).toEqual([
      true,
      false,
      true,
    ]);
    const mobile = workspaceFits("/x", workspace([], { mobile: { app: {} }, surfaces: {} }));
    expect([mobile("surfaces"), mobile("mobile"), mobile("product")]).toEqual([false, true, true]);
  });

  it("counts a react-native member as a mobile app", () => {
    const fits = workspaceFits("/x", workspace([{ stackra: { runtimes: ["react-native"] } }]));
    expect(fits("mobile")).toBe(true);
  });

  it("finds a package by a member's name or any dependency section", () => {
    for (const manifest of [
      { name: "@stackra/search" },
      { dependencies: { "@stackra/search": "1" } },
      { devDependencies: { "@stackra/search": "1" } },
      { peerDependencies: { "@stackra/search": "1" } },
      { optionalDependencies: { "@stackra/search": "1" } },
    ])
      expect(workspaceFits("/x", workspace([manifest]))("@stackra/search")).toBe(true);
    expect(
      workspaceFits("/x", workspace([{ name: "@stackra/searchable" }]))("@stackra/search"),
    ).toBe(false);
  });

  it("finds seed packs in the root seed-packs folder", () => {
    const root = mkdtempSync(join(tmpdir(), "stackra-fits-"));
    try {
      expect(workspaceFits(root, workspace([]))("seed-packs")).toBe(false);
      mkdirSync(join(root, "seed-packs"));
      expect(workspaceFits(root, workspace([]))("seed-packs")).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
