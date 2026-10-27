/**
 * Stackra file contract:
 * Purpose: `checkSlotFills`, the slot contract's refusals: `slot_key_duplicate` (two own slots with one key),
 *          `slot_undeclared` (a fill whose slot neither the member nor a dependency's manifest declares),
 *          `slot_surface_mismatch` (a fill on another surface than its slot's), `slot_props_mismatch` (the props the
 *          fill was compiled against differ from the slot's committed props) and `slot_fill_duplicate` (two fills of a
 *          `one` slot in one member).
 * Boundary: pure; reads `ir.slots`, `ir.fills` and the dependencies' committed manifests through `slotOf`. Runs in the
 *           full pass beside the i18n and convention checks, never in the manifest pass.
 * Runtime: isomorphic
 * Governing contract: ADR 0438 (gen refuses a fill whose props do not match the slot contract, and a fill for a slot
 *                     the shell does not declare); ADR 0294 (decision 22: a refusal carries its fix);
 *                     app-shells-edge-and-extension.md 7.2 (point 5) and 12.2.1.
 */
import { slotOf } from "#core/functions/slot-of.function";
import type { GenError } from "#core/types/gen-error.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** The props that differ between `declared` and `filled`, as `name: declared ≠ filled` lines. */
function propsDiff(
  declared: Readonly<Record<string, string>>,
  filled: Readonly<Record<string, string>>,
): string[] {
  return [...new Set([...Object.keys(declared), ...Object.keys(filled)])]
    .sort()
    .filter((name) => declared[name] !== filled[name])
    .map((name) => `${name}: ${declared[name] ?? "(absent)"} ≠ ${filled[name] ?? "(absent)"}`);
}

/**
 * The slot refusals of `ir`.
 *
 * @example
 * checkSlotFills(ir).map((error) => error.code); // ["slot_props_mismatch"]
 */
export function checkSlotFills(ir: MemberIR): GenError[] {
  const errors: GenError[] = [];
  const keys = new Map<string, string>();
  for (const slot of ir.slots ?? []) {
    const first = keys.get(slot.key);
    if (first !== undefined)
      errors.push({
        code: "slot_key_duplicate",
        file: slot.file,
        line: 0,
        column: 0,
        subject: slot.key,
        message: `${slot.name} declares the slot key ${slot.key}, which ${first} declares already`,
        fix: "give each slot its own key",
      });
    else keys.set(slot.key, slot.name);
  }

  const filled = new Map<string, string[]>();
  for (const fill of ir.fills ?? []) {
    const at = { file: fill.file, line: fill.line, column: fill.column, subject: fill.name };
    const slot = slotOf(ir, fill.slot);
    if (slot === undefined) {
      errors.push({
        ...at,
        code: "slot_undeclared",
        message: `${fill.name} fills ${fill.slot.name} from ${fill.slot.from}, which declares no such slot`,
        fix: "fill a slot the shell declares (its committed stackra.manifest.json lists them under `slots`), or regenerate the shell's manifest",
      });
      continue;
    }
    if (slot.surface !== fill.surface)
      errors.push({
        ...at,
        code: "slot_surface_mismatch",
        message: `${fill.name} fills ${slot.key} on the ${fill.surface} surface; the slot sits on ${slot.surface}`,
        fix: `write \`{ surface: "${slot.surface}" }\`, or fill the matching slot of the ${fill.surface} shell`,
      });
    const diff = propsDiff(slot.props, fill.props);
    if (diff.length > 0)
      errors.push({
        ...at,
        code: "slot_props_mismatch",
        message: `${fill.name} was built against other props than ${slot.key} declares (${diff.join("; ")})`,
        fix: "update the shell dependency to the version the registry holds and fix the component to the slot's props type",
      });
    if (slot.cardinality === "one")
      filled.set(slot.key, [...(filled.get(slot.key) ?? []), fill.name]);
  }
  for (const [key, names] of filled)
    if (names.length > 1) {
      const second = (ir.fills ?? []).find((fill) => fill.name === names[1]);
      errors.push({
        code: "slot_fill_duplicate",
        file: second?.file ?? "",
        line: second?.line ?? 0,
        column: second?.column ?? 0,
        subject: key,
        message: `${key} takes one fill; ${names.join(" and ")} both fill it`,
        fix: 'keep one fill per member, or declare the slot with `cardinality: "many"`',
      });
    }
  return errors;
}
