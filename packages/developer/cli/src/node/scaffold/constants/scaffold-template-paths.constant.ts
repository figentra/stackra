/**
 * Stackra file contract:
 * Purpose: `SCAFFOLD_TEMPLATE_PATHS`, where the scaffold templates live: `tools/scaffold/templates` in a repository
 *          that authors them (core, or a product that keeps its own), and the copy the build ships inside
 *          `@stackra/cli` (`dist/scaffold-templates`), so the template kinds of `stackra new` render in an app made by
 *          `stackra create` too. `tsdown.config.ts` copies to the shipped path; `scaffoldTemplates` reads both.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0126 (member shapes and scaffold templates); ADR 0282 (decision 3: `new` is published);
 *                     ADR 0515 (a created app is a product repository).
 */

/** The template folder paths: in a repository (from its root) and in the published CLI (from its package root). */
export const SCAFFOLD_TEMPLATE_PATHS = Object.freeze({
  /** The authored templates, relative to a workspace root. */
  repository: "tools/scaffold/templates",
  /** The copy the build ships, relative to the `@stackra/cli` package root (inside `files`' `dist`). */
  shipped: "dist/scaffold-templates",
});
