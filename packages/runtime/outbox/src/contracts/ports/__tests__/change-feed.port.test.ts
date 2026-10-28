/**
 * Stackra file contract:
 * Purpose: unit tests of the `ChangeFeed` port: it is a `Port` whose class is its token, keyed `outbox.ChangeFeed`, and
 *          a driver subclass implements its six methods.
 * Boundary: test only; a minimal in-test driver stands in for a real one.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0142 (drivers behind ports); ADR 0078 and ADR 0221 (2026-10-28
 *                     amendment).
 */
import { Driver } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { ChangeFeed } from "#contracts/ports/change-feed.port";
import type { ChangeCursor } from "#contracts/types/change-cursor.type";
import type { ChangeLogReport } from "#contracts/types/change-log-report.type";
import type { ChangeRecord } from "#contracts/types/change-record.type";

/** A feed that keeps nothing. */
class NullChangeFeed extends Driver(ChangeFeed) {
  async append(): Promise<void> {}

  async read(): Promise<readonly ChangeRecord[]> {
    return [];
  }

  async positionAt(): Promise<string | undefined> {
    return undefined;
  }

  async cursor(): Promise<ChangeCursor | undefined> {
    return undefined;
  }

  async save(): Promise<void> {}

  async maintain(): Promise<ChangeLogReport> {
    return { created: 0, dropped: 0 };
  }
}

describe("ChangeFeed", () => {
  it("is a port a driver implements", async () => {
    const feed: ChangeFeed = new NullChangeFeed();
    expect(feed).toBeInstanceOf(ChangeFeed);
    expect(feed).toBeInstanceOf(Port);
    await expect(feed.read(undefined, ["Product"], 10)).resolves.toEqual([]);
  });

  it("is keyed outbox.ChangeFeed", () => {
    expectTypeOf<ChangeFeed["~key"]>().toEqualTypeOf<"outbox.ChangeFeed">();
  });
});
