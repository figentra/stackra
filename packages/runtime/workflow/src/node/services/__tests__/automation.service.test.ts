/**
 * Stackra file contract:
 * Purpose: unit tests of `AutomationService`: `open` stores an automation of the key in the scope; `draft` checks the
 *          document, refuses another key, and stores it as the next revision with its version set to that number;
 *          `dryRun` reports and records the revision; `publish` refuses a revision without a dry run or past the
 *          publisher's access and otherwise stamps it with the trigger, principal and publisher; `revision` reads the
 *          published one; `triggered` lists the published automations of a block with their documents and pauses one
 *          whose publisher lost access; `recheck` pauses the same; `seed` creates, skips, keeps a tenant's edit and
 *          updates; `seedPack` seeds each template.
 * Boundary: test only; a fake `Database` hands out a recording entity manager, so no database runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0122 (decision 3); ADR 0153 (decision 2); ADR 0423 (decisions 1 and 2);
 *                     config-model sections 5 and 6.
 */
import { Action } from "@stackra/actions";
import { Revision } from "@stackra/content/node";
import { ActorKind } from "@stackra/contracts";
import type { Actor, ScopeRef } from "@stackra/contracts";
import { CrudService, Database, registerModelPartners } from "@stackra/database";
import { isRefusal } from "@stackra/errors";
import { DomainEvent } from "@stackra/events";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import {
  AutomationExceedsPublisherError,
  AutomationInvalidError,
  AutomationNotDryRunError,
  BlockKind,
  DryRunOutcome,
  MemoryPublisherAccessDriver,
  registerBlocks,
  SeedResult,
} from "#core/index";
import { Automation } from "#node/models/automation.model";
import { AutomationService } from "#node/services/automation.service";

/** The revisions repository, as `repositoryOf(Revision)` makes it, without its abstract type. */
class RevisionRepository extends CrudService<Revision> {}

registerModelPartners([
  [AutomationService, Automation],
  [RevisionRepository, Revision],
]);

class OrderPaid extends DomainEvent {}

class SendSmsAction extends Action({ key: "sms.send", actors: [ActorKind.System] }) {
  async handle(): Promise<void> {}
}

registerBlocks([
  {
    key: "orders.order_paid",
    kind: BlockKind.Trigger,
    type: OrderPaid,
    label: "orders::blocks.paid",
  },
  { key: "sms.send", kind: BlockKind.Action, type: SendSmsAction, label: "sms::blocks.send" },
]);

const SCOPE: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1", path: "platform.acme" };

const PRINCIPAL: Actor = { kind: ActorKind.System, id: "sys_automation" };

const PUBLISHER: Actor = { kind: ActorKind.User, id: "usr_01j9z3k4m5n6p7q8r9s0t1v2w3" };

const DOCUMENT = {
  key: "commerce.thanks",
  trigger: { block: "orders.order_paid" },
  steps: [{ name: "thank", block: "sms.send", input: { text: "Thanks" } }],
};

/** A stored automation. */
const storedAutomation = (fields: Partial<Automation> = {}): Automation =>
  Object.assign(new Automation(), {
    scopeId: SCOPE.id,
    scopePath: SCOPE.path,
    key: DOCUMENT.key,
    ...fields,
  });

/** A stored revision of `automation`. */
const storedRevision = (automation: Automation, number: number, data: object): Revision =>
  Object.assign(new Revision(), {
    scopeId: SCOPE.id,
    scopePath: SCOPE.path,
    model: "workflow.automation",
    recordId: automation.id,
    number,
    data,
    publishedAt: null,
  });

/**
 * Connects a recording entity manager: `automations` are the rows `findOne`, `find` and `findOneOrFail` give (a created
 * row too), `revisions` the revision rows; every created row is kept.
 */
function connect(automations: Automation[], revisions: Revision[] = []) {
  const created: object[] = [];
  const em = {
    findOne: vi.fn(async (model: unknown) =>
      model === Automation ? (automations[0] ?? null) : (revisions[0] ?? null),
    ),
    findOneOrFail: vi.fn(async (model: unknown) =>
      model === Automation
        ? (automations[0] ?? created.find((row) => row instanceof Automation))
        : (created.findLast((row) => row instanceof Revision) ?? revisions[0]),
    ),
    find: vi.fn(async (model: unknown) => (model === Automation ? automations : revisions)),
    count: vi.fn(async () => revisions.length),
    create: vi.fn((Row: new () => object, data: object) => {
      const row = Object.assign(new Row(), data);
      created.push(row);
      return row;
    }),
    flush: vi.fn(async () => undefined),
    transactional: vi.fn(async (work: (manager: unknown) => Promise<unknown>) => work(em)),
  };
  vi.spyOn(Database, "current").mockReturnValue({
    em: () => em as unknown as ReturnType<Database["em"]>,
  } as unknown as Database);
  return { em, created };
}

/** The grants every test starts from: the publisher and the seed principal may send an SMS. */
let access = new MemoryPublisherAccessDriver();

const serviceOf = () => new AutomationService(new RevisionRepository(), access);

beforeEach(() => {
  access = new MemoryPublisherAccessDriver();
  access.grant(PUBLISHER.id, ["sms.send"]);
  access.grant(PRINCIPAL.id, ["sms.send"]);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe(AutomationService, () => {
  it("opens an automation of the key in the scope", async () => {
    connect([]);
    const automation = await serviceOf().open(SCOPE, DOCUMENT.key);
    expect(automation).toMatchObject({ scopeId: SCOPE.id, key: DOCUMENT.key });
    expect(automation.id).toMatch(/^wfa_/);
  });

  it("drafts a checked document as the next revision, its version that number", async () => {
    const automation = storedAutomation();
    const { created } = connect([automation], [storedRevision(automation, 1, {})]);
    expect(await serviceOf().draft(automation.id, DOCUMENT)).toBe(2);
    expect((created[0] as Revision).data).toEqual({ document: { ...DOCUMENT, version: 2 } });
    const other = await serviceOf()
      .draft(automation.id, { ...DOCUMENT, key: "commerce.other" })
      .catch((error: unknown) => error);
    expect(isRefusal(other, AutomationInvalidError)).toBe(true);
  });

  it("publishes only a dry-run revision, with its trigger and principal", async () => {
    const automation = storedAutomation();
    const revision = storedRevision(automation, 1, { document: { ...DOCUMENT, version: 1 } });
    connect([automation], [revision]);
    const early = await serviceOf()
      .publish(automation.id, 1, PRINCIPAL, PUBLISHER)
      .catch((error: unknown) => error);
    expect(isRefusal(early, AutomationNotDryRunError)).toBe(true);

    const report = await serviceOf().dryRun(automation.id, 1, {}, new Date("2026-10-25T09:00:00Z"));
    expect(report.steps[0]?.outcome).toBe(DryRunOutcome.Run);
    expect(automation.dryRunRevision).toBe(1);
    await serviceOf().publish(automation.id, 1, PRINCIPAL, PUBLISHER);
    expect(revision.publishedAt).not.toBeNull();
    expect(automation).toMatchObject({
      publishedRevision: 1,
      trigger: "orders.order_paid",
      principal: PRINCIPAL,
      publisher: PUBLISHER,
      pausedAt: null,
    });
    expect((await serviceOf().revision(automation.id)).number).toBe(1);
  });

  it("refuses a publish that calls a block the publisher may not call", async () => {
    const automation = storedAutomation({ dryRunRevision: 1 });
    connect(
      [automation],
      [storedRevision(automation, 1, { document: { ...DOCUMENT, version: 1 } })],
    );
    access.revoke(PUBLISHER.id);
    const refused = await serviceOf()
      .publish(automation.id, 1, PRINCIPAL, PUBLISHER)
      .catch((error: unknown) => error);
    expect(isRefusal(refused, AutomationExceedsPublisherError)).toBe(true);
    expect((refused as AutomationExceedsPublisherError).blocks).toEqual(["sms.send"]);
    expect(automation.publishedRevision).toBeNull();
  });

  it("pauses an automation whose publisher lost access instead of starting it, and recheck does too", async () => {
    const published = {
      publishedRevision: 1,
      principal: PRINCIPAL,
      publisher: PUBLISHER,
      trigger: "orders.order_paid",
    };
    const automation = storedAutomation(published);
    connect(
      [automation],
      [storedRevision(automation, 1, { document: { ...DOCUMENT, version: 1 } })],
    );
    access.revoke(PUBLISHER.id, ["sms.send"]);
    expect(await serviceOf().triggered("orders.order_paid")).toEqual([]);
    expect(automation).toMatchObject({ pauseReason: "publisher_access_lost" });
    expect(automation.pausedAt).toBeInstanceOf(Date);

    const other = storedAutomation(published);
    connect([other], [storedRevision(other, 1, { document: { ...DOCUMENT, version: 1 } })]);
    expect(await serviceOf().recheck()).toEqual([other.id]);
    expect(other.pauseReason).toBe("publisher_access_lost");
  });

  it("lists the published automations a trigger starts", async () => {
    const automation = storedAutomation({
      publishedRevision: 1,
      principal: PRINCIPAL,
      publisher: PUBLISHER,
      trigger: "orders.order_paid",
    });
    connect(
      [automation],
      [storedRevision(automation, 1, { document: { ...DOCUMENT, version: 1 } })],
    );
    expect(await serviceOf().triggered("orders.order_paid")).toEqual([
      { automationId: automation.id, document: { ...DOCUMENT, version: 1 }, principal: PRINCIPAL },
    ]);
  });

  it("seeds a template: creates, skips the same version, keeps a tenant's edit, updates its own", async () => {
    const { created } = connect([]);
    expect(await serviceOf().seed(SCOPE, DOCUMENT, "1.0.0", PRINCIPAL)).toBe(SeedResult.Created);
    expect(created[0]).toMatchObject({
      seedVersion: "1.0.0",
      publishedRevision: 1,
      principal: PRINCIPAL,
      publisher: PRINCIPAL,
    });
    expect((created[1] as Revision).data["seed"]).toEqual({ version: "1.0.0" });

    const seeded = storedAutomation({ seedVersion: "1.0.0" });
    connect([seeded]);
    expect(await serviceOf().seed(SCOPE, DOCUMENT, "1.0.0", PRINCIPAL)).toBe(SeedResult.Current);
    connect([seeded], [storedRevision(seeded, 2, { document: DOCUMENT })]);
    expect(await serviceOf().seed(SCOPE, DOCUMENT, "1.1.0", PRINCIPAL)).toBe(SeedResult.Kept);
    connect(
      [seeded],
      [storedRevision(seeded, 1, { document: DOCUMENT, seed: { version: "1.0.0" } })],
    );
    expect(await serviceOf().seed(SCOPE, DOCUMENT, "1.1.0", PRINCIPAL)).toBe(SeedResult.Updated);
    expect(seeded.seedVersion).toBe("1.1.0");
  });

  it("seeds every template of a pack", async () => {
    connect([]);
    const pack = { key: "commerce", version: "1.0.0", templates: [DOCUMENT] };
    expect(await serviceOf().seedPack(SCOPE, pack, PRINCIPAL)).toEqual({
      "commerce.thanks": SeedResult.Created,
    });
  });
});
