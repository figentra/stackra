/**
 * Stackra file contract:
 * Purpose: `ClassComponentsPlugin`, the shape of the plugin `classComponents()` returns: the part of Vite's (and
 *          Rolldown's) plugin interface it implements, so a Vite config accepts it without gen depending on Vite.
 * Boundary: a type only; structurally assignable to Vite's `Plugin`.
 * Runtime: node
 * Governing contract: ADR 0305 (rule 40: Vite integration); registry v3.1 A14.
 */

/** A Vite plugin that transforms source files. */
export interface ClassComponentsPlugin {
  /** The plugin name in Vite's logs. */
  readonly name: string;

  /** Runs before the core plugins, while the source is still TypeScript. */
  readonly enforce: "pre";

  /**
   * Compiles one module.
   * @returns the compiled code and its source map, or null to leave the module as it is.
   */
  transform: (code: string, id: string) => Promise<{ code: string; map: unknown } | null>;
}
