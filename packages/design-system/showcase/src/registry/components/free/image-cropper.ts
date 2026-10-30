/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/image-cropper` (ImageCropper).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave C: content and media).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The ImageCropper entry of the component registry. */
export const FREE_IMAGE_CROPPER: ComponentEntry = {
  slug: "image-cropper",
  tier: "free",
  category: "inputs_and_forms",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "ImageCropper",
  parts: ["ImageCropper"],
  hero: {},
  examples: [
    { id: "avatar", card: true },
    { id: "cover", platforms: ["react"] },
  ],
  related: ["free/drop-zone", "free/thumbnail", "free/slider"],
  tokens: ["color.default", "radius.control"],
  keywords: ["crop", "cropper", "avatar", "image", "photo", "zoom", "profile picture"],
  status: "new",
};
