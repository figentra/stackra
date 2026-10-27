/**
 * Stackra file contract:
 * Purpose: `STACKRA_MANIFEST_SCHEMA`, the check of an item's `stackra` field: a known kind (`package` when missing),
 *          and for `mcp` its server entry. Unknown keys are dropped.
 * Boundary: shape only; the Worker runs it on publish (decision 7), `stackra publish` before packing.
 * Runtime: isomorphic
 * Governing contract: ADR 0453 (decisions 7 and 11); ADR 0294 (decision 26: a package ships its own schema).
 */
import { z } from "zod";

import { StackraKind } from "#contracts/enums/stackra-kind.enum";
import type { StackraManifest } from "#contracts/types/stackra-manifest.type";

/** The `stackra` field of an item's `package.json`; parse `{}` when the field is missing. */
export const STACKRA_MANIFEST_SCHEMA: z.ZodType<StackraManifest> = z.union([
  z.object({
    kind: z
      .enum([StackraKind.Package, StackraKind.Skill, StackraKind.Agent, StackraKind.Plugin])
      .default(StackraKind.Package),
  }),
  z.object({
    kind: z.literal(StackraKind.Mcp),
    mcp: z.record(z.string(), z.unknown()),
  }),
]);
