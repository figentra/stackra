/**
 * Stackra file contract:
 * Purpose: tests of `readKit` and `runBrandKit` on a kit in a temporary folder with a fake renderer: write mode writes
 *          the files and the asset manifest; `--check` passes on a fresh build, reports drift after a file changes
 *          and reports missing sources without throwing; an invalid kit.json throws InvalidBrandKitError.
 * Boundary: test only; writes under the OS temp folder and removes it.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0441 (as amended).
 */
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { exportThemeJson, STACKRA_THEME } from "@stackra/tokens";

import { InvalidBrandKitError } from "#core/errors/invalid-brand-kit.error";
import { readKit } from "#core/functions/read-kit.function";
import { runBrandKit } from "#core/functions/run-brand-kit.function";
import { ALL_SOURCES } from "#core/functions/__tests__/all-sources.fixture";
import { fakeRender } from "#core/functions/__tests__/fake-render.fixture";

const SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"/>';
const KIT = {
  id: "acme",
  group: "family",
  status: "proposed",
  name: { en: "Acme" },
  line: { en: "One line." },
};

let root = "";

async function put(path: string, text: string) {
  await mkdir(dirname(join(root, path)), { recursive: true });
  await writeFile(join(root, path), text);
}

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "brand-kit-"));
  await put("assets/brand/kit.json", JSON.stringify(KIT));
  for (const path of ALL_SOURCES.filter((source) => source !== "tokens/theme.json"))
    await put(`assets/brand/${path}`, path.endsWith(".svg") ? SVG : "x");
  await put("assets/brand/tokens/theme.json", JSON.stringify(exportThemeJson(STACKRA_THEME)));
  await put(
    "assets/store/staff/en/captions.json",
    JSON.stringify({ captions: [{ screen: "stock", text: "Scan" }] }),
  );
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe("readKit", () => {
  it("reads the kit, its sources and the store", async () => {
    const input = await readKit({ root });
    expect(input.kit.id).toBe("acme");
    expect(input.sources.has("logos/favicon/favicon.svg")).toBe(true);
    expect(input.store).toHaveLength(1);
    expect(input.inputHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("throws on an invalid kit.json", async () => {
    await put("assets/brand/kit.json", JSON.stringify({ ...KIT, id: "Acme" }));
    await expect(readKit({ root })).rejects.toThrow(InvalidBrandKitError);
  });
});

describe("runBrandKit", () => {
  it("writes the outputs and the manifest, then checks clean", async () => {
    const written = await runBrandKit({ root, render: fakeRender });
    const manifest = JSON.parse(
      await readFile(join(root, ".stackra/brand/asset-manifest.json"), "utf8"),
    );
    expect(manifest).toEqual(written.manifest);
    expect(await readFile(join(root, ".stackra/brand/heroui/web.css"), "utf8")).toContain(
      "--accent",
    );
    expect(await runBrandKit({ root, render: fakeRender, check: true })).toMatchObject({
      ok: true,
      issues: [],
    });
  });

  it("reports drift after a source changes", async () => {
    await runBrandKit({ root, render: fakeRender });
    await put(
      "assets/brand/logos/favicon/favicon.svg",
      SVG.replace("/>", '><path d="M0 0h1v1z"/></svg>'),
    );
    const result = await runBrandKit({ root, render: fakeRender, check: true });
    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === "stale_output")).toBe(true);
  });

  it("reports a missing source instead of throwing", async () => {
    await rm(join(root, "assets/brand/logos/splash"), { recursive: true });
    const result = await runBrandKit({ root, render: fakeRender, check: true });
    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: "missing_file", path: "logos/splash/splash-light.svg" }),
    );
  });
});
