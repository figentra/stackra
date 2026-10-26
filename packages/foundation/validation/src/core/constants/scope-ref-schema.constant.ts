/**
 * Stackra file contract:
 * Purpose: `SCOPE_REF_SCHEMA`, the shipped `ScopeRef$`: a scope node's `scp_` public id and its `ltree` path (labels of
 *          letters, digits and underscores, separated by dots).
 * Boundary: shape only. `ScopeRef` is @stackra/contracts', which has no zod, so its `X$` ships here. The shape says
 *           nothing about whether the caller may act in the node; that is the scope resolver's job.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); ADR 0327 (decisions 3 and 5); STA-1284.
 */
import type { ScopeRef } from "@stackra/contracts";
import { z } from "zod";

import { publicId } from "#core/functions/public-id.function";

/** The shipped `ScopeRef$`. */
export const SCOPE_REF_SCHEMA: z.ZodType<ScopeRef> = z.object({
  id: publicId("scp"),
  path: z.string().regex(/^[A-Za-z0-9_]+(\.[A-Za-z0-9_]+)*$/),
}) as unknown as z.ZodType<ScopeRef>;
