/**
 * Stackra file contract:
 * Purpose: `AUDIENCE_SCHEMA`, the shipped `Audience$`: a rule's audience as a scope node (`ScopeRef$`), a segment
 *          (`{ kind: "segment", id: "seg_…" }`) or a role (`{ kind: "role", key }`).
 * Boundary: shape only; whether the segment or role exists, and who it covers, is the policy evaluator's job.
 *           `SegmentRef` is @stackra/segments', which ships no schema, so its object is spelled here.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); STA-1284.
 */
import { publicId, ScopeRef$ } from "@stackra/validation";
import { z } from "zod";

import type { Audience } from "#contracts/types/audience.type";

/** The shipped `Audience$`. */
export const AUDIENCE_SCHEMA: z.ZodType<Audience> = z.union([
  z.object({ kind: z.literal("segment"), id: publicId("seg") }),
  z.object({ kind: z.literal("role"), key: z.string().min(1) }),
  ScopeRef$,
]) as unknown as z.ZodType<Audience>;
