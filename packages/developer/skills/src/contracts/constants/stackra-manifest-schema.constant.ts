/**
 * Stackra file contract:
 * Purpose: `STACKRA_MANIFEST_SCHEMA`, the check of an item's `stackra` field: a known kind (`package` when missing),
 *          for a `package` its optional `tier`, `category`, `runtimes` (non-empty, no repeats) and `summary`, and for
 *          `mcp` its server entry. Unknown keys are dropped.
 * Boundary: shape only; the Worker runs it on publish (decision 7), `stackra publish` before packing, and `pnpm
 *           validate` on every member (which also requires the package fields this schema leaves optional).
 * Runtime: isomorphic
 * Governing contract: ADR 0453 (decisions 7 and 11, amendment of 2026-10-27); ADR 0294 (decision 26: a package ships
 *                     its own schema).
 */
import { Enum } from "@stackra/contracts";
import { z } from "zod";

import { StackraCategory } from "#contracts/enums/stackra-category.enum";
import { StackraKind } from "#contracts/enums/stackra-kind.enum";
import { StackraRuntime } from "#contracts/enums/stackra-runtime.enum";
import { StackraTier } from "#contracts/enums/stackra-tier.enum";
import type { StackraPackageField } from "#contracts/types/stackra-package-field.type";

/** The values of one `Enum.of` as a zod enum. */
const oneOf = <T extends string>(values: readonly T[]) => z.enum(values as [T, ...T[]]);

/** The `stackra` field of an item's `package.json`; parse `{}` when the field is missing. */
export const STACKRA_MANIFEST_SCHEMA: z.ZodType<StackraPackageField> = z.union([
  z.object({
    kind: z.literal(StackraKind.Package).default(StackraKind.Package),
    tier: oneOf(Enum.values(StackraTier)).optional(),
    category: oneOf(Enum.values(StackraCategory)).optional(),
    runtimes: z
      .array(oneOf(Enum.values(StackraRuntime)))
      .min(1)
      .refine((runtimes) => new Set(runtimes).size === runtimes.length, "a runtime is listed twice")
      .optional(),
    summary: z.string().trim().min(1).optional(),
  }),
  z.object({
    kind: z.enum([StackraKind.Skill, StackraKind.Agent, StackraKind.Plugin]),
  }),
  z.object({
    kind: z.literal(StackraKind.Mcp),
    mcp: z.record(z.string(), z.unknown()),
  }),
]);
