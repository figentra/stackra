/**
 * Stackra file contract:
 * Purpose: `SESSION_USER_SCHEMA`, the zod schema of a `SessionUser`: what the BFF's session endpoint answers and what a
 *          device keeps beside its tokens, both read back through it.
 * Boundary: internal. Both sources are untrusted input to the client (a proxy's page, a store written by an older
 *           build), so each is parsed, and unknown keys are dropped. A membership has at least one role; its `role` is
 *           the first of `roles`.
 * Runtime: isomorphic
 * Governing contract: ADR 0206 (decision 2); ADR 0241 (decision 2); ADR 0327 (decision 3).
 */
import type { Email } from "@stackra/contracts";
import { publicId, url } from "@stackra/validation";
import { z } from "zod";
import type { ZodType } from "zod";

/** An email address, typed as the contracts' `Email`. */
const EMAIL = z.email() as unknown as ZodType<Email, string>;

/** The schema of one `SessionUser`. */
export const SESSION_USER_SCHEMA = z.object({
  userId: publicId("usr"),
  email: EMAIL,
  displayName: z.string().min(1),
  avatarUrl: url().exactOptional(),
  permissions: z.array(z.string().min(1)),
  tenants: z.array(
    z.object({
      tenantId: publicId("scp"),
      path: z.string().min(1),
      name: z.string().min(1),
      role: z.string().min(1),
      roles: z.array(z.string().min(1)).min(1),
    }),
  ),
});
