/**
 * Stackra file contract:
 * Purpose: `ComponentEntrySchema`, the runtime shape check of a registry row (used by the registry gate).
 * Boundary: a zod schema only; the TypeScript type lives in `types/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; ADR 0095 (zod at the edges); ADR 0469 (free HeroUI only).
 */
import { z } from "zod";

import { ComponentCategory } from "#src/enums/component-category.enum";
import { ComponentStatus } from "#src/enums/component-status.enum";
import { ComponentTier } from "#src/enums/component-tier.enum";
import { HapticStyle } from "#src/enums/haptic-style.enum";
import { Platform } from "#src/enums/platform.enum";

/** A kebab-case slug or example id. */
const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** One HeroUI link. */
const HERO_LINK = z.strictObject({
  pkg: z.enum(["@heroui/react", "heroui-native"]),
  slug: z.string().regex(KEBAB),
  docsUrl: z.url({ protocol: /^https$/ }).optional(),
  sourceUrl: z.url({ protocol: /^https$/ }).optional(),
  racUrl: z.url({ protocol: /^https$/ }).optional(),
  figmaUrl: z.url({ protocol: /^https$/ }).optional(),
});

/** The shape of a registry row. */
export const ComponentEntrySchema = z.strictObject({
  slug: z.string().regex(KEBAB),
  tier: z.enum(ComponentTier),
  category: z.enum(ComponentCategory),
  platforms: z.array(z.enum(Platform)).min(1),
  packageName: z.string().regex(/^@[a-z0-9-]+\/[a-z0-9-]+$/),
  exportName: z.string().min(1),
  parts: z.array(z.string().min(1)).min(1),
  hero: z.strictObject({ react: HERO_LINK.optional(), native: HERO_LINK.optional() }),
  examples: z.array(
    z.strictObject({
      id: z.string().regex(KEBAB),
      platforms: z.array(z.enum(Platform)).min(1).optional(),
      minHeight: z.number().int().positive().optional(),
      card: z.literal(true).optional(),
      knobs: z
        .array(z.strictObject({ prop: z.string(), control: z.enum(["select", "switch", "text"]) }))
        .optional(),
    }),
  ),
  related: z.array(z.string().regex(/^(free|pro)\/[a-z0-9-]+$/)).max(3),
  tokens: z.array(z.string().min(1)),
  haptics: z.array(z.strictObject({ event: z.string(), style: z.enum(HapticStyle) })).optional(),
  keywords: z.array(z.string().min(1)),
  status: z.enum(ComponentStatus).optional(),
  a11y: z.array(z.string()).optional(),
});
