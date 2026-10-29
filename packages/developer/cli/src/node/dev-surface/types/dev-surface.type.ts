/**
 * Stackra file contract:
 * Purpose: `DevSurface`, the descriptor `stackra dev --surface` writes to `.stackra/surfaces/<surface>/dev-surface.json`
 *          before it starts Vite: which shell to load (a published version or a local checkout's dev server), the
 *          product packages, and the local API. The surface's Vite config (gen bundle mode, stackra-04) reads it to
 *          write the dev page's import map: the shell entry and shared dependencies from `shell.url`, the product
 *          bundle from Vite itself with hot reload.
 *          With a local checkout (`--os`) the descriptor also names the product, its root, each package's entry file for
 *          the surface, and a landing site's seed document: the shell's own dev server (`STACKRA_DEV_SURFACE`) then
 *          serves the packages from source through its import map's single copies (figentra/os `shellDev`).
 * Boundary: type only; JSON-safe values. It is the hand-off contract between the CLI and the bundle-mode Vite config,
 *           or the local shell.
 * Runtime: node
 * Governing contract: ADR 0436 (decisions 4 and 6); app-shells section 15 point 2.
 */

/** The dev descriptor of one surface. */
export type DevSurface = {
  /** The surface key in the root runway (`console`). */
  readonly surface: string;

  /** The shell the page loads. */
  readonly shell: {
    /** The runway reference (`os/console@3`). */
    readonly ref: string;

    /** The base URL the shell entry and its import map are loaded from, ending in `/`. */
    readonly url: string;

    /** True when the shell is a local checkout's dev server, false when it is a published version. */
    readonly local: boolean;
  };

  /** The product packages the bundle holds. */
  readonly packages: readonly string[];

  /** The API base URL the page calls (the local gateway unless `--api` says otherwise). */
  readonly api: string;

  /** The product key; set for a local shell. */
  readonly product?: string;

  /** The product root (absolute); set for a local shell. */
  readonly root?: string;

  /** Each package's entry file for the surface (absolute), in runway order; set for a local shell. */
  readonly entries?: readonly string[];

  /** A landing site's seed page document (absolute JSON file), from `content`; set for a local shell. */
  readonly document?: string;
};
