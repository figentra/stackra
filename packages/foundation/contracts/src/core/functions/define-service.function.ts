/**
 * Stackra file contract:
 * Purpose: `defineService`, the one call in a service member's `stackra.config.ts`.
 * Boundary: a typed identity function with no runtime effect: gen reads the argument from the syntax tree without
 *           running it, and the type makes a wrong option a type error in the editor.
 * Runtime: isomorphic
 * Governing contract: ADR 0295 (decision 1), ADR 0305 (rule 3), ADR 0127 2026-10-24 note (define* live in contracts).
 */
import type { ServiceDefinition } from "#core/types/service-definition.type";

/**
 * Declares a service member.
 *
 * @example
 * export default defineService({ area: ApiArea.App, migrations: { runner: MigrationRunner.Auto } });
 */
export function defineService(definition: ServiceDefinition): ServiceDefinition {
  return definition;
}
