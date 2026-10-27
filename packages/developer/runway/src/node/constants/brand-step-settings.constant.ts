/**
 * Stackra file contract:
 * Purpose: `BRAND_STEP_SETTINGS`, the data Runway's brand step runs @stackra/brand-kit with: the command, the output
 *          folder every run writes under, the asset manifest's file name, and the `BrandOutput` codes each kind of run
 *          builds (a web surface, a mobile app, a scope's white-label app).
 * Boundary: data only; `runBrandStep` and `committedBrandOutputs` read it, a request overrides the command. Output codes
 *           are @stackra/brand-kit's `BrandOutput` values as strings (runway takes no dependency on the kit; it runs
 *           its binary), so the kit's own argument parser refuses an unknown code. `manifestFile` matches the kit's
 *           `BRAND_DEFAULTS.manifestFile`.
 * Runtime: node
 * Governing contract: ADR 0441 (as amended: D17, the brand kit runs in CI as a Runway step, outputs never committed);
 *                     app-shells section 14 (white-label icons and splash from the scope's theme).
 */

/** How the brand step runs the kit, and which outputs each kind of run builds. */
export const BRAND_STEP_SETTINGS = Object.freeze({
  /** The kit's binary (`bin` of @stackra/brand-kit), found on the CI job's PATH. */
  command: "stackra-brand-kit",
  /** Every run writes under this folder (git-ignored, never committed): `web/<surface>`, `mobile/<app>`, `scopes/<scope>/<app>`. */
  outDir: ".stackra/brand",
  /** The asset manifest a write run leaves in its output folder. */
  manifestFile: "asset-manifest.json",
  /** `BrandOutput` codes per kind of run. */
  outputs: Object.freeze({
    web: Object.freeze(["tokens", "heroui_css", "favicon", "web_manifest"]),
    mobile: Object.freeze(["tokens", "app_icon", "adaptive_icon", "splash", "store_frame"]),
    whiteLabel: Object.freeze(["app_icon", "adaptive_icon", "splash"]),
  }),
} as const);
