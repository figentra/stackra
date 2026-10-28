/**
 * Stackra file contract:
 * Purpose: `BrandKit`, the shape of `<repo>/assets/brand/kit.json`, the one input the generator reads.
 * Boundary: a type in the leaf entry; validating a file against it is the generator's job (stackra-12).
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (as amended: product sources in <repo>/assets/brand); STA-1383 (the one
 *                     `LocalizedText` of @stackra/contracts, English required).
 */
import type { LocalizedText } from "@stackra/contracts";

import type { KitStatus } from "#contracts/enums/kit-status.enum";
import type { BrandKitParent } from "#contracts/types/brand-kit-parent.type";

/**
 * A brand kit file.
 *
 * @example
 * const kit: BrandKit = { id: "product", group: "family", status: KitStatus.Proposed, name: { en: "Product" }, line: { en: "One line." } };
 */
export interface BrandKit {
  /** Kit id, kebab-case. */
  readonly id: string;

  /** Portfolio group (for example `family`). */
  readonly group: string;

  /** The kit's review state. */
  readonly status: KitStatus;

  /** The primary lockup (for example `horizontal`). */
  readonly primary?: string;

  /** The parent kit, for a child kit. */
  readonly parent?: BrandKitParent;

  /** The brand's name, per locale; English is required, Arabic is `[TBD]` in a proposed kit. */
  readonly name: LocalizedText & { readonly en: string };

  /** One line for the portfolio card, per locale; English is required. */
  readonly line: LocalizedText & { readonly en: string };

  /** Whether the kit has a brand hub page. */
  readonly hub?: boolean;

  /** Whether the kit has a `brand-kit:<product>` seed record. */
  readonly seed?: boolean;
}
