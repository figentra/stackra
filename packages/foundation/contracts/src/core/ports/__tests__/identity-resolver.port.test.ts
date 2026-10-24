/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `IdentityResolver` port: it is a `Port`; an implementation resolves a user id
 *          to a verified address and a verified address back to its principal; the signatures take user ids and
 *          addresses only.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0206 (identity).
 */
import { describe, expect, it } from "@stackra/testing";

import { Port } from "#core/bases/port.base";
import { IdentityResolver } from "#core/ports/identity-resolver.port";
import type { Email } from "#core/types/email.type";
import type { PublicId } from "#core/types/public-id.type";
import type { VerifiedPrincipal } from "#core/types/verified-principal.type";

class MemoryIdentity extends IdentityResolver {
  private readonly people: readonly VerifiedPrincipal[];

  constructor(people: readonly VerifiedPrincipal[]) {
    super();
    this.people = people;
  }

  override async emailOf(principalId: PublicId<"usr">): Promise<Email> {
    const person = this.people.find((candidate) => candidate.id === principalId);
    if (!person) throw new Error(`No verified address for ${principalId}`);
    return person.email;
  }

  override async principalByVerifiedEmail(email: Email): Promise<VerifiedPrincipal | null> {
    const wanted = email.toLowerCase();
    return this.people.find((candidate) => candidate.email.toLowerCase() === wanted) ?? null;
  }
}

const SARA: VerifiedPrincipal = {
  id: "usr_01j9z3k4m5n6p7q8r9s0t1v2w3",
  email: "sara@acme.example",
  locale: "ar",
};

describe("IdentityResolver", () => {
  it("is a port an implementation extends", () => {
    expect(new MemoryIdentity([])).toBeInstanceOf(IdentityResolver);
    expect(new MemoryIdentity([])).toBeInstanceOf(Port);
  });

  it("resolves a principal to the verified address at the moment of use", async () => {
    const identity: IdentityResolver = new MemoryIdentity([SARA]);
    await expect(identity.emailOf(SARA.id)).resolves.toBe("sara@acme.example");
    await expect(identity.emailOf("usr_unknown")).rejects.toThrow(/No verified address/);
  });

  it("finds the principal behind a verified address, or nobody", async () => {
    const identity: IdentityResolver = new MemoryIdentity([SARA]);
    await expect(identity.principalByVerifiedEmail("SARA@acme.example")).resolves.toEqual(SARA);
    await expect(identity.principalByVerifiedEmail("someone@else.example")).resolves.toBeNull();
  });

  it("takes user ids and addresses only", async () => {
    const identity: IdentityResolver = new MemoryIdentity([SARA]);
    // @ts-expect-error -- an order id is not a user id
    await expect(identity.emailOf("ord_01j9z3k4m5n6p7q8r9s0t1v2w3")).rejects.toThrow();
    // @ts-expect-error -- not an email address
    await expect(identity.principalByVerifiedEmail("sara")).resolves.toBeNull();
  });
});
