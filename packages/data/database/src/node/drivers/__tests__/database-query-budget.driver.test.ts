/**
 * Stackra file contract:
 * Purpose: unit tests of `DatabaseQueryBudgetDriver`: it is the actions `QueryBudget`, it passes the output through
 *          within the budget, warns with the key, count and repeated shapes over it, and fails in strict mode.
 * Boundary: test only; statements are fed to an observed logger inside the counted work, no database runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0142; data-layer gaps scale-performance 8 and model-orm 12 (STA-1400).
 */
import { QueryBudget } from "@stackra/actions/contracts";
import { buildConfig } from "@stackra/config";
import { Duration, Logger } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { DatabaseConfig } from "#config/database.config";
import { DatabaseQueryBudgetDriver } from "#node/drivers/database-query-budget.driver";
import { observedLogger } from "#node/functions/observed-logger.function";

/** A logger that keeps every warning. */
class KeepingLogger extends Logger {
  readonly warnings: [string, Readonly<Record<string, unknown>> | undefined][] = [];

  override debug(): void {}

  override info(): void {}

  override warn(event: string, fields?: Readonly<Record<string, unknown>>): void {
    this.warnings.push([event, fields]);
  }

  override error(): void {}
}

const orm = observedLogger({ writer: () => undefined }, []);

/** Work that runs `times` lookups of one shape and answers "done". */
function lookups(times: number): () => Promise<string> {
  return async () => {
    for (let i = 0; i < times; i += 1)
      orm.logQuery({ query: `select * from "variants" where id = $1` });
    return "done";
  };
}

/** The driver over a repeat limit of 3, strict or not. */
function driver(strict: boolean) {
  const logger = new KeepingLogger();
  const config = buildConfig(DatabaseConfig, {
    values: { queries: { slow: Duration.seconds(1), repeats: 3, strict } },
  });
  return { budget: new DatabaseQueryBudgetDriver(config, logger), logger };
}

describe("DatabaseQueryBudgetDriver", () => {
  it("is the actions QueryBudget", () => {
    expect(driver(false).budget).toBeInstanceOf(QueryBudget);
  });

  it("passes the output through within the budget", async () => {
    const { budget, logger } = driver(false);
    await expect(budget.within("order.list", 5, lookups(2))).resolves.toBe("done");
    expect(logger.warnings).toEqual([]);
  });

  it("warns with the key, count and repeated shape when over", async () => {
    const { budget, logger } = driver(false);
    await expect(budget.within("order.list", 2, lookups(4))).resolves.toBe("done");
    expect(logger.warnings).toEqual([
      [
        "database.query_budget_exceeded",
        {
          action: "order.list",
          queries: 4,
          budget: 2,
          repeated: [{ statement: `select * from "variants" where id = ?`, times: 4 }],
        },
      ],
    ]);
  });

  it("fails the call in strict mode", async () => {
    const { budget } = driver(true);
    await expect(budget.within("order.list", undefined, lookups(4))).rejects.toThrow(
      /order\.list ran 4 times \(limit 3\)/,
    );
  });
});
