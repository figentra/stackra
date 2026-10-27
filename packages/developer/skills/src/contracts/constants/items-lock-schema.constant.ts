/**
 * Stackra file contract:
 * Purpose: `ITEMS_LOCK_SCHEMA`, the check of `stackra-items.lock.yaml`: version 1, items keyed by an item package
 *          name, each with its kind, version, SHA-512 integrity and a workspace-relative target.
 * Boundary: shape only; `stackra add` reads and writes the file.
 * Runtime: isomorphic
 * Governing contract: ADR 0453 (decision 11: the lock's schema is stackra-184's); ADR 0294 (decision 26).
 */
import { z } from "zod";

import { ITEM_PACKAGE_NAME_PATTERN } from "#contracts/constants/item-package-name-pattern.constant";
import { StackraKind } from "#contracts/enums/stackra-kind.enum";
import type { ItemsLock } from "#contracts/types/items-lock.type";

/** `stackra-items.lock.yaml`. */
export const ITEMS_LOCK_SCHEMA: z.ZodType<ItemsLock> = z.strictObject({
  lockfileVersion: z.literal(1),
  items: z.record(
    z.string().regex(ITEM_PACKAGE_NAME_PATTERN, "Must be @<scope>/<kind>-<name>"),
    z.strictObject({
      kind: z.enum([StackraKind.Skill, StackraKind.Agent, StackraKind.Mcp, StackraKind.Plugin]),
      version: z.string().min(1),
      integrity: z.string().regex(/^sha512-[A-Za-z0-9+/]+=*$/, "Must be a sha512 SRI"),
      target: z
        .string()
        .min(1)
        .refine(
          (target) => !target.startsWith("/") && !target.split(/[/\\]/).includes(".."),
          "Must stay inside the workspace",
        ),
    }),
  ),
});
