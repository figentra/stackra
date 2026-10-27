/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/brand-kit (the kit file, the generator options, the
 *          output kinds, the asset manifest and the check result), until `stackra gen` writes the entry barrels
 *          (STA-339).
 * Boundary: names each re-export and declares nothing; every file here is a leaf.
 * Runtime: isomorphic
 * Governing contract: ADR 0117 (decision 2); ADR 0294 (decision 15); ADR 0441 (as amended).
 */
export { BrandOutput } from "#contracts/enums/brand-output.enum";
export { Endorsement } from "#contracts/enums/endorsement.enum";
export { KitStatus } from "#contracts/enums/kit-status.enum";
export type { AssetManifest } from "#contracts/types/asset-manifest.type";
export type { AssetManifestEntry } from "#contracts/types/asset-manifest-entry.type";
export type { BrandCheckIssue } from "#contracts/types/brand-check-issue.type";
export type { BrandCheckResult } from "#contracts/types/brand-check-result.type";
export type { BrandKit } from "#contracts/types/brand-kit.type";
export type { BrandKitOptions } from "#contracts/types/brand-kit-options.type";
export type { BrandKitParent } from "#contracts/types/brand-kit-parent.type";
export type { BrandKitRunOptions } from "#contracts/types/brand-kit-run-options.type";
export type { GeneratedFile } from "#contracts/types/generated-file.type";
export type { KitInput } from "#contracts/types/kit-input.type";
export type { LocalizedText } from "#contracts/types/localized-text.type";
export type { StoreCaption } from "#contracts/types/store-caption.type";
export type { StoreCaptionSet } from "#contracts/types/store-caption-set.type";
export type { SvgRenderer } from "#contracts/types/svg-renderer.type";
