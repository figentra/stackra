/**
 * Stackra file contract:
 * Purpose: `earlierPathsOf`, the earlier key paths of a setting field: its `@Renamed` name, and inside a section also
 *          each pairing with the section field's `@Renamed` name, because a renamed section moves every inner path.
 * Boundary: pure; shared by `emitSettings` and `settingsOf`, so the generated key and the manifest lock agree.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 22: `@Renamed`); ADR 0307 (rule 22); STA-2056.
 */
import type { FieldIR } from "#core/types/field-ir.type";

/**
 * The earlier paths of `field` in its group, without its current path.
 *
 * @param field - the setting field.
 * @param section - the section field that holds it, if any.
 * @example
 * earlierPathsOf(memo, remarks); // ["notes.memo"] when the section `remarks` carries `@Renamed("notes")`
 */
export function earlierPathsOf(field: FieldIR, section?: FieldIR): readonly string[] {
  const names = [field.name, ...(field.renamed === undefined ? [] : [field.renamed])];
  if (section === undefined) return names.slice(1);
  const sections = [section.name, ...(section.renamed === undefined ? [] : [section.renamed])];
  return sections.flatMap((outer) => names.map((name) => `${outer}.${name}`)).slice(1);
}
