/**
 * Stackra file contract:
 * Purpose: unit tests of `actorsSharePerson`: overlapping chains, one `personOf` key, the interim verified email and
 *          phone rule when `personOf` answers null, two different people, the human behind an agent, and the
 *          fail-closed rejection when identity cannot answer.
 * Boundary: test only; a memory `IdentityResolver` with an optional person link.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; STA-1724 (P-020).
 */
import { describe, expect, it } from "@stackra/testing";

import { ActorKind } from "#core/enums/actor-kind.enum";
import { Realm } from "#core/enums/realm.enum";
import { actorsSharePerson } from "#core/functions/actors-share-person.function";
import { IdentityResolver } from "#core/ports/identity-resolver.port";
import type { Actor } from "#core/types/actor.type";
import type { Email } from "#core/types/email.type";
import type { PublicId } from "#core/types/public-id.type";
import type { VerifiedPrincipal } from "#core/types/verified-principal.type";

/** A memory identity; `persons` is the person link, absent for the interim rule. */
class MemoryIdentity extends IdentityResolver {
  private readonly people: readonly VerifiedPrincipal[];

  private readonly persons: ReadonlyMap<string, string> | undefined;

  constructor(people: readonly VerifiedPrincipal[], persons?: ReadonlyMap<string, string>) {
    super();
    this.people = people;
    this.persons = persons;
  }

  override async emailOf(principalId: PublicId<"usr">): Promise<Email> {
    return (await this.principalOf(principalId)).email;
  }

  override async principalOf(principalId: PublicId<"usr">): Promise<VerifiedPrincipal> {
    const person = this.people.find((candidate) => candidate.id === principalId);
    if (!person) throw new Error(`No verified address for ${principalId}`);
    return person;
  }

  override async principalByVerifiedEmail(email: Email): Promise<VerifiedPrincipal | null> {
    return this.people.find((candidate) => candidate.email === email) ?? null;
  }

  override async personOf(principalId: PublicId<"usr">): Promise<string | null> {
    return this.persons === undefined ? null : (this.persons.get(principalId) ?? null);
  }
}

const SARA_ID = "usr_01j9z3k4m5n6p7q8r9s0t1v2w3";
const SARA_OTHER_ID = "usr_01j9z3k4m5n6p7q8r9s0t1v2w7";
const OMAR_ID = "usr_01j9z3k4m5n6p7q8r9s0t1v2w4";

const user = (id: `usr_${string}`): Actor => ({ kind: ActorKind.User, id, realm: Realm.Staff });
const agentOf = (onBehalfOf: Actor): Actor => ({
  kind: ActorKind.Agent,
  id: "agt_01j9z3k4m5n6p7q8r9s0t1v2w5",
  onBehalfOf,
});

const people: VerifiedPrincipal[] = [
  { id: SARA_ID, email: "sara@acme.example", locale: "en", phone: "+201001234567" },
  { id: SARA_OTHER_ID, email: "SARA@acme.example", locale: "en" },
  { id: OMAR_ID, email: "omar@acme.example", locale: "en", phone: "+201001234567" },
];

describe(actorsSharePerson, () => {
  it("is true for overlapping chains without asking identity", async () => {
    await expect(
      actorsSharePerson(new MemoryIdentity([]), agentOf(user(SARA_ID)), user(SARA_ID)),
    ).resolves.toBe(true);
  });

  it("is true for two ids with the same personOf key and false for another key", async () => {
    const identity = new MemoryIdentity(
      people,
      new Map([
        [SARA_ID, "person_1"],
        [SARA_OTHER_ID, "person_1"],
        [OMAR_ID, "person_2"],
      ]),
    );
    await expect(actorsSharePerson(identity, user(SARA_ID), user(SARA_OTHER_ID))).resolves.toBe(
      true,
    );
    // Sara and Omar share a phone in the fixture, but the person link says they are two people
    await expect(actorsSharePerson(identity, user(SARA_ID), user(OMAR_ID))).resolves.toBe(false);
  });

  it("falls back to an equal verified email, case-insensitively, when personOf answers null", async () => {
    await expect(
      actorsSharePerson(new MemoryIdentity(people), user(SARA_ID), user(SARA_OTHER_ID)),
    ).resolves.toBe(true);
  });

  it("falls back to an equal verified phone when personOf answers null", async () => {
    await expect(
      actorsSharePerson(new MemoryIdentity(people), user(SARA_ID), user(OMAR_ID)),
    ).resolves.toBe(true);
  });

  it("is false for two people with different contact points", async () => {
    const identity = new MemoryIdentity([
      { id: SARA_ID, email: "sara@acme.example", locale: "en" },
      { id: OMAR_ID, email: "omar@acme.example", locale: "en" },
    ]);
    await expect(actorsSharePerson(identity, user(SARA_ID), user(OMAR_ID))).resolves.toBe(false);
  });

  it("checks the human behind an agent chain", async () => {
    await expect(
      actorsSharePerson(new MemoryIdentity(people), agentOf(user(SARA_OTHER_ID)), user(SARA_ID)),
    ).resolves.toBe(true);
  });

  it("rejects, never answers false, when identity cannot answer", async () => {
    const identity = new MemoryIdentity([
      { id: SARA_ID, email: "sara@acme.example", locale: "en" },
    ]);
    await expect(actorsSharePerson(identity, user(SARA_ID), user(OMAR_ID))).rejects.toThrow(
      /No verified address/,
    );
  });

  it("is false when a chain holds no user to compare", async () => {
    const system: Actor = { kind: ActorKind.System, id: "sys_01j9z3k4m5n6p7q8r9s0t1v2w8" };
    await expect(actorsSharePerson(new MemoryIdentity([]), system, user(SARA_ID))).resolves.toBe(
      false,
    );
  });
});
