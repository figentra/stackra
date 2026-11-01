/**
 * Stackra file contract:
 * Purpose: unit tests of `RecordedEventsSubscriber` on the memory database: the events a model records in a committed
 *          transaction reach the testing app once, oldest first; a rolled-back transaction publishes none; a released
 *          savepoint's events wait for the outer commit and go with an outer rollback (STA-1740).
 * Boundary: unit tier: PGlite runs in this process, no Docker; the testing module is an empty one.
 * Runtime: node (vitest)
 * Governing contract: ADR 0078 (decisions 3 and 4); ADR 0294 (decision 27); ADR 0269 (decision 3); ADR 0022.
 */
import { EntitySchema } from "@mikro-orm/core";
import { Module } from "@stackra/container";
import { createTestingModule } from "@stackra/container/testing";
import { DomainEvent } from "@stackra/events";
import { HasPublicId, Model } from "@stackra/model";
import { afterEach, describe, expect, it } from "@stackra/testing";

import { ACTIVE_DATABASE } from "#core/constants/active-database.constant";
import { registerEntities } from "#core/functions/register-entities.function";
import { repositoryOf } from "#core/functions/repository-of.function";
import { Database } from "#core/ports/database.port";
import type { Repository } from "#core/types/repository.type";
import "#testing/index";

class Note extends Model.with(HasPublicId("note")) {
  body!: string;
}

class NoteWritten extends DomainEvent {}

class NoteFiled extends DomainEvent {}

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

class FixtureModule extends Module {}

/** A new repository of notes on the connected database. */
const notes = () => Reflect.construct(repositoryOf(Note), []) as Repository<Note>;

/** Creates a note that records `event`. */
function write(id: Note["id"], event: DomainEvent): void {
  notes().create({ id, body: "hello" }).record(event);
}

afterEach(async () => {
  await ACTIVE_DATABASE.current?.close();
}, 60_000);

// Each case boots a fresh PGlite (WASM Postgres plus four extensions), which takes seconds on a loaded runner.
describe("RecordedEventsSubscriber", { timeout: 60_000 }, () => {
  it("publishes what a committed transaction's models recorded, once and in order", async () => {
    const app = await createTestingModule(FixtureModule).compile();
    const written = new NoteWritten();
    const filed = new NoteFiled();
    await app.transaction(async () => {
      write("note_01ja0000000000000000000001", written);
      write("note_01ja0000000000000000000002", filed);
    });
    expect([...app.events.published()]).toEqual([written, filed]);
    await app.transaction(async () => undefined);
    expect(app.events.published()).toHaveLength(2);
  });

  it("publishes nothing when the transaction rolls back", async () => {
    const app = await createTestingModule(FixtureModule).compile();
    await expect(
      app.transaction(async () => {
        write("note_01ja0000000000000000000003", new NoteWritten());
        await Database.current().em().flush();
        throw new Error("refused");
      }),
    ).rejects.toThrow("refused");
    expect(app.events.published()).toHaveLength(0);
  });

  it("holds a released savepoint's events for the outer commit and drops them on an outer rollback", async () => {
    const app = await createTestingModule(FixtureModule).compile();
    const kept = new NoteWritten();
    await app.transaction(async () => {
      await app.transaction(async () => write("note_01ja0000000000000000000004", kept));
      expect(app.events.published()).toHaveLength(0);
    });
    expect([...app.events.published()]).toEqual([kept]);

    await expect(
      app.transaction(async () => {
        await app.transaction(async () =>
          write("note_01ja0000000000000000000005", new NoteFiled()),
        );
        throw new Error("refused");
      }),
    ).rejects.toThrow("refused");
    expect([...app.events.published()]).toEqual([kept]);
  });
});
