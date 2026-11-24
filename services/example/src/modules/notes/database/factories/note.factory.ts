/**
 * Stackra file contract:
 * Purpose: `NoteFactory`, which builds `Note` rows for tests and for hosts that seed demo data.
 * Boundary: bound to `Note` by the type argument (gen registers the pair). The tenant is not a default: a test names it
 *           (`create({ tenantId })`) or builds inside `runAsTenant`, so no row is ever tenantless by accident. Faker comes
 *           from `@stackra/database/testing`.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 11, 13 and 15); ADR 0190 (factories); ADR 0269 (decision 3).
 */
import { Factory } from "@stackra/database/testing";
import type { Faker } from "@stackra/database/testing";
import type { Attributes } from "@stackra/model";

import type { Note } from "#modules/notes/models/note.model";

/**
 * A note with a short title and a sentence of text.
 *
 * @example
 * await NoteFactory.new().create({ tenantId, title: "Buy milk" });
 */
export class NoteFactory extends Factory<Note> {
  /** The default attributes of one note. */
  definition(faker: Faker): Attributes<Note> {
    return {
      title: faker.lorem.words({ min: 1, max: 5 }),
      body: faker.lorem.sentence(),
    };
  }
}
