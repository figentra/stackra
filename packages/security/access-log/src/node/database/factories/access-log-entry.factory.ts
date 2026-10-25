/**
 * Stackra file contract:
 * Purpose: `AccessLogEntryFactory`, which builds `AccessLogEntry` rows for tests and for hosts that seed an audit
 *          trail.
 * Boundary: bound to `AccessLogEntry` by the type argument (gen registers the pair); a named state is a method. Faker
 *           comes from @stackra/database/testing, and the `./testing` entry is the only one that exports a factory, so
 *           Faker never reaches a runtime entry. Rows get a random place in a chain, not a verifiable one: a test of
 *           the chain links records with `linkAccessRecord`.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 11, 13 and 15); ADR 0190 (factories); ADR 0269 (decision 3).
 */
import { ActorKind, DataClassification, Realm } from "@stackra/contracts";
import { Factory } from "@stackra/database/testing";
import type { Faker } from "@stackra/database/testing";
import type { Attributes } from "@stackra/model";

import type { AccessLogEntry } from "#node/models/access-log-entry.model";

/**
 * A personal read of one person by a platform user, dated now.
 *
 * @example
 * await AccessLogEntryFactory.new().create({ at: new Date("2026-07-13T00:00:00Z") });
 */
export class AccessLogEntryFactory extends Factory<AccessLogEntry> {
  /** The default attributes of one record; a retention test overrides `at`. */
  definition(faker: Faker): Attributes<AccessLogEntry> {
    return {
      callId: faker.string.uuid(),
      target: "CustomerReads.view",
      classification: DataClassification.Personal,
      actor: { kind: ActorKind.User, id: faker.publicId("usr"), realm: Realm.Platform },
      subjects: [faker.publicId("usr")],
      at: new Date(),
      sequence: faker.number.int({ min: 1, max: 2_147_483_647 }),
      previousHash: faker.string.hexadecimal({ length: 64, casing: "lower", prefix: "" }),
      hash: faker.string.hexadecimal({ length: 64, casing: "lower", prefix: "" }),
    };
  }
}
