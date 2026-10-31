/**
 * Stackra file contract:
 * Purpose: unit tests of the `CallIsolation` port: it is an abstract `Port` (its own token, never built directly) and
 *          a driver runs the work with the actor, the scope and the read-only flag it was given.
 * Boundary: test only; the driver here is a stand-in for the implementing package's.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0495.
 */
import { Driver } from "@stackra/container";
import { ActorKind, Port } from "@stackra/contracts";
import type { Actor, ScopeRef } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { CallIsolation } from "#contracts/ports/call-isolation.port";

const seen: unknown[] = [];

class RecordingDriver extends Driver(CallIsolation) {
  run<T>(
    actor: Actor,
    scope: ScopeRef | readonly ScopeRef[] | undefined,
    work: () => Promise<T>,
    options: { readonly readOnly: boolean },
  ): Promise<T> {
    seen.push([actor.id, scope, options.readOnly]);
    return work();
  }
}

describe("CallIsolation", () => {
  it("is an abstract port", () => {
    expect(CallIsolation.prototype).toBeInstanceOf(Port);
  });

  it("is implemented by a driver that runs the work", async () => {
    const actor: Actor = { kind: ActorKind.System, id: "sys_1" };
    await expect(
      new RecordingDriver().run(actor, undefined, async () => 7, { readOnly: true }),
    ).resolves.toBe(7);
    expect(seen).toEqual([["sys_1", undefined, true]]);
  });
});
