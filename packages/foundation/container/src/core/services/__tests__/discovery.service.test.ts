/**
 * Stackra file contract:
 * Purpose: unit tests of `DiscoveryService`: `classesWith(D)` yields `{ instance, className, options }` for every
 *          built instance whose class carries the class decorator `D`, inherited marks included, and refuses a field
 *          or method decorator; an Explorer finds them in `onApplicationBootstrap()`.
 * Boundary: test only; a hand-written wiring of the shape gen writes.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0144 as amended by
 *                     0263 (Explorers).
 */
import { describe, expect, it } from "@stackra/testing";

import { Explorer } from "#core/bases/explorer.base";
import { Service } from "#core/bases/service.base";
import { createDecorator } from "#core/functions/create-decorator.function";
import { Container } from "#core/services/container.service";
import { DiscoveryService } from "#core/services/discovery.service";
import type { DiscoveredClass } from "#core/types/discovered-class.type";
import type { Wiring } from "#core/types/wiring.type";

const Audited = createDecorator<{ readonly level: number }>({
  kind: "audited",
  target: "class",
  kinds: ["service"],
});

const Watched = createDecorator<boolean>({ kind: "watched", target: "field", kinds: ["service"] });

@Audited({ level: 1 })
class CustomerReads extends Service {}

class VipReads extends CustomerReads {}

class PlainReads extends Service {}

class AuditExplorer extends Explorer {
  readonly found: DiscoveredClass<{ readonly level: number }>[] = [];

  private readonly discovery: DiscoveryService;

  constructor(discovery: DiscoveryService) {
    super();
    this.discovery = discovery;
  }

  onApplicationBootstrap(): void {
    this.found.push(...this.discovery.classesWith(Audited));
  }
}

const wiring: Wiring = {
  member: "reads",
  bindings: [
    { module: "reads", kind: "service", provide: CustomerReads, deps: [] },
    { module: "reads", kind: "service", provide: VipReads, deps: [] },
    { module: "reads", kind: "service", provide: PlainReads, deps: [] },
    { module: "reads", kind: "explorer", provide: AuditExplorer, deps: [DiscoveryService] },
  ],
};

describe("DiscoveryService", () => {
  it("yields every built instance whose class carries the decorator, with its options", async () => {
    const container = await Container.create([wiring]);
    const found = container.get(DiscoveryService).classesWith(Audited);
    expect(found.map(({ className, options }) => [className, options])).toEqual([
      ["CustomerReads", { level: 1 }],
      ["VipReads", { level: 1 }],
    ]);
    expect(found[0]?.instance).toBe(container.get(CustomerReads));
  });

  it("is what an Explorer reads once every binding is built", async () => {
    const container = await Container.create([wiring]);
    expect(container.get(AuditExplorer).found.map((entry) => entry.className)).toEqual([
      "CustomerReads",
      "VipReads",
    ]);
  });

  it("refuses a field or method decorator", async () => {
    const container = await Container.create([wiring]);
    expect(() => container.get(DiscoveryService).classesWith(Watched)).toThrow(TypeError);
  });
});
