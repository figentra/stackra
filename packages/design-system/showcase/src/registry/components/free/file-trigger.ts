/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/file-trigger` (File trigger), with its `UploadList` companion.
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; design-system gap inventory row 6.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** File trigger. */
export const FREE_FILE_TRIGGER: ComponentEntry = {
  slug: "file-trigger",
  tier: "free",
  category: "inputs_and_forms",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "FileTrigger",
  parts: ["FileTrigger", "UploadList"],
  // HeroUI has no file trigger; the web one is React Aria's, the native one Expo's pickers.
  hero: {},
  examples: [
    { id: "sources", card: true },
    { id: "upload-states" },
    { id: "arabic-files" },
    { id: "live" },
  ],
  related: ["free/thumbnail", "free/progress-circle", "free/form-field"],
  tokens: ["color.field", "radius.field", "color.focus"],
  haptics: [
    { event: "press", style: "impact" },
    { event: "done", style: "success" },
  ],
  keywords: ["upload", "file", "camera", "photo", "attachment", "progress"],
};
