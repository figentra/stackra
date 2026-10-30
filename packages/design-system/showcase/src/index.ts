/**
 * Stackra file contract:
 * Purpose: the `.` entry of @stackra/showcase: the enums, types, schemas, the registry (`COMPONENTS`, `CATEGORIES`)
 *          and its pure functions. Lang catalogues are `@stackra/showcase/assets/lang/<locale>/showcase.json`.
 * Boundary: a stand-in barrel until gen writes the entry barrels (ADR 0294 decision 15, STA-339); no React.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.
 */
export * from "#src/enums/category-glyph-name.enum";
export * from "#src/enums/component-category.enum";
export * from "#src/enums/component-section.enum";
export * from "#src/enums/component-status.enum";
export * from "#src/enums/component-tier.enum";
export * from "#src/enums/doc-tab.enum";
export * from "#src/enums/haptic-style.enum";
export * from "#src/enums/platform.enum";
export type * from "#src/types/api-doc.type";
export type * from "#src/types/api-hook.type";
export type * from "#src/types/api-part.type";
export type * from "#src/types/api-prop.type";
export type * from "#src/types/api-slot.type";
export type * from "#src/types/category-entry.type";
export type * from "#src/types/code-span.type";
export type * from "#src/types/component-doc.type";
export type * from "#src/types/component-entry.type";
export type * from "#src/types/llms-txt-input.type";
export type * from "#src/types/example-entry.type";
export type * from "#src/types/haptic-entry.type";
export type * from "#src/types/hero-entry.type";
export type * from "#src/types/hero-link.type";
export type * from "#src/types/keyboard-row.type";
export type * from "#src/types/knob.type";
export type * from "#src/types/mobile-component-params.type";
export type * from "#src/types/pick-hero-input.type";
export type * from "#src/types/registry-check-input.type";
export type * from "#src/types/registry-report.type";
export type * from "#src/types/search-doc.type";
export type * from "#src/types/search-hit.type";
export * from "#src/schemas/api-doc.schema";
export * from "#src/schemas/component-entry.schema";
export * from "#src/schemas/search-doc.schema";
export * from "#src/registry/by-category.function";
export * from "#src/registry/by-slug.function";
export * from "#src/registry/by-web-path.function";
export * from "#src/registry/categories.constant";
export * from "#src/registry/category-from-segment.function";
export * from "#src/registry/category-doc-fields.constant";
export * from "#src/registry/category-doc-keys.function";
export * from "#src/registry/category-keys.function";
export * from "#src/registry/category-path.function";
export * from "#src/registry/check-registry.function";
export * from "#src/registry/code-spans.function";
export * from "#src/registry/compare-entries.function";
export * from "#src/registry/component-docs.constant";
export * from "#src/registry/component-keys.function";
export * from "#src/registry/components.generated";
export * from "#src/registry/doc-fields.constant";
export * from "#src/registry/doc-keys.function";
export * from "#src/registry/entry-key.function";
export * from "#src/registry/import-line.function";
export * from "#src/registry/lang-segment.function";
export * from "#src/registry/llms-txt.function";
export * from "#src/registry/localize-api-doc.function";
export * from "#src/registry/lookup-message.function";
export * from "#src/registry/match-entries.function";
export * from "#src/registry/mobile-route.function";
export * from "#src/registry/neighbours.function";
export * from "#src/registry/pick-hero.function";
export * from "#src/registry/section-key.function";
export * from "#src/registry/suggest-url.function";
export * from "#src/registry/token-css-var.function";
export * from "#src/registry/web-path.function";
