/**
 * Stackra file contract:
 * Purpose: `ExtensionBundle`, one surface's extension bundle a product publishes to the OS: the product, the surface,
 *          the shell line it targets, the packages it is built from, the release commit and, for the ops surface,
 *          that it holds declarations only and waits for a second reviewer.
 * Boundary: type only; `publishExtensionBundles` builds it from the root runway and an `ExtensionBundlePublisher`
 *           publishes it. The bundle's files are the build's output; this is their description.
 * Runtime: isomorphic
 * Governing contract: ADR 0436 (decisions 4, 5 and 9), ADR 0109 (manifests published by CI).
 */
import type { SurfaceKind } from "#core/enums/surface-kind.enum";

/** One extension bundle. */
export interface ExtensionBundle {
  /** The product's registry key. */
  readonly product: string;

  /** The surface it extends. */
  readonly surface: SurfaceKind;

  /** The shell line it targets (`os/console@3`); absent for the ops contribution, which joins the OS ops release. */
  readonly targets?: string;

  /** The packages it is built from. */
  readonly packages: readonly string[];

  /** The release commit. */
  readonly sha: string;

  /** True for the ops contribution: declarations only, published after a second reviewer approves. */
  readonly declarationsOnly: boolean;
}
