/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/task-tray` (TaskTray).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (owner request 2026-10-29).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The TaskTray entry of the component registry. */
export const FREE_TASK_TRAY: ComponentEntry = {
  slug: "task-tray",
  tier: "free",
  category: "feedback_and_status",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "TaskTray",
  parts: ["TaskTray"],
  hero: {},
  examples: [{ id: "live", card: true }, { id: "states" }, { id: "rtl", platforms: ["react"] }],
  related: ["free/toast", "free/progress-bar", "free/export-dialog"],
  tokens: ["color.overlay", "color.accent", "color.danger", "shadow.overlay"],
  keywords: ["task tray", "background tasks", "uploads", "exports", "imports", "progress", "jobs"],
  status: "new",
};
