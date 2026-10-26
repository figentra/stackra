/**
 * Stackra file contract:
 * Purpose: `APP_GROUPS`, the groups of an app's `src/` (ADR 0294 decision 14).
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 14); ADR 0324 (route error boundaries).
 */
import { structureGroups } from "#node/functions/structure-groups.function";

/** The groups of an app's `src/` (ADR 0294 decision 14). */
export const APP_GROUPS = structureGroups(
  [
    ["", ["module"], "`<key>.module.ts`"],
    ["config", ["config"], "config classes, including `desktop.config.ts` and `chrome.config.ts`"],
    ["panels", ["panel"], "app areas"],
    ["menus", ["menu"], "navigation data"],
    ["shortcuts", ["shortcut"], "palette and key entries"],
    ["documents", ["document"], "document kinds"],
    ["stores", ["store"], "client state classes"],
    ["flags", ["flag"], "release switches"],
    ["analytics", ["analytics-event"], "analytics events"],
    ["bridges", ["bridge"], "desktop bridges"],
    [
      "routes/<name>",
      ["route", "layout", "error", "fallback", "server"],
      "a route or layout class, its page `<name>.tsx`, `use-<name>.ts` and `__tests__/`",
    ],
    [
      "routes",
      ["error"],
      "`.error.tsx` directly under `routes/`, the default for routes with no nearer boundary",
      "0324",
    ],
    [
      "blocks/<name>",
      ["block", "native"],
      "`<name>.block.ts`, its renderer `<name>.tsx`, an optional native renderer `<name>.native.tsx` and `__tests__/`",
    ],
    [
      "components/<name>",
      [],
      "`<name>.tsx`, `index.ts` (the component and its Props) and `__tests__/`",
    ],
    ["hooks", [], "`use-<name>.ts` with two or more importers"],
    ["overrides/<owner>", ["override"], "block and widget overrides"],
    ["providers/<name>", [], "only for the `Module({ wrap })` escape hatch"],
    ["enums", ["enum"], "`Enum.of` enums"],
    ["types", ["type"], "shared types"],
    ["styles", [], "stylesheets (`.css`)"],
  ],
  "0294 d14",
);
