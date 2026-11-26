/**
 * Stackra file contract:
 * Purpose: unit tests of `canViewAttachment`: a file is served only when the bound `AttachmentParentVisibility`
 *          answers a literal `true` for the actor and the parent; no driver refuses; a driver's error propagates; a
 *          malformed parent throws; with a cache the parent's service is asked once per actor.
 * Boundary: test only; an in-test driver over a fixed set of visible (parent, actor) pairs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0333 (2026-10-24 amendment); STA-1960.
 */
import { ActorKind, Realm } from "@stackra/contracts";
import type { Actor } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { canViewAttachment } from "#core/functions/can-view-attachment.function";
import { AttachmentParentVisibility } from "#core/ports/attachment-parent-visibility.port";
import type { AttachmentParent } from "#core/types/attachment-parent.type";
import { AttachmentVisibilityCache } from "#core/values/attachment-visibility-cache.value";

const MATTER: AttachmentParent = { model: "legal.matter", id: "mat_01j9z3k4m5n6p7q8r9s0t1v2w3" };
const WALLED: AttachmentParent = { model: "legal.matter", id: "mat_01j9z3k4m5n6p7q8r9s0t1v2w4" };
const LAWYER: Actor = {
  kind: ActorKind.User,
  id: "usr_01jab3k4m5n6p7q8r9s0t1v2w3",
  realm: Realm.Staff,
};
const OUTSIDER: Actor = {
  kind: ActorKind.User,
  id: "usr_01jab3k4m5n6p7q8r9s0t1v2w4",
  realm: Realm.Staff,
};

/** Lets the lawyer see the matter, nobody see the walled matter, and counts every question. */
class MatterVisibility extends AttachmentParentVisibility {
  asked = 0;

  override async canView(parent: AttachmentParent, actor: Actor): Promise<boolean> {
    this.asked += 1;
    return parent.id === MATTER.id && actor.id === LAWYER.id;
  }
}

/** Answers with whatever it is given, to prove only a literal `true` counts. */
class LooseVisibility extends AttachmentParentVisibility {
  /** The answer it gives. */
  private readonly value: unknown;

  constructor(value: unknown) {
    super();
    this.value = value;
  }

  override async canView(): Promise<boolean> {
    return this.value as boolean;
  }
}

/** Fails as a parent's service that cannot be reached. */
class DownVisibility extends AttachmentParentVisibility {
  override async canView(): Promise<boolean> {
    throw new Error("matters service unavailable");
  }
}

describe(canViewAttachment, () => {
  it("serves a file only to an actor the parent's service lets see the parent", async () => {
    const visibility = new MatterVisibility();
    expect(await canViewAttachment(visibility, MATTER, LAWYER)).toBe(true);
    expect(await canViewAttachment(visibility, MATTER, OUTSIDER)).toBe(false);
    expect(await canViewAttachment(visibility, WALLED, LAWYER)).toBe(false);
  });

  it("refuses when no AttachmentParentVisibility is bound", async () => {
    expect(await canViewAttachment(undefined, MATTER, LAWYER)).toBe(false);
  });

  it("counts only a literal true from the driver", async () => {
    for (const loose of [1, "true", {}, [], undefined, null])
      expect(await canViewAttachment(new LooseVisibility(loose), MATTER, LAWYER)).toBe(false);
    expect(await canViewAttachment(new LooseVisibility(true), MATTER, LAWYER)).toBe(true);
  });

  it("lets a driver's error reach the caller, so nothing is served on doubt", async () => {
    await expect(canViewAttachment(new DownVisibility(), MATTER, LAWYER)).rejects.toThrow(
      "matters service unavailable",
    );
  });

  it("throws on a parent without a <module>.<model> key or a public id", async () => {
    const visibility = new MatterVisibility();
    for (const model of ["matter", "Legal.Matter", "legal.", ".matter", "legal.matter.doc"])
      await expect(canViewAttachment(visibility, { model, id: MATTER.id }, LAWYER)).rejects.toThrow(
        TypeError,
      );
    for (const id of ["mat_short", "matter", "", "mat_01j9z3k4m5n6p7q8r9s0t1v2wu"])
      await expect(
        canViewAttachment(
          visibility,
          { model: MATTER.model, id: id as AttachmentParent["id"] },
          LAWYER,
        ),
      ).rejects.toThrow(TypeError);
    expect(visibility.asked).toBe(0);
  });

  it("asks the parent's service once per actor with a cache, and keeps actors apart", async () => {
    const visibility = new MatterVisibility();
    const cache = new AttachmentVisibilityCache();
    expect(await canViewAttachment(visibility, MATTER, LAWYER, cache)).toBe(true);
    expect(await canViewAttachment(visibility, MATTER, LAWYER, cache)).toBe(true);
    expect(visibility.asked).toBe(1);
    expect(await canViewAttachment(visibility, MATTER, OUTSIDER, cache)).toBe(false);
    expect(visibility.asked).toBe(2);
  });

  it("keeps the fail-closed rules with a cache", async () => {
    const cache = new AttachmentVisibilityCache();
    expect(await canViewAttachment(undefined, MATTER, LAWYER, cache)).toBe(false);
    expect(await canViewAttachment(new LooseVisibility("true"), MATTER, LAWYER, cache)).toBe(false);
    await expect(canViewAttachment(new DownVisibility(), WALLED, LAWYER, cache)).rejects.toThrow(
      "matters service unavailable",
    );
  });
});
