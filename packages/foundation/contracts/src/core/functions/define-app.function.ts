/**
 * Stackra file contract:
 * Purpose: `defineApp`, the one call in an app member's `stackra.config.ts`.
 * Boundary: a typed identity function with no runtime effect: gen reads the argument from the syntax tree without
 *           running it, and the type makes a wrong option a type error in the editor.
 * Runtime: isomorphic
 * Governing contract: ADR 0295 (decisions 1 and 2), ADR 0305 (rule 3: `define` is reserved for these four), ADR 0127
 *                     2026-10-24 note (define* live in contracts).
 */
import type { AppDefinition } from "#core/types/app-definition.type";

/**
 * Declares an app member.
 *
 * @example
 * export default defineApp({ targets: [Target.Ios, Target.Android], area: ApiArea.App, env: EnvConfig });
 */
export function defineApp(definition: AppDefinition): AppDefinition {
  return definition;
}
