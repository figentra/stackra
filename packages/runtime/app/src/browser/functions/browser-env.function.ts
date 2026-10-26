/**
 * Stackra file contract:
 * Purpose: `browserEnv`, the raw environment a browser bundle's configuration classes read: the build's
 *          `import.meta.env`, which holds only the public (`VITE_`) variables the bundler inlined.
 * Boundary: reads the build's env object as it is; an unbundled run (a test) has none and gets `{}`. Not exported.
 *           The expression stays the literal `import.meta.env`, which is what bundlers and vitest replace.
 * Runtime: browser
 * Governing contract: ADR 0295 (decisions 2 and 4); ADR 0231 (decision 4: public prefixes).
 */

declare global {
  // The same shape `vite/client` declares, so an app's merge with it stays valid.
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
  interface ImportMetaEnv {}
}

/**
 * The bundler's env object, or `{}`.
 *
 * @example
 * await bootApp(wiring, { env: browserEnv() });
 */
export function browserEnv(): Readonly<Record<string, unknown>> {
  return { ...import.meta.env };
}
