/**
 * Stackra file contract:
 * Purpose: `actorOf(claims, principals)`, the caller of an inbound call from its verified access token: a service
 *          account's token is the `service` actor of its principal (ADR 0209 decision 3), a user's token the `user`
 *          actor with its realm and the scope the token was issued for (CallIsolation resolves its tenant).
 * Boundary: a pure mapping over claims the caller has already verified (`BearerTokenGuard`); the only read is
 *           `ServicePrincipals.bySubject`. The subject is looked up first, so a service account's token is never a
 *           user, whatever other claims it carries, and its id is always the principal's. A user token reads only
 *           `IDENTITY_CLAIMS`: the `usr_` id and the realm are required, and `scopeId` is the scope the token was
 *           issued for (CallIsolation resolves its tenant): the membership whose path is the token's scope path,
 *           absent with no scope path. Anything else is refused `unauthenticated`, never Anonymous.
 * Runtime: isomorphic
 * Governing contract: ADR 0209 (decision 3: service-to-service calls); ADR 0098 (decisions 6 and 7); ADR 0206
 *                     (decision 2); STA-2558.
 */
import { ActorKind, Enum, Realm } from "@stackra/contracts";
import type { Actor } from "@stackra/contracts";
import { UnauthenticatedError } from "@stackra/errors";
import { publicId } from "@stackra/validation";
import { z } from "zod";

import type { ServicePrincipals } from "#contracts/index";
import { IDENTITY_CLAIMS } from "#core/constants/identity-claims.constant";

/** The subject every verified token carries. */
const SUBJECT = z.object({ sub: z.string().min(1) });

/** The claims a user token needs. */
const USER_CLAIMS = z.object({
  [IDENTITY_CLAIMS.userId]: publicId("usr"),
  [IDENTITY_CLAIMS.realm]: z.enum(Enum.values(Realm) as [Realm, ...Realm[]]),
  [IDENTITY_CLAIMS.scopePath]: z.string().min(1).optional(),
  [IDENTITY_CLAIMS.memberships]: z
    .array(z.object({ scopeId: publicId("scp"), path: z.string().min(1) }))
    .default([]),
});

/**
 * The actor the verified claims are. `onBehalfOf` (the user a service calls for) comes in a later PR.
 *
 * @throws UnauthenticatedError when the subject is missing, a claim has the wrong type, a user claim is missing, or
 *         the scope path is not one of the user's memberships.
 * @example
 * const actor = await actorOf(verified.claims, servicePrincipals);
 */
export async function actorOf(
  claims: Readonly<Record<string, unknown>>,
  principals: ServicePrincipals,
): Promise<Actor> {
  const subject = SUBJECT.safeParse(claims);
  if (!subject.success) throw UnauthenticatedError.create({}, { cause: subject.error });
  const principal = await principals.bySubject(subject.data.sub);
  if (principal !== undefined)
    return {
      kind: ActorKind.Service,
      id: principal.id,
      ...(principal.scopeId === undefined ? {} : { scopeId: principal.scopeId }),
    };
  const parsed = USER_CLAIMS.safeParse(claims);
  if (!parsed.success) throw UnauthenticatedError.create({}, { cause: parsed.error });
  const read = parsed.data;
  const path = read[IDENTITY_CLAIMS.scopePath];
  const scopeId =
    path === undefined
      ? undefined
      : read[IDENTITY_CLAIMS.memberships].find((membership) => membership.path === path)?.scopeId;
  if (path !== undefined && scopeId === undefined) throw UnauthenticatedError.create();
  return {
    kind: ActorKind.User,
    id: read[IDENTITY_CLAIMS.userId],
    realm: read[IDENTITY_CLAIMS.realm],
    ...(scopeId === undefined ? {} : { scopeId }),
  };
}
