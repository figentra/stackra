/**
 * Stackra file contract:
 * Purpose: unit tests of `observedLogger`, `tallyQueries` and `queryOverrun`: each logged statement counts in every
 *          running frame by shape, transaction control is skipped, observers get a value-free sample and a throwing
 *          observer is ignored, and an overrun names the count and the repeated shapes.
 * Boundary: test only; statements are fed to the logger as MikroORM's connection would, no database runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); data-layer gaps scale-performance 7 and 8 (STA-1400).
 */
import { describe, expect, it } from "@stackra/testing";

import { QueryObserver } from "#contracts/ports/query-observer.port";
import type { QuerySample } from "#contracts/types/query-sample.type";
import { observedLogger } from "#node/functions/observed-logger.function";
import { queryOverrun } from "#node/functions/query-overrun.function";
import { tallyQueries } from "#node/functions/tally-queries.function";

/** An observer that keeps every sample. */
class KeepingObserver extends QueryObserver {
  readonly samples: QuerySample[] = [];

  override observe(sample: QuerySample): void {
    this.samples.push(sample);
  }
}

/** An observer that always throws. */
class ThrowingObserver extends QueryObserver {
  override observe(): void {
    throw new Error("broken");
  }
}

const writer = (): void => undefined;

describe("observedLogger", () => {
  it("counts each statement by shape in every running frame, skipping transaction control", async () => {
    const logger = observedLogger({ writer }, []);
    const outer = await tallyQueries(async () => {
      logger.logQuery({ query: "begin" });
      logger.logQuery({ query: `select * from "orders" where id = $1` });
      const inner = await tallyQueries(async () => {
        logger.logQuery({ query: `select * from "variants" where id = $1` });
        logger.logQuery({ query: `select * from "variants" where id = $1` });
      });
      logger.logQuery({ query: "commit" });
      return inner.tally;
    });
    expect(outer.output.queries).toBe(2);
    expect(outer.tally.queries).toBe(3);
    expect(outer.tally.shapes.get(`select * from "variants" where id = ?`)).toBe(2);
  });

  it("hands observers a sample without values and ignores one that throws", () => {
    const keeping = new KeepingObserver();
    const logger = observedLogger({ writer }, [new ThrowingObserver(), keeping]);
    logger.logQuery({
      query: `update "orders" set note = 'secret' where id = $1`,
      took: 12,
      affected: 1,
      connection: { type: "read" },
    });
    expect(keeping.samples).toEqual([
      {
        statement: `update "orders" set note = ? where id = ?`,
        verb: "update",
        table: "orders",
        durationMs: 12,
        rows: 1,
        failed: false,
        replica: true,
      },
    ]);
  });

  it("counts nothing outside a frame", () => {
    const keeping = new KeepingObserver();
    observedLogger({ writer }, [keeping]).logQuery({ query: "select 1", level: "error" });
    expect(keeping.samples[0]?.failed).toBe(true);
  });
});

describe("queryOverrun", () => {
  it("names the count over the budget and each shape over the repeats", async () => {
    const logger = observedLogger({ writer }, []);
    const { tally } = await tallyQueries(async () => {
      for (let i = 0; i < 3; i += 1)
        logger.logQuery({ query: `select * from "lines" where id = ${i}` });
    });
    expect(queryOverrun(tally, 5, 3)).toBeUndefined();
    expect(queryOverrun(tally, 2, 3)?.message).toBe("ran 3 statements, budget 2");
    expect(queryOverrun(tally, undefined, 2)?.repeated).toEqual([
      [`select * from "lines" where id = ?`, 3],
    ]);
  });
});
