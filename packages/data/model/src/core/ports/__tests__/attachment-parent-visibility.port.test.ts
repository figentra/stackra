/**
 * Stackra file contract:
 * Purpose: unit tests of the `AttachmentParentVisibility` port: it is an abstract token a parent's owning service
 *          extends, answering false for a record the actor cannot see or that does not exist.
 * Boundary: test only; an in-test driver over one visible record.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0333 (2026-10-24 amendment); STA-1960.
 */
import { ActorKind, Port, Realm } from "@stackra/contracts";
import type { Actor } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { AttachmentParentVisibility } from "#core/ports/attachment-parent-visibility.port";
import type { AttachmentParent } from "#core/types/attachment-parent.type";

const LAWYER: Actor = {
  kind: ActorKind.User,
  id: "usr_01jab3k4m5n6p7q8r9s0t1v2w3",
  realm: Realm.Staff,
};

/** Knows one matter the lawyer can see. */
class OneMatterVisibility extends AttachmentParentVisibility {
  override async canView(parent: AttachmentParent, actor: Actor): Promise<boolean> {
    return parent.id === "mat_01j9z3k4m5n6p7q8r9s0t1v2w3" && actor.id === LAWYER.id;
  }
}

describe(AttachmentParentVisibility, () => {
  it("is a port a parent's service extends, answering false for a record it does not show", async () => {
    const visibility = new OneMatterVisibility();
    expect(visibility).toBeInstanceOf(AttachmentParentVisibility);
    expect(visibility).toBeInstanceOf(Port);
    expect(
      await visibility.canView(
        { model: "legal.matter", id: "mat_01j9z3k4m5n6p7q8r9s0t1v2w3" },
        LAWYER,
      ),
    ).toBe(true);
    expect(
      await visibility.canView(
        { model: "legal.matter", id: "mat_01j9z3k4m5n6p7q8r9s0t1v2w4" },
        LAWYER,
      ),
    ).toBe(false);
  });
});
