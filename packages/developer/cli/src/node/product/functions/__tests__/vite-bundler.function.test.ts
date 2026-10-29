/**
 * Stackra file contract:
 * Purpose: unit tests of `viteBundler`: it leaves every import the shell's import map resolves (exact or prefix key)
 *          external and nothing relative, absolute or URL-shaped, and answers the entry, the chunks to preload, the
 *          stylesheets and the bare specifiers; a build with no entry chunk is refused.
 * Boundary: test only; Vite's `build` is mocked, nothing is bundled.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0436 (decision 4).
 */
import { beforeEach, describe, expect, it } from "@stackra/testing";
import type { SurfaceBundleJob } from "@stackra/runway/node";
import { build } from "vite";
import { vi } from "vitest";

import { viteBundler } from "#node/product/functions/vite-bundler.function";

vi.mock("vite", () => ({ build: vi.fn() }));

const JOB = {
  surface: "console",
  root: "/repo/.stackra/surfaces/console",
  entry: "/repo/.stackra/surfaces/console/entry.ts",
  outDir: "/repo/dist/product/console",
  importMap: { imports: { react: "/shared/react.js", "@stackra/ui/": "/shared/ui/" } },
} as unknown as SurfaceBundleJob;

const chunk = (fileName: string, isEntry: boolean, imports: string[], css: string[] = []) => ({
  type: "chunk",
  fileName,
  isEntry,
  imports,
  viteMetadata: { importedCss: new Set(css) },
});

beforeEach(() => vi.mocked(build).mockReset());

describe("viteBundler", () => {
  it("answers the entry, preloads, stylesheets and the import-map specifiers", async () => {
    vi.mocked(build).mockResolvedValue({
      output: [
        chunk("console.1a.js", true, ["react", "chunks/a.2b.js"], ["assets/console.3c.css"]),
        chunk("chunks/a.2b.js", false, ["@stackra/ui/button", "react"], ["assets/console.3c.css"]),
        { type: "asset", fileName: "assets/console.3c.css" },
      ],
    } as never);

    expect(await viteBundler(JOB)).toEqual({
      entry: "console.1a.js",
      modulepreload: ["chunks/a.2b.js"],
      css: ["assets/console.3c.css"],
      imports: ["react", "@stackra/ui/button"],
    });
    const options = vi.mocked(build).mock.calls[0]?.[0] as {
      build: {
        rolldownOptions: { external: (id: string) => boolean; input: Record<string, string> };
      };
    };
    const { external, input } = options.build.rolldownOptions;
    expect(input).toEqual({ console: JOB.entry });
    expect(["react", "@stackra/ui/button"].map(external)).toEqual([true, true]);
    expect(
      [
        "react-dom",
        "./local",
        "/abs",
        "#internal",
        "\0virtual",
        "https://cdn/x.js",
        "@stackra/ui",
      ].map(external),
    ).toEqual([false, false, false, false, false, false, false]);
  });

  it("refuses a build without an entry chunk", async () => {
    vi.mocked(build).mockResolvedValue([{ output: [chunk("chunks/a.js", false, [])] }] as never);
    await expect(viteBundler(JOB)).rejects.toThrow("The console bundle has no entry chunk");
  });
});
