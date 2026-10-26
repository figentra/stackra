/**
 * Stackra file contract:
 * Purpose: `PERK_LISTING_SCHEMA`, the shipped zod schema of `PerkListing`: the listing key, the partner's developer
 *          tenant, the review state, the redemption (a code, a link, or the lead fields sent after consent), the packs
 *          and products it runs in, the partner terms link, and the fee schedule its listing fee is invoiced under.
 * Boundary: internal; `perk-listing.schema.ts` registers it. The redemption's own field must be present for its kind;
 *           lists are non-empty and each value once. A null fee schedule is a free listing (OS-130).
 * Runtime: isomorphic
 * Governing contract: ADR 0393 (decision 1); owner M3-7, R3-SO-18, OS-130.
 */
import { Enum } from "@stackra/contracts";
import { z } from "zod";

import { PerkRedemptionKind } from "#core/enums/perk-redemption-kind.enum";
import { ReviewState } from "#core/enums/review-state.enum";

/** Non-empty texts, each once. */
const SET = z
  .array(z.string().min(1))
  .min(1)
  .refine((values) => new Set(values).size === values.length, "a value is listed more than once");

/** The shipped `PerkListing$`. */
export const PERK_LISTING_SCHEMA = z
  .object({
    key: z.string().min(1),
    partner: z.string().min(1),
    state: z.enum(Enum.values(ReviewState)),
    redemption: z.enum(Enum.values(PerkRedemptionKind)),
    code: z.string().min(1).nullable().default(null),
    url: z
      .url({ protocol: /^https$/ })
      .nullable()
      .default(null),
    leadFields: z.array(z.string().min(1)).default(() => []),
    packs: SET,
    products: SET,
    termsUrl: z.url({ protocol: /^https$/ }),
    feeSchedule: z.string().min(1).nullable().default(null),
  })
  .refine((listing) => listing.redemption !== PerkRedemptionKind.Code || listing.code !== null, {
    message: "a code perk needs its code",
    path: ["code"],
  })
  .refine((listing) => listing.redemption !== PerkRedemptionKind.Link || listing.url !== null, {
    message: "a link perk needs its url",
    path: ["url"],
  })
  .refine(
    (listing) => listing.redemption !== PerkRedemptionKind.Lead || listing.leadFields.length > 0,
    {
      message: "a lead perk names the fields it sends",
      path: ["leadFields"],
    },
  );
