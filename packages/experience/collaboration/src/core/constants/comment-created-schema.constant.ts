/**
 * Stackra file contract:
 * Purpose: `COMMENT_CREATED_SCHEMA`, the zod schema this package ships for `CommentCreated`: the comment, its thread,
 *          the record, the author and the level.
 * Boundary: the stand-in for what gen will write for this package; internal, registered by the event file. It never
 *           carries the text, which may hold personal data.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0433 (decision 5).
 */
import { publicId } from "@stackra/validation";
import { z } from "zod";

/** The shipped `CommentCreated$`. */
export const COMMENT_CREATED_SCHEMA = z.object({
  commentId: publicId("cmt"),
  threadId: publicId("cth"),
  recordModel: z.string().regex(/^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/),
  recordId: z.string().min(1).max(64),
  authorId: z.string().min(1).max(64),
  visibility: z.enum(["internal", "shared"]),
});
