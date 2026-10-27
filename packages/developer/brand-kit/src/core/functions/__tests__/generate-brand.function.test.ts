/**
 * Stackra file contract:
 * Purpose: unit tests of `generateBrand` with a fake renderer: every output's files, sorted and unique; the same
 *          input gives the same bytes; a missing source throws; the web manifest and the adaptive settings read the
 *          kit and the theme.
 * Boundary: test only; no resvg.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0441 (as amended: deterministic output).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { BrandOutput } from "#contracts/enums/brand-output.enum";
import { InvalidBrandKitError } from "#core/errors/invalid-brand-kit.error";
import { assetManifestOf } from "#core/functions/asset-manifest-of.function";
import { generateBrand } from "#core/functions/generate-brand.function";
import { fakeRender } from "#core/functions/__tests__/fake-render.fixture";
import { kitInput } from "#core/functions/__tests__/kit-input.fixture";

describe("generateBrand", () => {
  it("writes every output, sorted and unique", async () => {
    const files = await generateBrand(kitInput(), Enum.values(BrandOutput), fakeRender);
    const paths = files.map((file) => file.path);
    expect(paths).toEqual([...new Set(paths)].sort());
    expect(new Set(files.map((file) => file.output))).toEqual(new Set(Enum.values(BrandOutput)));
    expect(paths).toContain("heroui/web.css");
    expect(paths).toContain("favicon/favicon.ico");
    expect(paths).toContain("store/staff/en/ios_phone/01-stock.png");
    expect(paths).not.toContain("icons/ios/app-icon-dark-1024.png");
  });

  it("is deterministic", async () => {
    const input = kitInput();
    const one = assetManifestOf(
      input,
      await generateBrand(input, Enum.values(BrandOutput), fakeRender),
    );
    const two = assetManifestOf(
      input,
      await generateBrand(input, Enum.values(BrandOutput), fakeRender),
    );
    expect(two).toEqual(one);
  });

  it("throws when a source is missing", async () => {
    await expect(
      generateBrand(kitInput(["tokens/theme.json"]), [BrandOutput.Splash], fakeRender),
    ).rejects.toThrow(InvalidBrandKitError);
  });

  it("names the web manifest after the kit and colours it from the theme", async () => {
    const input = kitInput();
    const files = await generateBrand(input, [BrandOutput.WebManifest], fakeRender);
    const manifest = files.find((file) => file.path === "web/manifest.webmanifest");
    const value = JSON.parse(new TextDecoder().decode(manifest?.bytes));
    expect(value.name).toBe("Acme");
    expect(value.theme_color).toBe(input.theme.colors.accent.hexLight);
    expect(value.icons.map((icon: { src: string }) => icon.src)).toEqual([
      "icon-192.png",
      "icon-512.png",
    ]);
  });
});
