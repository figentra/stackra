/**
 * Stackra file contract:
 * Purpose: `markMemberSchemasLoaded`, which records that a member root's generated schemas are already registered, so
 *          `loadMemberSchemas` (and the testing module's `compile()`, which calls it) imports nothing more for it.
 * Boundary: a member's generated Vitest setup imports its schemas files statically, through Vite, then calls this
 *           (STA-2032). Without it, `compile()` would import the same files again from this package, which in a
 *           consumer's node_modules Vitest leaves to Node's loader: no `#` target fallback and no legacy decorators.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0294 (decision 26: the shape compiler); STA-2032.
 */
import { LOADED_SCHEMAS } from "#testing/constants/loaded-schemas.constant";

/**
 * Marks the schemas of the member at `root` (the working directory by default) as loaded.
 *
 * @example
 * import "./gen/schemas/orders.ts";
 * markMemberSchemasLoaded(); // in the generated setup, after the static imports
 */
export function markMemberSchemasLoaded(root: string = process.cwd()): void {
  LOADED_SCHEMAS.set(root, Promise.resolve());
}
