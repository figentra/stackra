/**
 * Stackra file contract:
 * Purpose: who applies a service's migrations, the `migrations.runner` of `defineService`.
 * Boundary: an `Enum.of` value plus the type of the same name; a build fact read by gen and the release from
 *           `stackra.config.ts`, never by running code. It lives here, not in a runtime package, so every member can
 *           write a typed `stackra.config.ts` without a dependency cycle.
 * Runtime: isomorphic
 * Governing contract: ADR 0159 (2026-10-24 note: `stackra db migrate` is the release step everywhere), ADR 0295
 *                     (decision 4.1), ADR 0127 2026-10-24 note (MigrationRunner lives in contracts).
 */
import { Enum } from "#core/bases/enum.base";

/**
 * `Auto` is the only runner ADR 0159 allows today: the release runs `stackra db migrate`, forward only, before the new
 * code starts, in every environment. A second runner needs an ADR first.
 */
export const MigrationRunner = Enum.of({
  /** The release applies gen's ordered SQL with `stackra db migrate` before the code starts. */
  Auto: "auto",
});

/** One of the codes above. */
export type MigrationRunner = Enum.Value<typeof MigrationRunner>;
