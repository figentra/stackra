/**
 * Stackra file contract:
 * Purpose: `datevWriteOptionsOf`, the `DatevWriteOptions` of a DATEV profile with the tenant's own `[Allgemein]`
 *          entries (consultant and client number) laid over the profile's.
 * Boundary: pure. The tenant's numbers are tenant settings, never seed data.
 * Runtime: isomorphic
 * Governing contract: ADR 0431 (decision 4).
 */
import type { DatevWriteOptions } from "#core/types/datev-write-options.type";
import type { PayrollExportProfile } from "#core/types/payroll-export-profile.type";

/**
 * The DATEV write options of `profile`.
 *
 * @example
 * datevWriteOptionsOf(profile, { BeraterNr: settings.datevConsultant, MandantenNr: settings.datevClient });
 * @throws TypeError when the profile has no DATEV section.
 */
export function datevWriteOptionsOf(
  profile: PayrollExportProfile,
  scope: Readonly<Record<string, string>>,
): DatevWriteOptions {
  if (profile.datev === undefined)
    throw new TypeError(`Payroll profile ${profile.key} is not a DATEV profile`);
  const { general, recordTable, recordNumber } = profile.datev;
  return { general: { ...general, ...scope }, recordTable, recordNumber };
}
