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
  readonly key: string;
  readonly module: string;
  readonly profile: string;
  readonly name: string;
  readonly file: string;
  readonly importPath: string;
}
