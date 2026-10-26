/**
 * Stackra file contract:
 * Purpose: unit tests of `ChecklistService`: `seed` creates the scope's copy, finds it current, and moves it to a new
 *          version keeping the customization; `applyProfile` shapes an uncustomized checklist and leaves a customized
 *          one; `customize` refuses a locked step and marks the checklist customized; `complete` records a scope step
 *          for the scope and a user step for the user, once, with `ChecklistStepCompleted`, and `ChecklistCompleted`
 *          when it leaves every visible step done; `view` reads the scope's and the user's progress.
 * Boundary: test only; a fake `Database` hands out a recording entity manager, so no database runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0424 (decisions 1 to 4).
 */
import { ActorKind } from "@stackra/contracts";
import type { Actor, ScopeRef } from "@stackra/contracts";
import { CrudService, Database, registerModelPartners } from "@stackra/database";
import { isRefusal } from "@stackra/errors";
import { takeRecordedEvents } from "@stackra/events";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import {
  ChecklistCompleted,
  ChecklistInvalidError,
  ChecklistStepCompleted,
  ChecklistTemplate$,
  SeedResult,
} from "#core/index";
import { Checklist } from "#node/models/checklist.model";
import { ChecklistProgress } from "#node/models/checklist-progress.model";
import { ChecklistService } from "#node/services/checklist.service";

/** The progress repository, as `repositoryOf(ChecklistProgress)` makes it, without its abstract type. */
class ProgressRepository extends CrudService<ChecklistProgress> {}

registerModelPartners([
  [ChecklistService, Checklist],
  [ProgressRepository, ChecklistProgress],
]);

const SCOPE: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1", path: "platform.acme" };

const OWNER: Actor = { kind: ActorKind.User, id: "usr_01j9z3k4m5n6p7q8r9s0t1v2w3" };

const TEMPLATE = {
  key: "workflow-template:commerce:onboarding",
  version: "1.0.0",
  steps: [
    {
      key: "verify_email",
      label: "commerce::onboarding.verify_email",
      locked: true,
      audience: "user",
    },
    { key: "connect_payments", label: "commerce::onboarding.connect_payments", locked: true },
    { key: "add_product", label: "commerce::onboarding.add_product" },
  ],
};

const PROFILE = {
  key: "salon",
  label: "commerce::industries.salon",
  checklists: { [TEMPLATE.key]: { hidden: ["add_product"] } },
};

/** A stored checklist of the scope. */
const storedChecklist = (fields: Partial<Checklist> = {}): Checklist =>
  Object.assign(new Checklist(), {
    scopeId: SCOPE.id,
    scopePath: SCOPE.path,
    key: TEMPLATE.key,
    template: ChecklistTemplate$.parse(TEMPLATE),
    ...fields,
  });

/** A stored completed step of `checklist`. */
const storedProgress = (checklist: Checklist, step: string, ownerId: string): ChecklistProgress =>
  Object.assign(new ChecklistProgress(), {
    scopeId: SCOPE.id,
    scopePath: SCOPE.path,
    checklistId: checklist.id,
    step,
    ownerId,
    completedBy: OWNER,
  });

/**
 * Connects a recording entity manager: `checklists` are the rows `findOne` and `findOneOrFail` give for a checklist,
 * `progress` the progress rows `find` gives, filtered by the query's step and owner for `findOne`; created rows are
 * kept and join `progress`.
 */
function connect(checklists: Checklist[], progress: ChecklistProgress[] = []) {
  const created: object[] = [];
  const em = {
    findOne: vi.fn(async (model: unknown, where: Record<string, unknown>) =>
      model === Checklist
        ? (checklists[0] ?? null)
        : (progress.find((row) => row.step === where["step"] && row.ownerId === where["ownerId"]) ??
          null),
    ),
    findOneOrFail: vi.fn(async () => checklists[0]),
    find: vi.fn(async () => progress),
    create: vi.fn((Row: new () => object, data: object) => {
      const row = Object.assign(new Row(), data);
      created.push(row);
      if (row instanceof ChecklistProgress) progress.push(row);
      return row;
    }),
    flush: vi.fn(async () => undefined),
    transactional: vi.fn(async (work: (manager: unknown) => Promise<unknown>) => work(em)),
  };
  vi.spyOn(Database, "current").mockReturnValue({
    em: () => em as unknown as ReturnType<Database["em"]>,
  } as unknown as Database);
  return { created };
}

const serviceOf = () => new ChecklistService(new ProgressRepository());

afterEach(() => {
  vi.restoreAllMocks();
});

describe(ChecklistService, () => {
  it("seeds the scope's copy, finds it current, and moves it forward keeping the customization", async () => {
    const { created } = connect([]);
    expect(await serviceOf().seed(SCOPE, TEMPLATE)).toBe(SeedResult.Created);
    expect(created[0]).toMatchObject({ scopeId: SCOPE.id, key: TEMPLATE.key });
    expect((created[0] as Checklist).id).toMatch(/^wfc_/);

    const seeded = storedChecklist({ hidden: ["add_product"], customized: true });
    connect([seeded]);
    expect(await serviceOf().seed(SCOPE, TEMPLATE)).toBe(SeedResult.Current);
    expect(await serviceOf().seed(SCOPE, { ...TEMPLATE, version: "1.1.0" })).toBe(
      SeedResult.Updated,
    );
    expect(seeded).toMatchObject({ hidden: ["add_product"], customized: true });
    expect(seeded.template.version).toBe("1.1.0");
  });

  it("applies an industry profile at sign-up, never over a scope's own customization", async () => {
    const fresh = storedChecklist();
    connect([fresh]);
    expect(await serviceOf().applyProfile(SCOPE, PROFILE)).toEqual([TEMPLATE.key]);
    expect(fresh).toMatchObject({ hidden: ["add_product"], profile: "salon" });

    const own = storedChecklist({ customized: true });
    connect([own]);
    expect(await serviceOf().applyProfile(SCOPE, PROFILE)).toEqual([]);
    expect(own.hidden).toEqual([]);
  });

  it("stores a customization of unlocked steps and refuses hiding a locked one", async () => {
    const checklist = storedChecklist();
    connect([checklist]);
    await serviceOf().customize(checklist.id, { order: ["add_product"] });
    expect(checklist).toMatchObject({ order: ["add_product"], customized: true });
    const refused = await serviceOf()
      .customize(checklist.id, { hidden: ["connect_payments"] })
      .catch((error: unknown) => error);
    expect(isRefusal(refused, ChecklistInvalidError)).toBe(true);
  });

  it("completes a scope step for the scope and a user step for the user, once", async () => {
    const checklist = storedChecklist();
    const { created } = connect([checklist]);
    expect(await serviceOf().complete(checklist.id, "connect_payments", OWNER)).toBe(true);
    expect(created[0]).toMatchObject({ step: "connect_payments", ownerId: SCOPE.id });
    expect(await serviceOf().complete(checklist.id, "connect_payments", OWNER)).toBe(false);
    expect(await serviceOf().complete(checklist.id, "verify_email", OWNER)).toBe(true);
    expect(created[1]).toMatchObject({ step: "verify_email", ownerId: OWNER.id });
    const events = takeRecordedEvents(checklist);
    expect(events.filter((event) => event instanceof ChecklistStepCompleted)).toHaveLength(2);
    expect(events.some((event) => event instanceof ChecklistCompleted)).toBe(false);
    const unknown = await serviceOf()
      .complete(checklist.id, "nope", OWNER)
      .catch((error: unknown) => error);
    expect(isRefusal(unknown, ChecklistInvalidError)).toBe(true);
  });

  it("records ChecklistCompleted for the user when the last visible step is done", async () => {
    const checklist = storedChecklist({ hidden: ["add_product"] });
    connect([checklist], [storedProgress(checklist, "connect_payments", SCOPE.id)]);
    await serviceOf().complete(checklist.id, "verify_email", OWNER);
    const completed = takeRecordedEvents(checklist).find(
      (event) => event instanceof ChecklistCompleted,
    );
    expect(completed).toEqual({ checklistId: checklist.id, key: TEMPLATE.key, userId: OWNER.id });
  });

  it("shows the scope's progress on scope steps and the user's own on user steps", async () => {
    const checklist = storedChecklist();
    connect(
      [checklist],
      [
        storedProgress(checklist, "connect_payments", SCOPE.id),
        storedProgress(checklist, "verify_email", "usr_01j9z3k4m5n6p7q8r9s0t1v2w9"),
      ],
    );
    const view = await serviceOf().view(checklist.id, OWNER.id);
    expect(view.steps.map((step) => [step.key, step.done])).toEqual([
      ["verify_email", false],
      ["connect_payments", true],
      ["add_product", false],
    ]);
    expect(view.complete).toBe(false);
  });
});
