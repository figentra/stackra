/**
 * Stackra file contract:
 * Purpose: `SeedIssue`, one reason a seed pack cannot load: the file, a snake_case code and a message that names the
 *          fix.
 * Boundary: a type only; `SeedPackInvalidError` carries the list.
 * Runtime: node
 * Governing contract: ADR 0231 (machine codes are snake_case); ADR 0325 (decision 7: seeds are tested).
 */

/** One invalid part of a seed pack. */
export type SeedIssue = {
  /** The file, relative to the pack folder. */
  readonly file: string;

  /** `seed_pack_header`, `seed_profile_unknown`, `seed_kind_unknown`, `seed_record_key_missing`,
   *  `seed_record_duplicate`, `seed_row_id_missing`, `seed_row_duplicate` or `seed_row_answer_missing`. */
  readonly code: string;

  /** What is wrong and how to fix it. */
  readonly message: string;
};
