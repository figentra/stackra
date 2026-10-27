/**
 * Stackra file contract:
 * Purpose: unit tests of `bundlePlugin`: the output folder `<outDir>/<surface>/<version>/` from the committed manifest;
 *          no manifest and a surface the member does not target fail with what to run; `bundle.manifest.json` carries
 *          the targets, the entry, the static modulepreload chain, the stylesheets and the import-map specifiers used,
 *          and `pro: "types-only"` under the flag; a copy of a shared package or any HeroUI Pro code is refused.
 * Boundary: test only; writes a throwaway member in the OS temp directory and calls the hooks directly with a fake
 *           output bundle.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0436; app-shells-edge-and-extension.md 15 (point 8), 16 (point 8).
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { bundlePlugin } from "#core/functions/bundle-plugin.function";

const IMPORT_MAP = {
  imports: { react: "/s/react.js", "react/": "/s/react/", "@stackra/ui": "/s/ui.js" },
};

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-bundle-"));
  writeFileSync(
    join(root, "stackra.manifest.json"),
    JSON.stringify({
      member: "console_ui",
      package: "@mezzora/console-ui",
      version: "1.4.0",
      surfaces: [{ surface: "console", targets: "console@3", shell: "@os/console-shell" }],
    }),
  );
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

/** A fake output chunk. */
function chunk(fileName: string, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    type: "chunk",
    name: fileName.split(".")[0],
    fileName,
    isEntry: false,
    imports: [],
    dynamicImports: [],
    moduleIds: [],
    ...extra,
  };
}

/** Runs the plugin's hooks over `chunks`; returns the config, the emitted files and the errors. */
function run(
  chunks: Record<string, unknown>[],
  options: { proTypesOnly?: boolean; surface?: string } = {},
) {
  const plugin = bundlePlugin({
    surface: options.surface ?? "console",
    importMap: IMPORT_MAP,
    outDir: "dist/bundles",
    ...(options.proTypesOnly === undefined ? {} : { proTypesOnly: options.proTypesOnly }),
  });
  const config = (plugin.config as (config: { root: string }) => { build: { outDir: string } })({
    root,
  });
  const emitted: { fileName: string; source: string }[] = [];
  const errors: string[] = [];
  const context = {
    emitFile: vi.fn((file: { fileName: string; source: string }) => emitted.push(file)),
    error: (message: string) => {
      errors.push(message);
    },
  };
  const bundle = Object.fromEntries(chunks.map((item) => [item["fileName"], item]));
  (plugin.generateBundle as (this: unknown, output: unknown, bundle: unknown) => void).call(
    context,
    {},
    bundle,
  );
  return { config, emitted, errors };
}

const ENTRY = chunk("console.a1.js", {
  isEntry: true,
  name: "console",
  imports: ["chunks/orders.b2.js", "react", "@stackra/ui"],
  dynamicImports: ["chunks/report.c3.js", "react/jsx-runtime"],
  moduleIds: [join("/repo", "src/console.ts")],
  viteMetadata: { importedCss: new Set(["assets/console.d4.css"]) },
});
const ORDERS = chunk("chunks/orders.b2.js", { imports: ["chunks/shared.e5.js"] });
const SHARED = chunk("chunks/shared.e5.js");
const REPORT = chunk("chunks/report.c3.js");

describe("bundlePlugin", () => {
  it("builds into the surface's version folder from the committed manifest", () => {
    expect(run([ENTRY]).config.build.outDir).toBe(join("dist/bundles", "console", "1.4.0"));
  });

  it("fails without a manifest, and for a surface the member does not target", () => {
    rmSync(join(root, "stackra.manifest.json"));
    expect(() => run([ENTRY])).toThrow("run `stackra gen`");
    writeFileSync(
      join(root, "stackra.manifest.json"),
      JSON.stringify({ member: "x", package: "@mezzora/x", version: "1.0.0" }),
    );
    expect(() => run([ENTRY], { surface: "till" })).toThrow("targets no till shell");
  });

  it("writes the bundle manifest with targets, modulepreload, css and shared imports", () => {
    const { emitted, errors } = run([ENTRY, ORDERS, SHARED, REPORT]);
    expect(errors).toEqual([]);
    expect(emitted.map((file) => file.fileName)).toEqual(["bundle.manifest.json"]);
    expect(JSON.parse(emitted[0]?.source ?? "{}")).toEqual({
      package: "@mezzora/console-ui",
      surface: "console",
      targets: "console@3",
      version: "1.4.0",
      entry: "console.a1.js",
      modulepreload: ["console.a1.js", "chunks/orders.b2.js", "chunks/shared.e5.js"],
      css: ["assets/console.d4.css"],
      imports: ["@stackra/ui", "react", "react/jsx-runtime"],
    });
  });

  it("marks a Pro types-only build", () => {
    const { emitted } = run([ENTRY], { proTypesOnly: true });
    expect(JSON.parse(emitted[0]?.source ?? "{}").pro).toBe("types-only");
  });

  it("refuses a copy of a package the import map supplies", () => {
    const copy = chunk("console.a1.js", {
      isEntry: true,
      name: "console",
      moduleIds: ["/repo/node_modules/react/cjs/react.production.js"],
    });
    expect(run([copy]).errors[0]).toContain("its own copy of react");
  });

  it("refuses HeroUI Pro code inside the bundle, flag or not", () => {
    for (const id of [
      "/repo/node_modules/@heroui-pro/react/dist/index.js",
      "/repo/node_modules/.pnpm/x/node_modules/@stackra/ui-pro/dist/index.js",
    ]) {
      const pro = chunk("console.a1.js", { isEntry: true, name: "console", moduleIds: [id] });
      expect(run([pro], { proTypesOnly: true }).errors[0]).toContain("HeroUI Pro code");
    }
  });
});
