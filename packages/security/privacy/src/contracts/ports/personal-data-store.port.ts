/**
 * Stackra file contract:
 * Purpose: `PersonalDataStore`, the port the DSAR export and the erasure saga read and dispose of a subject's rows
 *          through: find a subject's rows of a model, delete rows, overwrite fields with null.
 * Boundary: an abstract class that is its own token, key `privacy.PersonalDataStore`. Drivers extend
 *           `Driver(PersonalDataStore)`: `repository` (the database, the default) and `memory`; config `store` picks
 *           one. A driver never decides what is held: the saga asks `disposableIds` first and passes only free ids.
 *           A leaf file: it imports nothing outside src/contracts.
 * Runtime: isomorphic
 * Governing contract: ADR 0189 (decisions 1 and 2); ADR 0294 (decisions 15, 16 and 17); STA-1375.
 */
import type { AnyClass } from "@stackra/container";
import { Port } from "@stackra/contracts";

import type { SubjectRecord } from "#contracts/types/subject-record.type";

/**
 * Reads and disposes of a subject's rows.
 *
 * @example
 * const rows = await store.find(Customer, "id", "usr_01…", ["name", "email"]);
 * await store.remove(Customer, rows.map((row) => row.id));
 */
export abstract class PersonalDataStore extends Port {
  /** Type-only port key, so `DriverName<PersonalDataStore>` narrows to this port's drivers. */
  declare readonly "~key": "privacy.PersonalDataStore";

  /**
   * The rows of `model` whose `subjectField` equals `subject`, with only `fields` copied.
   *
   * @param model - the declared model.
   * @param subjectField - the property naming the subject.
   * @param subject - the subject's public id.
   * @param fields - the declared personal fields to copy.
   */
  abstract find(
    model: AnyClass,
    subjectField: string,
    subject: string,
    fields: readonly string[],
  ): Promise<SubjectRecord[]>;

  /** Deletes the rows of `model` with these ids; returns how many were deleted. */
  abstract remove(model: AnyClass, ids: readonly string[]): Promise<number>;

  /** Sets `fields` to null on the rows of `model` with these ids; returns how many rows changed. */
  abstract anonymise(
    model: AnyClass,
    ids: readonly string[],
    fields: readonly string[],
  ): Promise<number>;
}
