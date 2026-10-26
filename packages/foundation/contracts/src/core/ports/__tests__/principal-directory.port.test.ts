/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `PrincipalDirectory` port: it is a `Port`; an implementation answers a
 *          principal's supervisor in a scope, or `null`; the signature takes user ids and a scope only.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); STA-1237.
 */
import { describe, expect, it } from "@stackra/testing";

import { Port } from "#core/bases/port.base";
import { PrincipalDirectory } from "#core/ports/principal-directory.port";
import type { PublicId } from "#core/types/public-id.type";
import type { ScopeRef } from "#core/types/scope-ref.type";

const ACME: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1", path: "platform.acme" };
const GLOBEX: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w2", path: "platform.globex" };
const SARA: PublicId<"usr"> = "usr_01j9z3k4m5n6p7q8r9s0t1v2w3";
const OMAR: PublicId<"usr"> = "usr_01j9z3k4m5n6p7q8r9s0t1v2w4";

/** Reporting lines keyed by `<scope path>/<principal id>`. */
class MemoryDirectory extends PrincipalDirectory {
  private readonly lines: ReadonlyMap<string, PublicId<"usr">>;

  constructor(lines: ReadonlyMap<string, PublicId<"usr">>) {
    super();
    this.lines = lines;
  }

  override async supervisorOf(
    principalId: PublicId<"usr">,
    scope: ScopeRef,
  ): Promise<PublicId<"usr"> | null> {
    return this.lines.get(`${scope.path}/${principalId}`) ?? null;
  }
}

describe("PrincipalDirectory", () => {
  const directory: PrincipalDirectory = new MemoryDirectory(
    new Map([[`${ACME.path}/${SARA}`, OMAR]]),
  );

  it("is a port an implementation extends", () => {
    expect(directory).toBeInstanceOf(PrincipalDirectory);
    expect(directory).toBeInstanceOf(Port);
  });

  it("answers the supervisor inside the scope asked about", async () => {
    await expect(directory.supervisorOf(SARA, ACME)).resolves.toBe(OMAR);
    await expect(directory.supervisorOf(SARA, GLOBEX)).resolves.toBeNull();
  });

  it("answers null at the top of the tree", async () => {
    await expect(directory.supervisorOf(OMAR, ACME)).resolves.toBeNull();
  });

  it("takes user ids only", async () => {
    // @ts-expect-error -- an order id is not a user id
    await expect(
      directory.supervisorOf("ord_01j9z3k4m5n6p7q8r9s0t1v2w3", ACME),
    ).resolves.toBeNull();
  });
});
