/**
 * Stackra file contract:
 * Purpose: `sheetImportsOf`, the `sheets` of an `ImportRunner.runSheets` call built from a mapping profile: each
 *          profile sheet with its mapping and the target the caller registered under the profile's target name.
 * Boundary: pure. The caller owns the targets (one per importable model); the profile only names them.
 * Runtime: isomorphic
 * Governing contract: ADR 0431 (decision 1).
 */
import type { ImportTarget } from "#contracts/types/import-target.type";
import type { ImportMappingProfile } from "#core/types/import-mapping-profile.type";
import type { SheetImport } from "#core/types/sheet-import.type";

/**
 * The sheet imports of `profile`.
 *
 * @example
 * await runner.runSheets({ runId, rows, sheets: sheetImportsOf(profile, { products, variants }), batchSize });
 * @throws TypeError when the profile names a target the caller did not pass.
 */
export function sheetImportsOf(
  profile: ImportMappingProfile,
  targets: Readonly<Record<string, ImportTarget<unknown>>>,
): SheetImport<unknown>[] {
  return profile.sheets.map(({ sheet, target, mapping }) => {
    const found = targets[target];
    if (found === undefined)
      throw new TypeError(
        `Mapping profile ${profile.key} feeds sheet "${sheet}" into target "${target}", which was not given`,
      );
    return { sheet, mapping, target: found };
  });
}
