/**
 * Stackra file contract:
 * Purpose: `validateTheme(theme, blocks)`, every problem of a theme's sections: each section validated as a
 *          theme-section document, its problems' paths prefixed with `<section>:`.
 * Boundary: pure; never throws on the theme. Sections in code-unit order of their keys. The settings are not checked
 *           here: their schema is the theme's own.
 * Runtime: isomorphic
 * Governing contract: ADR 0110 (decision 4); ADR 0270 (decisions 1 and 6).
 */
import { ExperienceKind } from "#contracts/enums/experience-kind.enum";
import type { DocumentProblem } from "#contracts/types/document-problem.type";
import { validateDocument } from "#core/functions/validate-document.function";
import type { BlockClass } from "#core/types/block-class.type";
import type { Theme } from "#core/types/theme.type";

/**
 * Every problem of `theme`'s sections.
 *
 * @example
 * validateTheme(draft, blocks); // [{ path: "header:0", code: "kind_not_allowed", block: "web.hero_section" }]
 */
export function validateTheme(
  theme: Theme,
  blocks: ReadonlyMap<string, BlockClass>,
): DocumentProblem[] {
  return Object.keys(theme.sections)
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
    .flatMap((section) =>
      validateDocument(theme.sections[section], { kind: ExperienceKind.ThemeSection, blocks }).map(
        (problem) => ({ ...problem, path: `${section}:${problem.path}` }),
      ),
    );
}
