/**
 * Stackra file contract:
 * Purpose: `ScopeRegistryConfig`, what the package manager's effective config says about one npm scope: the
 *          `<scope>:registry` value, if any, and the default `registry` an unmapped scope falls back to.
 * Boundary: type only; registry URLs, never an auth value.
 * Runtime: node
 * Governing contract: ADR 0453 (decision 10).
 */

/** The effective registry settings for one scope. */
export type ScopeRegistryConfig = {
  /** The `<scope>:registry` value, or undefined when the scope is not mapped. */
  readonly scoped: string | undefined;

  /** The default `registry`, which an unmapped scope resolves from. */
  readonly registry: string | undefined;
};
