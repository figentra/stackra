/**
 * Stackra file contract:
 * Purpose: `MARKET_PACK_SCHEMA`, the zod schema of `MarketPack` (its `X$`): one version of one market's pack, or of one
 *          product's section of it: its code, the market it overlays, its version and status, its dated entries (some
 *          of them legal floors), the reviewer sign-offs per entry key and the launch checklist.
 * Boundary: shape only, no values. Market codes are lowercase and dash-separated (`eu`, `eu-de`, `ae-difc`); versions
 *           are `major.minor.patch`; entry keys are dotted lowercase paths. An entry is in force from `from` through
 *           `until` (both inclusive). One key never has two entries starting the same day. A product section names
 *           its keys under its own prefix (`<section>.`), so it can never overwrite a base value, and does not overlay
 *           a market itself: it follows its base pack. `reviews` and `checklist` default to empty.
 * Runtime: isomorphic
 * Governing contract: ADR 0370 (decisions 1, 4, 5, 6 and 8); ADR 0363 (decisions 3 and 4).
 */
import { Enum } from "@stackra/contracts";
import { z } from "zod";

import { FloorBound } from "#core/enums/floor-bound.enum";
import { PackStatus } from "#core/enums/pack-status.enum";

/** A market code. */
const MARKET = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Expected a lowercase market code");

/** A dotted entry key. */
const KEY = z.string().regex(/^[a-z0-9_]+(\.[a-z0-9_]+)*$/, "Expected a dotted lowercase key");

/** A non-empty label. */
const TEXT = z.string().min(1);

/** The shipped `MarketPack$`. */
export const MARKET_PACK_SCHEMA = z
  .object({
    market: MARKET,
    section: z
      .string()
      .regex(/^[a-z][a-z0-9_]*$/, "Expected a lowercase section key")
      .exactOptional(),
    extends: MARKET.exactOptional(),
    version: z
      .string()
      .regex(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/, "Expected major.minor.patch"),
    status: z.enum(Enum.values(PackStatus)),
    entries: z.array(
      z
        .object({
          key: KEY,
          value: z.json(),
          from: z.iso.date(),
          until: z.iso.date().exactOptional(),
          floor: z.object({ bound: z.enum(Enum.values(FloorBound)), law: TEXT }).exactOptional(),
        })
        .refine((entry) => entry.until === undefined || entry.from <= entry.until, {
          message: "until is before from",
          path: ["until"],
        }),
    ),
    reviews: z.array(z.object({ key: KEY, reviewer: TEXT, at: z.iso.date() })).default([]),
    checklist: z
      .array(
        z.object({
          id: TEXT,
          product: TEXT.exactOptional(),
          doneBy: TEXT.exactOptional(),
          doneAt: z.iso.date().exactOptional(),
        }),
      )
      .default([]),
  })
  .refine(
    (pack) =>
      new Set(pack.entries.map((entry) => `${entry.key}@${entry.from}`)).size ===
      pack.entries.length,
    { message: "A key has two entries starting the same day", path: ["entries"] },
  )
  .refine(
    (pack) =>
      pack.section === undefined ||
      [...pack.entries, ...pack.reviews].every((item) => item.key.startsWith(`${pack.section}.`)),
    { message: "A section's keys start with its section key", path: ["entries"] },
  )
  .refine((pack) => pack.section === undefined || pack.extends === undefined, {
    message: "A section follows its base pack and overlays nothing",
    path: ["extends"],
  });
