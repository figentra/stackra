/**
 * Stackra file contract:
 * Purpose: `PassContent`, a wallet pass (a loyalty card, a receipt, a membership, a ticket) as its kind builds it from
 *          the owning record: serial, title, the fields shown, the barcode, colours and expiry.
 * Boundary: a type only. It holds only what a lock screen may show (ADR 0348 decision 5, ADR 0345 decision 2); colours
 *           and logo come from the brand kit, never code. Provider drivers (Apple Wallet, Google Wallet) turn it into
 *           their pass formats.
 * Runtime: isomorphic
 * Governing contract: ADR 0348 (decision 5); ADR 0345 (decision 2).
 */
import type { Url } from "@stackra/contracts";

/** One pass, provider-neutral. */
export interface PassContent {
  /** The pass's serial, unique within its kind: the owning record's public id. */
  readonly serial: string;

  /** The card title. */
  readonly title: string;

  /** A second line under the title. */
  readonly subtitle?: string;

  /** The labelled values shown, in order. */
  readonly fields: readonly { readonly label: string; readonly value: string }[];

  /** The barcode scanned at the counter. */
  readonly barcode?: { readonly format: "qr" | "code128"; readonly value: string };

  /** Background and text colours, `#rrggbb`, from the brand kit. */
  readonly colors?: { readonly background: string; readonly foreground: string };

  /** The logo, from the brand kit. */
  readonly logo?: Url;

  /** When the pass stops being valid. */
  readonly validUntil?: Date;
}
