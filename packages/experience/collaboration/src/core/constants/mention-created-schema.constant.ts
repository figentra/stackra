/**
 * Stackra file contract:
 * Purpose: `MENTION_CREATED_SCHEMA`, the zod schema this package ships for `MentionCreated`: the comment, its thread,
 *          the record, who mentioned, the target and the comment's level.
 * Boundary: the stand-in for what gen will write for this package; internal, registered by the event file. It never
 *           carries the text. `targetId` is null only for the assistant.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); ADR 0433 (decisions 3 and 5).
 */
import { publicId } from "@stackra/validation";
import { z } from "zod";

/** The shipped `MentionCreated$`. */
export const MENTION_CREATED_SCHEMA = z
  .object({
    commentId: publicId("cmt"),
    threadId: publicId("cth"),
    recordModel: z.string().regex(/^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/),
    recordId: z.string().min(1).max(64),
    mentionedBy: z.string().min(1).max(64),
    kind: z.enum(["member", "team", "role", "external_participant", "assistant"]),
    targetId: z.string().min(1).max(64).nullable(),
    visibility: z.enum(["internal", "shared"]),
  })
  .refine((event) => (event.kind === "assistant") === (event.targetId === null), {
    message: "Only an assistant mention has no target id",
  });
