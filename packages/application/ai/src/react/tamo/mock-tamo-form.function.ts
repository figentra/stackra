/**
 * Stackra file contract:
 * Purpose: `mockTamoForm`, the offline mock's form fill: `Label: value` lines matched to the fields by label or name, and a
 *          signature's first line as a name field.
 * Boundary: demo only, deterministic; a field the text does not give is left out.
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (form fill from pasted text).
 */
import type { TamoTasks } from "@stackra/ui/contracts";

/** Folds a label for matching: lower case, letters and digits only. */
const fold = (text: string) => text.toLowerCase().replaceAll(/[^\p{L}\p{N}]/gu, "");

/** Form values from pasted text. */
export function mockTamoForm(
  input: TamoTasks["fill_form"]["input"],
): TamoTasks["fill_form"]["output"] {
  const lines = input.text
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line !== "");
  const values: Record<string, string> = {};
  for (const line of lines) {
    const pair = /^([^:：]{2,40})[:：]\s*(.+)$/u.exec(line);
    if (!pair?.[1] || !pair[2]) continue;
    const key = fold(pair[1]);
    const field = input.fields.find(
      (hint) => fold(hint.label) === key || fold(hint.id) === key || fold(hint.label).includes(key),
    );
    if (field && values[field.id] === undefined) values[field.id] = pair[2].trim();
  }
  const nameField = input.fields.find((hint) =>
    /name|الاسم|اسم/u.test(`${hint.id} ${hint.label}`.toLowerCase()),
  );
  const signature = lines.find(
    (line) =>
      !line.includes(":") &&
      /^[\p{L} .'-]{3,40}$/u.test(line) &&
      !/^(hi|hello|dear|thanks|regards|best)/iu.test(line),
  );
  if (nameField && values[nameField.id] === undefined && signature)
    values[nameField.id] = signature;
  return values;
}
