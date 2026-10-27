/**
 * Stackra file contract:
 * Purpose: `ACTOR_SCHEMA`, the shipped `Actor$`: a user actor (a `usr_` id and a realm) or any other actor kind (any
 *          public id, no realm), each with an optional tenant and an optional `onBehalfOf` actor, recursively.
 * Boundary: shape only. `Actor` is @stackra/contracts', which has no zod, so its `X$` ships here. A parsed actor is
 *           data someone sent: the caller of an invocation always comes from the authenticated context, never from
 *           this schema.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); STA-1284.
 */
import { type Actor, ActorKind, Enum, Realm } from "@stackra/contracts";
import { z } from "zod";

import { publicId } from "#core/functions/public-id.function";

/** A public id with any registered prefix, in `publicId`'s format. */
const ANY_ID = z.string().regex(/^[a-z]{2,6}_[0-9a-hjkmnp-tv-z]{26}$/i);

/** The shipped `Actor$`. */
export const ACTOR_SCHEMA: z.ZodType<Actor> = z.lazy(() =>
  z.union([
    z.object({
      kind: z.literal(ActorKind.User),
      id: publicId("usr"),
      realm: z.enum(Enum.values(Realm)),
      scopeId: ANY_ID.exactOptional(),
      onBehalfOf: ACTOR_SCHEMA.exactOptional(),
    }),
    z.object({
      kind: z.enum(Enum.values(ActorKind).filter((kind) => kind !== ActorKind.User)),
      id: ANY_ID,
      scopeId: ANY_ID.exactOptional(),
      onBehalfOf: ACTOR_SCHEMA.exactOptional(),
    }),
  ]),
) as unknown as z.ZodType<Actor>;
