/**
 * Stackra file contract:
 * Purpose: `EntryKind`, why a ledger entry exists; stored on every row and shown as a badge in the console.
 * Boundary: an `Enum.of` value plus the type of the same name, in the leaf entry. The code is the column value; the
 *           tone colours the badge. Labels are the derived i18n keys `loyalty_kit::enums.entry_kind.<code>`. `Expire`
 *           and `Adjust` are written only by the kit's own job, redemption and take-back (`AccountService.takeBack`); `Hold` and `Release` only by
 *           `LoyaltyService`'s hold, settle and release. A host never appends any of them directly.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 15, 16 and 20); ADR 0231 (snake_case codes).
 */
import { Enum, Tone } from "@stackra/contracts";

/**
 * One case per kind; cases are plain codes, so they compare with `===`.
 *
 * @example
 * entries.filter((entry) => entry.kind === EntryKind.Earn);
 */
export const EntryKind = Enum.of({
  /** Points credited for a purchase. */
  Earn: ["earn", { tone: Tone.Success }],
  /** Points spent on a redemption. */
  Redeem: ["redeem", { tone: Tone.Default }],
  /** Stale earned points removed by the expiry job. */
  Expire: ["expire", { tone: Tone.Warning }],
  /** A correction, such as a redemption credited back. */
  Adjust: ["adjust", { tone: Tone.Accent }],
  /** Points reserved for a purchase that has not settled yet. */
  Hold: ["hold", { tone: Tone.Warning }],
  /** Held points given back, or offset when a hold settles. */
  Release: ["release", { tone: Tone.Accent }],
});

/** One of the codes above. */
export type EntryKind = Enum.Value<typeof EntryKind>;
