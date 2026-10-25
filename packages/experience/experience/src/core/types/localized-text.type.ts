/**
 * Stackra file contract:
 * Purpose: `LocalizedText`, the type of a block prop a scope's editor writes once per locale
 *          (`title!: LocalizedText`): one string per BCP 47 locale tag, stored in the document as that map.
 * Boundary: a type only. In a block's props a string-keyed map of strings is read as `LocalizedText`: the renderer
 *           hands the component the visitor's string (the exact tag, else its language, else the first locale
 *           stored), and `BlockProps` types the prop `string`. Gen compiles it as a record of strings.
 * Runtime: isomorphic
 * Governing contract: ADR 0110 (decision 1: validated props); ADR 0114 (decision 2: pages are documents with i18n);
 *                     ADR 0162 (decision 2: the per-locale fallback chain); ADR 0305 (lang conventions: BCP 47 case).
 */

/**
 * Text per locale.
 *
 * @example
 * export class CtaBannerBlock extends Block({ category: BlockCategory.Marketing, icon: Icons.Megaphone }) {
 *   title!: LocalizedText; // { en: "Start today", ar: "ابدأ اليوم" }
 * }
 */
export type LocalizedText = Readonly<Record<string, string>>;
