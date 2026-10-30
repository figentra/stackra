/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/attachment-card` (AttachmentCard).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave C, owner approval 2026-10-29).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The AttachmentCard entry of the component registry. */
export const FREE_ATTACHMENT_CARD: ComponentEntry = {
  slug: "attachment-card",
  tier: "free",
  category: "data_display",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "AttachmentCard",
  parts: ["AttachmentCard"],
  hero: {},
  examples: [{ id: "basics", card: true }, { id: "upload-states" }],
  related: ["free/drop-zone", "free/file-trigger", "free/thumbnail"],
  tokens: ["color.border", "color.danger", "radius.surface"],
  keywords: ["attachment", "file", "upload", "download", "document", "pdf"],
  status: "new",
};
