/**
 * Stackra file contract:
 * Purpose: `runBrandKit`, one generator run. Write mode builds every selected output into the output folder, removes
 *          files an earlier manifest listed that this run no longer makes, and writes the asset manifest. `--check`
 *          writes nothing: it runs the kit file checklist, builds twice and compares hashes (determinism), and
 *          compares against the manifest already in the output folder, when there is one (drift).
 * Boundary: the only function that writes; it writes only under `outDir`, and removes only paths its own earlier
 *           manifest listed.
 * Runtime: node
 * Governing contract: ADR 0441 (as amended: the brand kit runs in CI, generated files are never committed).
 */
import { Enum } from "@stackra/contracts";

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

import { BrandOutput } from "#contracts/enums/brand-output.enum";
import type { AssetManifest } from "#contracts/types/asset-manifest.type";
import type { BrandCheckIssue } from "#contracts/types/brand-check-issue.type";
import type { BrandCheckResult } from "#contracts/types/brand-check-result.type";
import type { BrandKitRunOptions } from "#contracts/types/brand-kit-run-options.type";
import { BRAND_DEFAULTS } from "#core/constants/brand-defaults.constant";
import { assetManifestOf } from "#core/functions/asset-manifest-of.function";
import { checkKitFiles } from "#core/functions/check-kit-files.function";
import { createResvgRenderer } from "#core/functions/create-resvg-renderer.function";
import { generateBrand } from "#core/functions/generate-brand.function";
import { missingSources } from "#core/functions/missing-sources.function";
import { readKit } from "#core/functions/read-kit.function";

/** The paths whose hash differs between two manifests, or that only one lists. */
function differing(one: AssetManifest, two: AssetManifest): string[] {
  const hashes = new Map(one.files.map((file) => [file.path, file.sha256]));
  const out = new Set<string>();
  for (const file of two.files) if (hashes.get(file.path) !== file.sha256) out.add(file.path);
  const paths = new Set(two.files.map((file) => file.path));
  for (const file of one.files) if (!paths.has(file.path)) out.add(file.path);
  return [...out].sort();
}

/** The manifest an earlier run left in `outDir`, if any. */
async function previousManifest(outDir: string): Promise<AssetManifest | undefined> {
  try {
    return JSON.parse(
      await readFile(join(outDir, BRAND_DEFAULTS.manifestFile), "utf8"),
    ) as AssetManifest;
  } catch {
    return undefined;
  }
}

/**
 * Builds (or checks) the brand outputs of one kit.
 *
 * @example
 * const result = await runBrandKit({ root: ".", check: true });
 * if (!result.ok) process.exitCode = 1;
 * @throws InvalidBrandKitError when the kit cannot be read, or (write mode) an output's source is missing.
 */
export async function runBrandKit(options: BrandKitRunOptions = {}): Promise<BrandCheckResult> {
  const root = resolve(options.root ?? ".");
  const outDir = join(root, options.outDir ?? BRAND_DEFAULTS.outDir);
  const input = await readKit(options);
  const outputs = options.outputs ?? Enum.values(BrandOutput);
  const render = options.render ?? (await createResvgRenderer(input.fonts));

  if (!options.check) {
    const files = await generateBrand(input, outputs, render);
    const manifest = assetManifestOf(input, files);
    const previous = await previousManifest(outDir);
    const kept = new Set(files.map((file) => file.path));
    for (const old of previous?.files ?? [])
      if (!kept.has(old.path) && !old.path.split("/").includes(".."))
        await rm(join(outDir, old.path), { force: true });
    for (const file of files) {
      await mkdir(dirname(join(outDir, file.path)), { recursive: true });
      await writeFile(join(outDir, file.path), file.bytes);
    }
    await writeFile(
      join(outDir, BRAND_DEFAULTS.manifestFile),
      `${JSON.stringify(manifest, null, 2)}\n`,
    );
    return { ok: true, issues: [], manifest };
  }

  const issues: BrandCheckIssue[] = checkKitFiles(input, outputs);
  const ready = outputs.filter((output) => missingSources(input, output).length === 0);
  const manifest = assetManifestOf(input, await generateBrand(input, ready, render));
  const again = assetManifestOf(input, await generateBrand(input, ready, render));
  for (const path of differing(manifest, again))
    issues.push({
      code: "not_deterministic",
      path,
      message: "two builds from the same kit gave different bytes",
    });
  const previous = await previousManifest(outDir);
  if (previous)
    for (const path of differing(previous, manifest))
      issues.push({
        code: "stale_output",
        path,
        message: "the output folder differs from a fresh build; rebuild",
      });
  return { ok: issues.length === 0, issues, manifest };
}
