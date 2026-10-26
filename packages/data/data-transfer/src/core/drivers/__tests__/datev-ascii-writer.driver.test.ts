/**
 * Stackra file contract:
 * Purpose: unit tests of `DatevAsciiWriterDriver` with `datevWriteOptionsOf`: the three sections from the profile and
 *          the tenant's numbers, Latin-1 bytes, and the refusals (no options, two sheets, a semicolon, a character
 *          outside Latin-1, a non-DATEV profile).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0431 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import type { TabularSheet } from "#contracts/types/tabular-sheet.type";
import { PAYROLL_EXPORT_PROFILE_SCHEMA } from "#core/constants/payroll-export-profile-schema.constant";
import { DatevAsciiWriterDriver } from "#core/drivers/datev-ascii-writer.driver";
import { datevWriteOptionsOf } from "#core/functions/datev-write-options-of.function";
import { payrollSheet } from "#core/functions/payroll-sheet.function";
import type { DatevWriteOptions } from "#core/types/datev-write-options.type";

const PROFILE = PAYROLL_EXPORT_PROFILE_SCHEMA.parse({
  key: "datev-lodas",
  provider: "datev",
  format: "datev-ascii",
  sheet: "Bewegungsdaten",
  decimalSeparator: ",",
  dateFormat: "dd/mm/yyyy",
  columns: [
    { header: "pnr#bwd", field: "employee" },
    { header: "abrechnung_zeitraum#bwd", field: "periodStart" },
    { header: "la_eigene#bwd", field: "code" },
    { header: "bs_wert_butab#bwd", field: "quantity" },
  ],
  codes: { "hours.regular": "1000" },
  datev: {
    recordTable: "u_lod_bwd_buchung_standard",
    recordNumber: 10,
    general: { Ziel: "LODAS", Datumsformat: "TT/MM/JJJJ" },
  },
});

async function bytes(sheets: TabularSheet[], options?: DatevWriteOptions): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of new DatevAsciiWriterDriver().write(sheets, options)) chunks.push(chunk);
  return Buffer.concat(chunks);
}

describe("DatevAsciiWriterDriver", () => {
  it("writes the sections and movement lines in Latin-1", async () => {
    const options = datevWriteOptionsOf(PROFILE, { BeraterNr: "1234567", MandantenNr: "12345" });
    const sheet = payrollSheet(PROFILE, [
      {
        employee: "Müller-7",
        item: "hours.regular",
        periodStart: "2026-10-01",
        periodEnd: "2026-10-31",
        quantity: 8.5,
      },
    ]);
    const file = await bytes([sheet], options);
    expect(Buffer.from(file).toString("latin1")).toBe(
      "[Allgemein]\r\nZiel=LODAS\r\nDatumsformat=TT/MM/JJJJ\r\nBeraterNr=1234567\r\nMandantenNr=12345\r\n\r\n" +
        "[Satzbeschreibung]\r\n10;u_lod_bwd_buchung_standard;pnr#bwd;abrechnung_zeitraum#bwd;la_eigene#bwd;bs_wert_butab#bwd;\r\n\r\n" +
        "[Bewegungsdaten]\r\n10;Müller-7;01/10/2026;1000;8,5;\r\n",
    );
    expect(file.includes(0xfc)).toBe(true);
    expect(new DatevAsciiWriterDriver().mediaType).toBe("text/plain");
  });

  it("refuses what it cannot write", async () => {
    const options = datevWriteOptionsOf(PROFILE, {});
    await expect(bytes([{ name: "a", rows: [["x"]] }])).rejects.toThrow(/DATEV options/);
    await expect(bytes([], options)).rejects.toThrow(/one sheet/);
    await expect(bytes([{ name: "a", rows: [["a;b"]] }], options)).rejects.toThrow(/semicolon/);
    await expect(bytes([{ name: "a", rows: [["محمد"]] }], options)).rejects.toThrow(/8859-1/);
    expect(() => datevWriteOptionsOf({ ...PROFILE, datev: undefined }, {})).toThrow(/not a DATEV/);
  });
});
