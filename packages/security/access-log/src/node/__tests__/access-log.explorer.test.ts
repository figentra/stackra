/**
 * Stackra file contract:
 * Purpose: the conformance test of `AccessLogExplorer`: what it wraps at bootstrap is exactly what gen discovers at
 *          build time; a wrapped call writes one record with the call's id, its actor and the subject ids, a
 *          synchronous method stays synchronous, and a call that throws is still recorded.
 * Boundary: unit tier; a hand-written wiring of the shape gen writes, one logged fixture service, the memory sink and a
 *           fixed call context. `discoverWithGen` from @stackra/gen/testing takes the decorator itself as the key.
 * Runtime: node (vitest)
 * Governing contract: ADR 0144 as amended by 0294 (Explorers and conformance); ADR 0294 (decision 6); ADR 0212
 *                     (decision 5); ADR 0022.
 */
import { RequestContext } from "@stackra/actions";
import { ContextStorage } from "@stackra/actions/contracts";
import { fakeExtensionContext } from "@stackra/actions/testing";
import { buildConfig } from "@stackra/config";
import { Container, DiscoveryService, Module, Service } from "@stackra/container";
import type { Token, Wiring } from "@stackra/container";
import { ActorKind, Clock, DataClassification, Logger, Realm } from "@stackra/contracts";
import { discoverWithGen } from "@stackra/gen/testing";
import { describe, expect, Fake, it } from "@stackra/testing";

import { AccessLogConfig } from "#config/access-log.config";
import { AccessLogSink } from "#contracts/ports/access-log-sink.port";
import { AccessLogged } from "#core/decorators/access-logged.decorator";
import { MemoryAccessLogSinkDriver } from "#core/drivers/memory-access-log-sink.driver";
import { AccessLogService } from "#core/services/access-log.service";
import { AccessLogExplorer } from "#node/access-log.explorer";
import "#testing/to-have-logged-access.matcher";

/** The smallest host: one service whose reads return customer records. */
@AccessLogged({
  classification: DataClassification.Personal,
  subjects: "id",
})
class CustomerReads extends Service {
  /** Returns the customer record; its `id` is the logged subject. */
  async view(id: string): Promise<{ id: string }> {
    return { id };
  }

  /** A synchronous read. */
  label(id: string): { id: string; label: string } {
    return { id, label: `Customer ${id}` };
  }

  /** A refused write; the customer among its arguments is still logged. */
  async remove(customer: { id: string }): Promise<void> {
    throw new RangeError(`${customer.id} cannot be removed`);
  }
}

/** Shares the logged service, as a host module does. */
class FixtureModule extends Module({ exports: [CustomerReads] }) {}

/** Holds one call context for every caller. */
class FixedContextStorage extends ContextStorage {
  run<T>(_value: object, work: () => T): T {
    return work();
  }

  current(): object | undefined {
    return fakeExtensionContext({
      callId: "call_1",
      actor: { kind: ActorKind.User, id: "usr_staff", realm: Realm.Platform },
    });
  }
}

/** Records every log line; the methods are left to the spies (`declare` satisfies the abstract members). */
class LoggerFake extends Fake.of(Logger) {
  declare debug: Logger["debug"];

  declare info: Logger["info"];

  declare warn: Logger["warn"];

  declare error: Logger["error"];
}

const wiring: Wiring = {
  member: "access_log",
  bindings: [
    { module: "fixture", kind: "service", provide: CustomerReads, deps: [] },
    {
      module: "access_log",
      kind: "service",
      provide: AccessLogService,
      deps: [AccessLogSink, Logger, Clock, AccessLogConfig],
    },
    {
      module: "access_log",
      kind: "explorer",
      provide: AccessLogExplorer,
      deps: [DiscoveryService, AccessLogService, RequestContext],
    },
  ],
};

/** A container over the wiring, with the memory sink, a logger fake and the fixed call context. */
async function boot(): Promise<{ container: Container; sink: MemoryAccessLogSinkDriver }> {
  const sink = new MemoryAccessLogSinkDriver();
  const overrides = new Map<Token, object>([
    [AccessLogSink, sink],
    [Logger, new LoggerFake()],
    [AccessLogConfig, buildConfig(AccessLogConfig)],
    [RequestContext, new RequestContext(new FixedContextStorage())],
  ]);
  return { container: await Container.create([wiring], { overrides }), sink };
}

/** Guards the access-log wiring, since an unlogged read is a silent audit gap. */
describe("AccessLogExplorer", () => {
  // discoverWithGen compiles the member with TypeScript (9 s on CI), so this test gets gen's own 30 s budget.
  it("wraps exactly what gen discovers", { timeout: 30_000 }, async () => {
    const { container } = await boot();
    const discovered = await discoverWithGen(FixtureModule, AccessLogged);
    expect(container.get(AccessLogExplorer).targets()).toEqual(
      discovered.map((found) => found.target),
    );
    expect(container.get(AccessLogExplorer).targets()).toEqual([
      "CustomerReads.view",
      "CustomerReads.label",
      "CustomerReads.remove",
    ]);
  });

  it("records each call with the call's id, its actor and the subjects", async () => {
    const { container, sink } = await boot();
    await expect(container.get(CustomerReads).view("cus_1")).resolves.toEqual({ id: "cus_1" });
    expect(sink).toHaveLoggedAccess({
      target: "CustomerReads.view",
      subjects: ["cus_1"],
      actorId: "usr_staff",
    });
    expect(sink.records()[0]?.callId).toBe("call_1");
  });

  it("keeps a synchronous method synchronous and records a call that throws", async () => {
    const { container, sink } = await boot();
    const reads = container.get(CustomerReads);
    expect(reads.label("cus_2")).toEqual({ id: "cus_2", label: "Customer cus_2" });
    await expect(reads.remove({ id: "cus_3" })).rejects.toThrow(RangeError);
    await new Promise((settle) => {
      setTimeout(settle, 0);
    });
    expect(sink.records().map((record) => [record.target, record.subjects])).toEqual([
      ["CustomerReads.label", ["cus_2"]],
      ["CustomerReads.remove", ["cus_3"]],
    ]);
  });
});
