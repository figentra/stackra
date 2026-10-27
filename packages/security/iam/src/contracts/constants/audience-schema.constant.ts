/**
 * Stackra file contract:
 * Purpose: `AUDIENCE_SCHEMA`, the shipped `Audience$`: a rule's audience as a scope node (`ScopeRef$`) or a role
 *          (`{ kind: "role", key }`).
 * Boundary: shape only; whether the role exists, and who it covers, is the policy evaluator's job. A segment is no
 *           audience: `{ kind: "segment" }` is refused (ADR 0462 decision 1).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); STA-1284; ADR 0462 (decision 1).
 */
import { ScopeRef$ } from "@stackra/validation";
import { z } from "zod";

import type { Audience } from "#contracts/types/audience.type";

/** The shipped `Audience$`. */
export const AUDIENCE_SCHEMA: z.ZodType<Audience> = z.union([
  z.object({ kind: z.literal("role"), key: z.string().min(1) }),
  ScopeRef$,
]) as unknown as z.ZodType<Audience>;
