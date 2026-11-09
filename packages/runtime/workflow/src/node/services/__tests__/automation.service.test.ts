/**
 * Stackra file contract:
 * Purpose: unit tests of `AutomationService`: `open` stores an automation of the key in the scope; `draft` checks the
 *          document, refuses another key, and stores it as the next revision with its version set to that number;
 *          `dryRun` reports and records the revision; `publish` refuses a revision without a dry run or past the
 *          publisher's access and otherwise stamps it with the trigger, principal and publisher; `revision` reads the
 *          published one; `triggered` lists the published automations of a block with their documents and pauses one
 *          whose publisher lost access, and checks each against its scope's `AutomationQuota` (allowed starts; exceeded
 *          skips with `quota_exceeded`; unavailable, unreachable or unknown skips with
 *          `quota_unavailable` and never throws, for an event or a schedule start; with `last: false` an event start's
 *          unreadable quota throws a retryable refusal instead, while an exceeded one and a schedule start still record); `recheck` pauses the same; `pause` pauses for a host's reason once and refuses
 *          a reason that is not a code; `seed` creates, skips, keeps a tenant's edit and updates; `seedPack` seeds each
 *          template.
 * Boundary: test only; a fake `Database` hands out a recording entity manager, so no database runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0122 (decision 3); ADR 0153 (decision 2); ADR 0423 (decisions 1 and 2);
 *                     config-model sections 5 and 6.
 */
import { Action } from "@stackra/actions";
import { ScopeOwnership } from "@stackra/actions/contracts";
import { Driver } from "@stackra/container";
import { Revision } from "@stackra/content/node";
import { ActorKind, Realm } from "@stackra/contracts";
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
  AutomationPrincipalMismatchError,
  AutomationQuota,
  AutomationQuotaAnswer,
  AutomationQuotaUnavailableError,
  AutomationStart,
  BlockKind,
  DryRunOutcome,
  MemoryPublisherAccessDriver,
  registerBlocks,
  SeedResult,
  UnlimitedAutomationQuotaDriver,
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

class SendSmsAction extends Action({
  key: "sms.send",
  actors: [ActorKind.System],
}) {
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

const PUBLISHER: Actor = {
  kind: ActorKind.User,
  id: "usr_01j9z3k4m5n6p7q8r9s0t1v2w3",
  realm: Realm.Staff,
};

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
        : // oxlint-disable-next-line unicorn/prefer-array-find -- reason: findLast is ES2023 and the base lib is ES2022
          (created.filter((row) => row instanceof Revision).at(-1) ?? revisions[0]),
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

/** A resolver that binds only `bound`, each under its port too, as the container binds a driver. */
const resolverOf = (bound: readonly object[] = []) => {
  const find = (token: unknown) =>
    bound.find((instance) => typeof token === "function" && instance instanceof token);
  return {
    has: (token: unknown) => find(token) !== undefined,
    get: <T extends object>(token: unknown) => find(token) as T,
  };
};

/** A connected service that binds no `ScopeOwnership`, as a member without tenancy is; every run allowed unless `quota` says. */
const serviceOf = (quota: AutomationQuota = new UnlimitedAutomationQuotaDriver()) => {
  const service = new AutomationService(new RevisionRepository(), access, quota);
  service.connect(resolverOf());
  return service;
};

beforeEach(() => {
  access = new MemoryPublisherAccessDriver();
  access.grant(PUBLISHER.id, ["sms.send"]);
  access.grant(PRINCIPAL.id, ["sms.send"]);
});

afterEach(() => {
  vi.restoreAllMocks();
});

/** A dry-run automation to publish. */
const ready = () => {
  const automation = storedAutomation({ dryRunRevision: 1 });
  connect([automation], [storedRevision(automation, 1, { document: { ...DOCUMENT, version: 1 } })]);
  return automation;
};

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

  describe("the principal check", () => {
    class OwnsAcme extends Driver(ScopeOwnership) {
      async holds(actor: Actor): Promise<boolean> {
        return actor.scopeId === undefined || actor.scopeId === SCOPE.id;
      }
    }
    const stranger: Actor = { ...PRINCIPAL, scopeId: "scp_01j9z3k4m5n6p7q8r9s0t1v2w9" };
    const scoped: Actor = { ...PRINCIPAL, scopeId: SCOPE.id };

    it("refuses to publish when the service was never connected", async () => {
      const automation = ready();
      const service = new AutomationService(
        new RevisionRepository(),
        access,
        new UnlimitedAutomationQuotaDriver(),
      );
      await expect(service.publish(automation.id, 1, PRINCIPAL, PUBLISHER)).rejects.toThrow(
        /AutomationService is not connected/,
      );
      expect(automation.publishedRevision).toBeNull();
    });

    it("refuses a tenant principal when no ScopeOwnership is bound, since nothing can verify it", async () => {
      const automation = ready();
      const refused = await serviceOf()
        .publish(automation.id, 1, scoped, PUBLISHER)
        .catch((error: unknown) => error);
      expect(isRefusal(refused, AutomationPrincipalMismatchError)).toBe(true);
      expect(automation.publishedRevision).toBeNull();
    });

    it("lets a platform principal through when no ScopeOwnership is bound", async () => {
      const automation = ready();
      await serviceOf().publish(automation.id, 1, PRINCIPAL, PUBLISHER);
      expect(automation.publishedRevision).toBe(1);
    });

    it("lets a matching principal through and refuses a mismatched one when the port is bound", async () => {
      const automation = ready();
      const service = new AutomationService(
        new RevisionRepository(),
        access,
        new UnlimitedAutomationQuotaDriver(),
      );
      service.connect(resolverOf([new OwnsAcme()]));
      const refused = await service
        .publish(automation.id, 1, stranger, PUBLISHER)
        .catch((error: unknown) => error);
      expect(isRefusal(refused, AutomationPrincipalMismatchError)).toBe(true);
      expect(automation.publishedRevision).toBeNull();
      await service.publish(automation.id, 1, scoped, PUBLISHER);
      expect(automation.publishedRevision).toBe(1);
    });
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

  it("pauses for a host's reason once, recording AutomationPaused, and refuses a reason that is not a code", async () => {
    const automation = storedAutomation({ publishedRevision: 1, pausedAt: null });
    connect([automation]);
    const record = vi.spyOn(automation, "record");

    expect(await serviceOf().pause(automation.id, "failure_threshold")).toBe(true);
    expect(automation.pauseReason).toBe("failure_threshold");
    expect(automation.pausedAt).toBeInstanceOf(Date);
    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({
        automationId: automation.id,
        reason: "failure_threshold",
        blocks: [],
      }),
    );
    expect(await serviceOf().pause(automation.id, "paused_by_user")).toBe(false);
    expect(automation.pauseReason).toBe("failure_threshold");
    await expect(serviceOf().pause(automation.id, "Too many failures")).rejects.toBeInstanceOf(
      TypeError,
    );
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

/** One published automation of the scope, connected, with its `record` spied. */
const published = () => {
  const automation = storedAutomation({
    publishedRevision: 1,
    principal: PRINCIPAL,
    publisher: PUBLISHER,
    trigger: "orders.order_paid",
  });
  connect([automation], [storedRevision(automation, 1, { document: { ...DOCUMENT, version: 1 } })]);
  return { automation, record: vi.spyOn(automation, "record") };
};

describe("AutomationService automation quota", () => {
  /** A quota that gives `answer`, or throws when it is an `Error`, recording what it was asked. */
  class FixedQuota extends Driver(AutomationQuota) {
    readonly asked: [ScopeRef, string][] = [];

    readonly answer: AutomationQuotaAnswer | Error;

    constructor(answer: AutomationQuotaAnswer | Error) {
      super();
      this.answer = answer;
    }

    async check(scope: ScopeRef, automationId: string): Promise<AutomationQuotaAnswer> {
      this.asked.push([scope, automationId]);
      if (this.answer instanceof Error) throw this.answer;
      return this.answer;
    }
  }

  for (const startedBy of [AutomationStart.Event, AutomationStart.Schedule])
    it(`starts the run when the tenant's quota allows it (${startedBy})`, async () => {
      const { automation, record } = published();
      const quota = new FixedQuota(AutomationQuotaAnswer.Allow);
      const started = await serviceOf(quota).triggered("orders.order_paid", startedBy);
      expect(started.map((one) => one.automationId)).toEqual([automation.id]);
      expect(quota.asked).toEqual([[SCOPE, automation.id]]);
      expect(record).not.toHaveBeenCalled();
    });

  for (const startedBy of [AutomationStart.Event, AutomationStart.Schedule])
    it(`skips the run over the quota and records quota_exceeded, never a failure (${startedBy})`, async () => {
      const { automation, record } = published();
      const started = await serviceOf(new FixedQuota(AutomationQuotaAnswer.Exceeded)).triggered(
        "orders.order_paid",
        startedBy,
      );
      expect(started).toEqual([]);
      expect(record).toHaveBeenCalledWith(
        expect.objectContaining({
          automationId: automation.id,
          key: DOCUMENT.key,
          reason: "quota_exceeded",
          startedBy,
        }),
      );
      expect(automation.pausedAt ?? null).toBeNull();
    });

  for (const startedBy of [AutomationStart.Event, AutomationStart.Schedule])
    it(`skips the run when the quota is unavailable, unreachable or unknown, recording quota_unavailable and never throwing (${startedBy})`, async () => {
      const unknown = "maybe" as unknown as AutomationQuotaAnswer;
      for (const answer of [
        AutomationQuotaAnswer.Unavailable,
        new Error("usage service unreachable"),
        unknown,
      ]) {
        const { automation, record } = published();
        const started = await serviceOf(new FixedQuota(answer)).triggered(
          "orders.order_paid",
          startedBy,
        );
        expect(started).toEqual([]);
        expect(record).toHaveBeenCalledWith(
          expect.objectContaining({
            automationId: automation.id,
            reason: "quota_unavailable",
            startedBy,
          }),
        );
      }
    });

  it("throws a retryable refusal for an unreadable quota on an event start a retry follows, and records nothing", async () => {
    const { record } = published();
    const refused = await serviceOf(new FixedQuota(AutomationQuotaAnswer.Unavailable))
      .triggered("orders.order_paid", AutomationStart.Event, { last: false })
      .catch((error: unknown) => error);
    expect(refused).toBeInstanceOf(AutomationQuotaUnavailableError);
    expect(isRefusal(refused) && refused.retryable).toBe(true);
    expect(record).not.toHaveBeenCalled();
  });

  it("still records an exceeded quota, and a schedule start's unreadable one, when a retry follows", async () => {
    const exceeded = published();
    await expect(
      serviceOf(new FixedQuota(AutomationQuotaAnswer.Exceeded)).triggered(
        "orders.order_paid",
        AutomationStart.Event,
        { last: false },
      ),
    ).resolves.toEqual([]);
    expect(exceeded.record).toHaveBeenCalledWith(
      expect.objectContaining({ reason: "quota_exceeded" }),
    );
    const scheduled = published();
    await expect(
      serviceOf(new FixedQuota(AutomationQuotaAnswer.Unavailable)).triggered(
        "orders.order_paid",
        AutomationStart.Schedule,
        { last: false },
      ),
    ).resolves.toEqual([]);
    expect(scheduled.record).toHaveBeenCalledWith(
      expect.objectContaining({ reason: "quota_unavailable" }),
    );
  });

  it("allows every run with the unlimited driver a host picks on purpose", async () => {
    const quota: AutomationQuota = new UnlimitedAutomationQuotaDriver();
    await expect(quota.check(SCOPE, "wfa_01j9z3k4m5n6p7q8r9s0t1v2w3")).resolves.toBe(
      AutomationQuotaAnswer.Allow,
    );
  });
});
