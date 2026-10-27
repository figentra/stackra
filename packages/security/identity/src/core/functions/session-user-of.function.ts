/**
 * Stackra file contract:
 * Purpose: `sessionUserOf(claims)`, the claims mapping: the verified claims of an ID token (or of the BFF's session)
 *          to the provider-neutral `SessionUser`, its memberships in the tenancy package's shape.
 * Boundary: a pure function over claims the caller has already verified (signature, or TLS from the token endpoint,
 *           plus issuer, audience, expiry and nonce). It reads only `IDENTITY_CLAIMS` and the standard `email`, `name`
 *           and `picture`; a token without the user id or the address is refused, since such a token was not minted
 *           for a Stackra user. The name falls back to the address.
 * Runtime: isomorphic
 * Governing contract: ADR 0206 (decision 2: provider-neutral ids and claims mapping); ADR 0208; ADR 0327.
 */
import type { Email } from "@stackra/contracts";
import { UnauthenticatedError } from "@stackra/errors";
import { publicId, url } from "@stackra/validation";
import { z } from "zod";
import type { ZodType } from "zod";

import type { SessionUser } from "#contracts/types/session-user.type";
import { IDENTITY_CLAIMS } from "#core/constants/identity-claims.constant";

/** A role code. */
const ROLE = z.string().min(1);

/** The claims this mapping reads; the rest are left alone. */
const CLAIMS = z.object({
  [IDENTITY_CLAIMS.userId]: publicId("usr"),
  email: z.email() as unknown as ZodType<Email, string>,
  name: z.string().min(1).optional(),
  picture: url().optional(),
  [IDENTITY_CLAIMS.permissions]: z.array(z.string().min(1)).default([]),
  [IDENTITY_CLAIMS.memberships]: z
    .array(
      z.object({
        scopeId: publicId("scp"),
        path: z.string().min(1),
        name: z.string().min(1),
        roles: z.tuple([ROLE], ROLE),
      }),
    )
    .default([]),
});

/**
 * The user the claims describe.
 *
 * @throws UnauthenticatedError when the claims lack the user id or the address, or a membership is malformed.
 * @example
 * const user = sessionUserOf(decodedIdToken);
 * switcher.setMemberships(user.memberships);
 */
export function sessionUserOf(claims: Readonly<Record<string, unknown>>): SessionUser {
  const parsed = CLAIMS.safeParse(claims);
  if (!parsed.success) throw UnauthenticatedError.create({}, { cause: parsed.error });
  const read = parsed.data;
  return {
    userId: read[IDENTITY_CLAIMS.userId],
    email: read.email,
    displayName: read.name ?? read.email,
    ...(read.picture === undefined ? {} : { avatarUrl: read.picture }),
    permissions: read[IDENTITY_CLAIMS.permissions],
    memberships: read[IDENTITY_CLAIMS.memberships].map((membership) => ({
      tenantId: membership.scopeId,
      path: membership.path,
      name: membership.name,
      role: membership.roles[0],
      roles: membership.roles,
    })),
  };
}
