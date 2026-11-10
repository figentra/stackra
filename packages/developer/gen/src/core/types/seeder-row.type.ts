/**
 * Stackra file contract:
 * Purpose: `SeederRow`, one own seeder of a member: its identity `<module>.<profile>`, module, profile, class name,
 *          file and the specifier generated files import it from (STA-2061).
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0190 (as amended by ADR 0294: profiles and identity).
 */

/** One own seeder. */
export interface SeederRow {
  /** The seeder's identity, `<module>.<profile>`. */
  readonly key: string;
  /** The module the seeder belongs to. */
  readonly module: string;
  /** The profile the seeder fills. */
  readonly profile: string;
  /** The seeder's class name. */
  readonly name: string;
  /** The file that declares the seeder. */
  readonly file: string;
  /** The specifier generated files import it from. */
  readonly importPath: string;
}
