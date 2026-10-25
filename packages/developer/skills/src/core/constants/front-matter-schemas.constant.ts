/**
 * Stackra file contract:
 * Purpose: `FRONT_MATTER_SCHEMAS`, the frontmatter schema of each agent document kind. Every schema is strict, so a
 *          misspelled key fails instead of being dropped, and every kind may repeat its derived `name`.
 * Boundary: internal; `parseAgentDocument` is the one reader. The name itself is derived from the path, not read here.
 * Runtime: isomorphic
 * Governing contract: ADR 0282 (decision 2).
 */
import { Enum } from "@stackra/contracts";
import { z } from "zod";

import type { AgentDocumentKind } from "#core/enums/agent-document-kind.enum";
import { HookEvent } from "#core/enums/hook-event.enum";

const text = z.string().trim().min(1, "Must not be empty");

/** One strict frontmatter schema per kind. */
export const FRONT_MATTER_SCHEMAS = {
  skill: z.strictObject({ name: text.optional(), description: text }),
  rule: z.strictObject({
    name: text.optional(),
    title: text,
    description: text,
    always: z.boolean().default(false),
    globs: z.array(text).default([]),
  }),
  subagent: z.strictObject({
    name: text.optional(),
    description: text,
    tools: z.array(text).default([]),
  }),
  command: z.strictObject({
    name: text.optional(),
    description: text,
    argumentHint: text.optional(),
  }),
  hook: z.strictObject({
    name: text.optional(),
    description: text,
    event: z.enum(Enum.values(HookEvent) as [HookEvent, ...HookEvent[]]),
    matcher: text.optional(),
    run: text,
  }),
} satisfies Record<AgentDocumentKind, z.ZodType>;
