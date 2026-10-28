/**
 * Stackra file contract:
 * Purpose: `payrollSheet`, the sheet a payroll export writes: the profile's headers, then one row per pay input with
 *          each column filled from the input, the provider's wage code or a literal, numbers and dates in the profile's
 *          formats.
 * Boundary: pure and streaming over `inputs`. An input whose pay item the profile has no code for is refused, never
 *           dropped, so no pay goes missing. Numbers stay numbers in an XLSX export and become text with the profile's
 *           decimal separator otherwise; an absent quantity or amount is an empty cell.
 * Runtime: isomorphic
 * Governing contract: ADR 0431 (decision 4).
 */
import type { TabularCell } from "#contracts/types/tabular-cell.type";
import type { TabularSheet } from "#contracts/types/tabular-sheet.type";
import type { PayInput } from "#core/types/pay-input.type";
import type { PayrollExportProfile } from "#core/types/payroll-export-profile.type";

/** `YYYY-MM-DD` in the profile's date format. */
function dateOf(value: string, format: PayrollExportProfile["dateFormat"]): string {
  const [year = "", month = "", day = ""] = value.split("-");
  if (format === "dd/mm/yyyy") return `${day}/${month}/${year}`;
  if (format === "mm/dd/yyyy") return `${month}/${day}/${year}`;
  if (format === "dd.mm.yyyy") return `${day}.${month}.${year}`;
  return value;
}

/**
 * The sheet of `inputs` under `profile`.
 *
 * @example
 * await files.writeStream(path, new CsvWriterDriver().write([payrollSheet(profile, inputs)]));
 * @throws TypeError (while the rows are read) when an input's pay item has no code in the profile.
 */
export function payrollSheet(
  profile: PayrollExportProfile,
  inputs: AsyncIterable<PayInput> | Iterable<PayInput>,
): TabularSheet {
  const numberOf = (value: number | undefined): TabularCell => {
    if (value === undefined) return null;
    if (profile.format === "xlsx") return value;
    return String(value).replace(".", profile.decimalSeparator);
  };
  const cellOf = (
    input: PayInput,
    code: string,
    column: PayrollExportProfile["columns"][number],
  ): TabularCell => {
    switch (column.field) {
      case "employee": {
        return input.employee;
      }
      case "item": {
        return input.item;
      }
      case "code": {
        return code;
      }
      case "quantity": {
        return numberOf(input.quantity);
      }
      case "amount": {
        return numberOf(input.amount);
      }
      case "currency": {
        return input.currency ?? null;
      }
      case "periodStart": {
        return dateOf(input.periodStart, profile.dateFormat);
      }
      case "periodEnd": {
        return dateOf(input.periodEnd, profile.dateFormat);
      }
      case "literal": {
        return column.value ?? "";
      }
    }
  };
  async function* rows(): AsyncGenerator<readonly TabularCell[]> {
    yield profile.columns.map((column) => column.header);
    for await (const input of inputs) {
      const code = profile.codes[input.item];
      if (code === undefined)
        throw new TypeError(
          `Payroll profile ${profile.key} has no ${profile.provider} code for pay item "${input.item}": add it to the profile's codes`,
        );
      yield profile.columns.map((column) => cellOf(input, code, column));
    }
  }
  return { name: profile.sheet, rows: rows() };
}
