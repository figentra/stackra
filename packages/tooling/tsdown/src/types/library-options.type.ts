/**
 * Stackra file contract:
 * Purpose: `LibraryOptions`, the options of `library()`: the legacy-decorator transform flag and extra externals.
 * Boundary: a type only.
 * Runtime: node
 * Governing contract: ADR 0025 (build output); ADR 0005 (legacy decorators).
 */
/** Options accepted by {@link library}. */
export interface LibraryOptions {
  /**
   * Transpile TypeScript experimental (legacy) decorators in the built output. No `design:*` metadata is
   * emitted (ADR-0005): Encore's esbuild bundler cannot emit it, so no code may depend on it.
   *
   * Mechanism (tsdown 0.23 / rolldown): oxc does this natively through rolldown's `transform.decorator` —
   * `legacy` is `experimentalDecorators`. The flags are set explicitly rather than left to tsconfig
   * discovery so a package that passes a custom tsconfig still builds correctly. Pair with
   * `@stackra/typescript-config/decorators`; rolldown then sees the same flags twice and reports an
   * equal-value CONFIGURATION_FIELD_CONFLICT, which is filtered below.
   *
   * @defaultValue `false`
   */
  decorators?: boolean;
  /** Mark packages external even if they are dependencies (rare: peer-provided runtimes). */
  external?: (string | RegExp)[];
}
