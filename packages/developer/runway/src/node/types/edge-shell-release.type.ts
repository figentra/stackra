/**
 * Stackra file contract:
 * Purpose: `EdgeShellRelease`, one release of a web shell line as the edge serves it: the version, the entry URL and
 *          the import map the shell gives every product bundle.
 * Boundary: type only; the OS deploy builds it, `publishShell` and `promoteCanary` write it.
 * Runtime: node
 * Governing contract: ADR 0436 (decision 4: the import map); app-shells 4.1 (step 4) and 5.3.
 */

/** A shell release. */
export type EdgeShellRelease = {
  /** The shell version. */
  readonly version: string;
  /** The shell entry's URL. */
  readonly entry: string;
  /** The import map the shell serves to bundles. */
  readonly importMap: { readonly imports: Readonly<Record<string, string>> };
};
