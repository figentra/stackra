/**
 * Stackra file contract:
 * Purpose: unit tests of `TestingApp`: it reads the container by class and by named token, answers `has`, lists the
 *          modules it was given and shuts the container down on `close()`.
 * Boundary: test only; the app is built over a container booted directly, as `compile()` does.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 3); ADR 0263 (decision 12).
 */
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { Container, Driver, named, Service, type Wiring } from "#core/index";
import { TestingApp } from "#testing/services/testing-app.service";

abstract class Ledger extends Port {
  abstract balance(): number;
}

class MemoryLedgerDriver extends Driver(Ledger) {
  balance(): number {
    return 0;
  }
}

class Pool extends Service {
  closed = false;

  onApplicationShutdown(): void {
    this.closed = true;
  }
}

const wiring: Wiring = {
  member: "pool",
  bindings: [{ module: "pool", provide: Pool, deps: [] }],
  drivers: [{ port: Ledger, candidates: { memory: () => Promise.resolve(MemoryLedgerDriver) } }],
};

describe("TestingApp", () => {
  it("reads the container, lists its modules and closes it", async () => {
    const container = await Container.create([wiring]);
    const modules = [{ key: "pool", type: undefined, exports: [], dependsOn: [] }];
    const app = new TestingApp(container, modules);
    const pool = app.get(Pool);
    expect(app.get(named(Ledger, "primary"))).toBe(app.get(Ledger));
    expect(app.has(Ledger)).toBe(true);
    expect(app.modules).toBe(modules);
    await app.close();
    expect(pool.closed).toBe(true);
  });
});
