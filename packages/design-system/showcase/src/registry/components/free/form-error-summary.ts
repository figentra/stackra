/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/form-error-summary` (Form error summary).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (component wave B: data and dashboards).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Form error summary. */
export const FREE_FORM_ERROR_SUMMARY: ComponentEntry = {
  slug: "form-error-summary",
  tier: "free",
  category: "inputs_and_forms",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "FormErrorSummary",
  parts: ["FormErrorSummary"],
  hero: {},
  examples: [{ id: "checkout", card: true }],
  related: ["free/form", "free/alert", "free/text-field"],
  tokens: ["color.danger", "color.danger-soft", "radius.lg"],
  keywords: ["error summary", "validation", "form errors", "accessibility", "focus"],
  status: "new",
};
