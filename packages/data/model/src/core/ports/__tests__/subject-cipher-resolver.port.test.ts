/**
 * Stackra file contract:
 * Purpose: unit tests of the `SubjectCipherResolver` port: it is an abstract token a driver extends, and a driver's
 *          `opening` may answer undefined for an erased subject.
 * Boundary: test only; an in-test driver over a fixed cipher.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0212; gap gov2 (stackra-263).
 */
import { FieldCipher } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { SubjectCipherResolver } from "#core/ports/subject-cipher-resolver.port";

/** A cipher that leaves values as they are. */
class PlainCipher extends FieldCipher {
  override async seal(plain: string): Promise<string> {
    return plain;
  }

  override async open(sealed: string): Promise<string> {
    return sealed;
  }
}

/** Knows one live subject. */
class OneSubjectResolver extends SubjectCipherResolver {
  override async sealing(): Promise<FieldCipher> {
    return new PlainCipher();
  }

  override async opening(subject: string): Promise<FieldCipher | undefined> {
    return subject === "usr_live" ? new PlainCipher() : undefined;
  }
}

describe(SubjectCipherResolver, () => {
  it("is extended by a driver that answers undefined for an erased subject", async () => {
    const resolver = new OneSubjectResolver();
    expect(resolver).toBeInstanceOf(SubjectCipherResolver);
    expect(await resolver.sealing()).toBeInstanceOf(FieldCipher);
    expect(await resolver.opening("usr_live")).toBeInstanceOf(FieldCipher);
    expect(await resolver.opening("usr_erased")).toBeUndefined();
  });
});
