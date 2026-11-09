/**
 * Stackra file contract:
 * Purpose: tests of the detached-call hooks on PGlite (`MemoryDatabaseDriver`): a continuation started inside a
 *          transaction that has since committed, run through `runDetached`, is outside every transaction and its step
 *          commits its own write (the stream or agent loop an action starts in `handle`); inside a detached run a
 *          `CrudService` operation outside a transaction runs as one step, and inside a transaction it does not; what a step loads and
 *          changes is flushed before the step commits, with no explicit flush (the outbox writer, a flush subscriber,
 *          writes a recorded event in that same flush); two
 *          databases in one process keep their own step; and building a driver registers one wrapper in
 *          `DETACHED_RUNS`, which runs the work in the connected database.
 * Boundary: unit tier: PGlite runs in this process, no Docker. The step is a plain transaction here; the action
 *           pipeline's step goes through `CallIsolation`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0495 (decisions 1 and 2); ADR 0266 (memory first); ADR 0022; ADR 0269.
 */
import { EntitySchema } from "@mikro-orm/core";
import { DETACHED_RUNS } from "@stackra/actions/contracts";
import type { DetachedStep } from "@stackra/actions/contracts";
import { HasPublicId, Model } from "@stackra/model";
import { afterEach, describe, expect, it } from "@stackra/testing";

import { ACTIVE_DATABASE } from "#core/constants/active-database.constant";
import { registerEntities } from "#core/functions/register-entities.function";
import { repositoryOf } from "#core/functions/repository-of.function";
import { Database } from "#core/ports/database.port";
import type { Repository } from "#core/types/repository.type";
import { MemoryDatabaseDriver } from "#testing/drivers/memory-database.driver";

class Note extends Model.with(HasPublicId("note")) {
  body!: string;
}

registerEntities([
  new EntitySchema<Note>({
    class: Note,
    schema: "notes",
    tableName: "notes",
    properties: {
      id: { type: "string", primary: true, columnType: "varchar(33)" },
      body: { type: "text" },
    },
  }),
]);

/** A new repository of notes on the connected database. */
const notes = () => Reflect.construct(repositoryOf(Note), []) as Repository<Note>;

/** A step that runs its work as it is. */
const PASS: DetachedStep = (work) => work();

afterEach(async () => {
  await ACTIVE_DATABASE.current?.close();
}, 60_000);

// Each case boots a fresh PGlite (WASM Postgres plus four extensions), which takes seconds on a loaded runner.
describe("MemoryDatabaseDriver detached runs", { timeout: 60_000 }, () => {
  it("runs a continuation of a committed transaction outside it, and its step commits on its own", async () => {
    const database = new MemoryDatabaseDriver();
    const step: DetachedStep = (work) => database.transaction(work);
    const gate: { open?: () => void } = {};
    const opened = new Promise<void>((resolve) => {
      gate.open = resolve;
    });
    const { loop } = await database.transaction(async () => {
      await notes().insert({ id: "note_01ja0000000000000000000001", body: "the call" });
      // the loop an action starts in `handle`: it goes on after the call's transaction commits
      return {
        loop: opened.then(() =>
          database.runDetached(step, async () => {
            const outside = !database.em().isInTransaction();
            await step(async () => {
              await notes().insert({ id: "note_01ja0000000000000000000002", body: "a step" });
            });
            return outside;
          }),
        ),
      };
    });
    gate.open?.();
    expect(await loop).toBe(true);
    expect(await notes().count({})).toBe(2);
  });

  it("runs a CrudService operation outside a transaction as one step, and one inside a transaction as it is", async () => {
    const database = new MemoryDatabaseDriver();
    let steps = 0;
    const step: DetachedStep = (work) => {
      steps += 1;
      return database.transaction(work);
    };
    await database.runDetached(step, async () => {
      expect(Database.detached()).toBe(step);
      expect(await notes().count({})).toBe(0);
      expect(steps).toBe(1);
      await database.transaction(async () => {
        await notes().count({});
      });
      expect(steps).toBe(1);
    });
    expect(Database.detached()).toBeUndefined();
    await notes().count({});
    expect(steps).toBe(1);
  });

  it("flushes what a step loads and changes before the step commits, with no explicit flush", async () => {
    const database = new MemoryDatabaseDriver();
    await database.transaction(async () => {
      await notes().insert({ id: "note_01ja0000000000000000000003", body: "pending" });
    });
    const step: DetachedStep = (work) => database.transaction(work);
    await database.runDetached(step, () =>
      step(async () => {
        const note = await notes().findOneOrFail({ id: "note_01ja0000000000000000000003" });
        note.body = "settled";
      }),
    );
    const reread = await notes().findOneOrFail({ id: "note_01ja0000000000000000000003" });
    expect(reread.body).toBe("settled");
  });

  it("keeps each database's step its own when two run in one process", async () => {
    const first = new MemoryDatabaseDriver();
    const second = new MemoryDatabaseDriver();
    try {
      await first.runDetached(PASS, async () => {
        expect(first.detached()).toBe(PASS);
        expect(second.detached()).toBeUndefined();
        // the connected one is the last built
        expect(Database.detached()).toBeUndefined();
      });
      await second.runDetached(PASS, async () => {
        expect(second.detached()).toBe(PASS);
        expect(first.detached()).toBeUndefined();
        expect(Database.detached()).toBe(PASS);
      });
      expect(first.detached()).toBeUndefined();
    } finally {
      await first.close();
    }
  });

  it("registers one DETACHED_RUNS wrapper, which runs the work in the connected database", async () => {
    const earlier = new MemoryDatabaseDriver();
    await earlier.close();
    const database = new MemoryDatabaseDriver();
    expect(DETACHED_RUNS.size).toBe(1);
    const [wrapper] = DETACHED_RUNS;
    const seen = await wrapper?.(PASS, async () => Database.detached());
    expect(seen).toBe(PASS);
    expect(database.detached()).toBeUndefined();
  });
});
