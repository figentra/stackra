/**
 * Stackra file contract:
 * Purpose: `PublishedBundle`, what an `ExtensionBundlePublisher` answers: the bundle's product and surface, the
 *          version the registry gave it and the URL its files are served from.
 * Boundary: type only. The release pointer moves later, by the edge projector from the registry's release event.
 * Runtime: isomorphic
 * Governing contract: ADR 0436 (decision 4), ADR 0437 (decision 6: `release:` rows).
 */
import type { SurfaceKind } from "#core/enums/surface-kind.enum";

/** One published bundle. */
export interface PublishedBundle {
  /** The product's registry key. */
  readonly product: string;

  /** The surface. */
  readonly surface: SurfaceKind;

  /** The bundle version the registry recorded. */
  readonly version: string;

  /** Where the bundle's entry is served from. */
  readonly url: string;
}
