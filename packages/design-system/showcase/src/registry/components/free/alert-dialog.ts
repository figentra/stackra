/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/alert-dialog` (Alert dialog).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Alert dialog entry of the component registry. */
export const FREE_ALERT_DIALOG: ComponentEntry = {
  slug: "alert-dialog",
  tier: "free",
  category: "overlays",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "AlertDialog",
  parts: ["AlertDialog"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "alert-dialog",
      docsUrl: "https://www.heroui.com/docs/react/components/alert-dialog",
      sourceUrl:
        "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/alert-dialog",
      racUrl: "https://react-spectrum.adobe.com/react-aria/AlertDialog.html",
    },
    native: {
      pkg: "heroui-native",
      slug: "dialog",
      docsUrl: "https://www.heroui.com/docs/native/components/dialog",
      sourceUrl: "https://github.com/heroui-inc/heroui-native/tree/main/src/components/dialog",
    },
  },
  examples: [
    { id: "tones", platforms: ["react"], card: true },
    { id: "icons" },
    { id: "dismissal", platforms: ["react"] },
    { id: "answer", platforms: ["react"] },
    { id: "basics", platforms: ["native"] },
    { id: "danger", platforms: ["native"] },
    { id: "dismissable", platforms: ["native"] },
    { id: "typed", platforms: ["native"] },
    { id: "live", platforms: ["native"] },
  ],
  related: ["free/action-menu", "free/drawer", "free/leave-confirmation"],
  tokens: ["color.overlay", "radius.base", "shadow.overlay"],
  haptics: [{ event: "open", style: "impact" }],
  keywords: ["confirm", "dialog", "destructive", "prompt"],
};
