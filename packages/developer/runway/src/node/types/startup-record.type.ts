/**
 * Stackra file contract:
 * Purpose: `StartupRecord`, the public data the edge writes into a shell page for one host (ADR 0437 decision 3): the
 *          product, surface, region, realm, preset, locales, flags, the shell line and version, and the product bundle
 *          URLs. The same shape as the OS shells' and the edge Worker's copy.
 * Boundary: type only; nothing per user. `previewServe` writes it; the shells read it.
 * Runtime: node
 * Governing contract: ADR 0437 (decision 3).
 */

/** The startup record of one page load. */
export type StartupRecord = {
  /** The product key. */
  readonly product: string;
  /** The surface key. */
  readonly surface: string;
  /** The home region the API calls go to. */
  readonly region?: string;
  /** The sign-in realm. */
  readonly realm?: string;
  /** The shell preset, when the surface runs one. */
  readonly preset?: string;
  /** The default and enabled locales. */
  readonly locales: { readonly default: string; readonly enabled: readonly string[] };
  /** Public flags. */
  readonly flags?: Readonly<Record<string, boolean>>;
  /** The shell line's major and the version serving the page. */
  readonly shell: { readonly major: number; readonly version: string };
  /** The product bundle entry URLs, loaded in order. */
  readonly bundles: readonly string[];
};
