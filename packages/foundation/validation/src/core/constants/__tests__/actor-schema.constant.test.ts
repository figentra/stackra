/**
 * Stackra file contract:
 * Purpose: unit tests of `ACTOR_SCHEMA` (`Actor$`): a user actor needs a `usr_` id and a realm, an agent acting on
 *          behalf of a user parses recursively, and a user with no realm is refused.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 26); STA-1284.
 */
import { ActorKind, Realm } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { ACTOR_SCHEMA } from "#core/constants/actor-schema.constant";

const user = { kind: ActorKind.User, id: "usr_01HZX3K9M2Q7R8S5T6V4W1Y0AB", realm: Realm.Customer };

describe("Actor$", () => {
  it("parses a user and an agent acting on the user's behalf", () => {
    expect(ACTOR_SCHEMA.parse(user)).toEqual(user);
    const agent = { kind: ActorKind.Agent, id: "agt_01HZX3K9M2Q7R8S5T6V4W1Y0AB", onBehalfOf: user };
    expect(ACTOR_SCHEMA.parse(agent)).toEqual(agent);
  });

  it("refuses a user with no realm", () => {
    expect(
      ACTOR_SCHEMA.safeParse({ kind: ActorKind.User, id: "usr_01HZX3K9M2Q7R8S5T6V4W1Y0AB" })
        .success,
    ).toBe(false);
  });
});
