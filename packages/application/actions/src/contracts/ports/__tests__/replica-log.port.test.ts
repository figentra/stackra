/**
 * Stackra file contract:
 * Purpose: unit tests of the `ReplicaLog` port: it is an abstract `Port` (its own token, never built directly) and a
 *          driver appends, reports its head and reads after a position.
 * Boundary: test only; the driver here is a stand-in for the implementing package's (no scope filtering).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0263 (ports); ADR 0338 (decision 3).
 */
import { Driver } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { ReplicaLog } from "#contracts/ports/replica-log.port";
import type { ReplicaChange } from "#contracts/types/replica-change.type";
import type { ReplicaRead } from "#contracts/types/replica-read.type";

class ListDriver extends Driver(ReplicaLog) {
  readonly changes: ReplicaChange[] = [];

  async append(_partition: string, changes: readonly ReplicaChange[]): Promise<number> {
    this.changes.push(...changes);
    return this.changes.length;
  }

  async head(): Promise<number> {
    return this.changes.length;
  }

  async read(_partition: string, after: number, limit: number): Promise<ReplicaRead | undefined> {
    if (after > this.changes.length) return undefined;
    const changes = this.changes.slice(after, after + limit);
    const position = after + changes.length;
    return { changes, position, more: position < this.changes.length };
  }
}

describe("ReplicaLog", () => {
  it("is an abstract port", () => {
    expect(ReplicaLog.prototype).toBeInstanceOf(Port);
  });

  it("is implemented by a driver", async () => {
    const driver: ReplicaLog = new ListDriver();
    expect(
      await driver.append(
        "p",
        [
          { id: "sal_1", row: { id: "sal_1", at: new Date(0), data: { total: 5 } } },
          { id: "sal_2" },
        ],
        undefined,
      ),
    ).toBe(2);
    expect(await driver.head("p")).toBe(2);
    expect(await driver.read("p", 1, 10, undefined)).toEqual({
      changes: [{ id: "sal_2" }],
      position: 2,
      more: false,
    });
    expect(await driver.read("p", 3, 10, undefined)).toBeUndefined();
  });
});
