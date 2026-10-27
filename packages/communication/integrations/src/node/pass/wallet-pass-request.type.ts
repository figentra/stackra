/**
 * Stackra file contract:
 * Purpose: `WalletPassRequest`, one pass to issue: the pass kind's key, the content its `Pass` kind built, the shown
 *          text of the label keys it used, the locale, the issue time and the brand-kit images.
 * Boundary: a type only. `labels` maps a lang key (`loyalty_kit::passes.loyalty_card.points`) to its text in `locale`;
 *           the host reads it from the owning package's lang files, so a pass kind holds keys, never wording. A label
 *           or value with no entry is shown as written. `issuedAt` is the clock reading of the caller. The images are
 *           the tenant's brand kit, read by the host, never files of this package.
 * Runtime: isomorphic
 * Governing contract: ADR 0348 (decision 5); ADR 0231 (`<module>::<path>` keys).
 */
import type { PassContent } from "#core/types/pass-content.type";

/** One pass to issue. */
export interface WalletPassRequest {
  /** The pass kind's key (`loyalty_card`), which picks the provider's style or class. */
  readonly kind: string;

  /** What the kind built from the owning record. */
  readonly content: PassContent;

  /** Lang key to shown text, in `locale`. */
  readonly labels?: Readonly<Record<string, string>>;

  /** The BCP 47 locale of the shown text (`en`, `ar`). */
  readonly locale: string;

  /** When the pass is issued: the signing time of an Apple pass, the `iat` of a Google save link. */
  readonly issuedAt: Date;

  /**
   * Brand-kit images a bundle carries, by file name (`icon.png`, `icon@2x.png`, `logo.png`); Apple Wallet needs
   * `icon.png`. Google Wallet reads `content.logo` instead.
   */
  readonly images?: Readonly<Record<string, Uint8Array>>;
}
