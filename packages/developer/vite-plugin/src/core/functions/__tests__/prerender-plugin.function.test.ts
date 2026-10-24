/**
 * Stackra file contract:
 * Purpose: unit tests of `prerenderPlugin`: after the client build it imports the entry through a module runner with
 *          the preset's plugins, writes `render(url, assets)` for each route to `<outDir>/<route>/index.html` with the
 *          entry's chunk and stylesheets (relative to each document under a relative base), and fails an entry that
 *          is not in the build or exports no `render`.
 * Boundary: test only; `runnerImport` is mocked and the documents go to a throwaway folder in the OS temp directory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0297; ADR 0255.
 */
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "@stackra/testing";

import { prerenderPlugin } from "#core/functions/prerender-plugin.function";

const { runnerImport } = vi.hoisted(() => ({ runnerImport: vi.fn() }));
vi.mock("vite", () => ({ runnerImport }));

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-vite-"));
});

afterEach(() => {
  vi.clearAllMocks();
  rmSync(root, { recursive: true, force: true });
});

/** A client bundle holding the prerender entry's chunk. */
function bundle(): Record<string, unknown> {
  return {
    "assets/offline-x1.js": {
      type: "chunk",
      isEntry: true,
      fileName: "assets/offline-x1.js",
      facadeModuleId: join(root, ".stackra/entry/offline.ts"),
      viteMetadata: { importedCss: new Set(["assets/offline-x2.css"]) },
    },
  };
}

/** Runs the plugin's `writeBundle` with the given base and bundle. */
async function prerender(base: string, output: Record<string, unknown>): Promise<void> {
  const plugin = prerenderPlugin({
    entry: ".stackra/entry/offline.ts",
    routes: ["/offline", "/ar-sa/offline"],
  });
  (plugin.configResolved as (config: unknown) => void)({
    root,
    base,
    mode: "pwa",
    define: {},
    build: { outDir: "dist" },
  });
  const writeBundle = plugin.writeBundle as (
    this: unknown,
    options: unknown,
    bundle: Record<string, unknown>,
  ) => Promise<void>;
  await writeBundle.call(
    {
      error(message: string): never {
        throw new Error(message);
      },
    },
    {},
    output,
  );
}

describe("prerenderPlugin", () => {
  it("writes each route's document from the entry's render export", async () => {
    runnerImport.mockResolvedValue({
      module: {
        render: (url: string, assets: { script: string; styles: string[] }) =>
          `${url} ${assets.script} ${assets.styles.join(",")}`,
      },
    });
    await prerender("/", bundle());

    expect(readFileSync(join(root, "dist/offline/index.html"), "utf8")).toBe(
      "/offline /assets/offline-x1.js /assets/offline-x2.css",
    );
    expect(readFileSync(join(root, "dist/ar-sa/offline/index.html"), "utf8")).toBe(
      "/ar-sa/offline /assets/offline-x1.js /assets/offline-x2.css",
    );
    expect(runnerImport).toHaveBeenCalledWith(
      join(root, ".stackra/entry/offline.ts"),
      expect.objectContaining({ root, mode: "pwa", configFile: false }),
    );
  });

  it("makes asset URLs relative to each document under a relative base", async () => {
    runnerImport.mockResolvedValue({
      module: { render: (_url: string, assets: { script: string }) => assets.script },
    });
    await prerender("./", bundle());

    expect(readFileSync(join(root, "dist/offline/index.html"), "utf8")).toBe(
      "../assets/offline-x1.js",
    );
    expect(readFileSync(join(root, "dist/ar-sa/offline/index.html"), "utf8")).toBe(
      "../../assets/offline-x1.js",
    );
  });

  it("fails when the entry is not in the client build", async () => {
    await expect(prerender("/", {})).rejects.toThrow(/not in the client build's input/);
  });

  it("fails when the entry exports no render function", async () => {
    runnerImport.mockResolvedValue({ module: {} });
    await expect(prerender("/", bundle())).rejects.toThrow(/must export render\(url, assets\)/);
  });
});
