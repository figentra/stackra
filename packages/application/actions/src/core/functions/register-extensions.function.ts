/**
 * Stackra file contract:
 * Purpose: `registerExtensions`, how gen's generated entry tells the slots which extension classes plug into them: the
 *          point and slot it read from each extension's type argument, and the extension's order.
 * Boundary: writes the process-wide registry; a repeated row (same point, slot and class) is kept once. Checks each row
 *           names a point, a slot name and an extension class.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 22 to 25); ADR 0265 (decision 7).
 */
import { Extension } from "#core/bases/extension.base";
import { ExtensionPoint } from "#core/bases/extension-point.base";
import { EXTENSION_REGISTRY } from "#core/constants/extension-registry.constant";
import type { ExtensionRegistration } from "#core/types/extension-registration.type";

/**
 * Registers extension classes on their slots.
 *
 * @throws TypeError when a row's point is not an ExtensionPoint, its slot is empty, or its class is not an Extension.
 * @example
 * registerExtensions([{ point: OrderExtensionPoint, slot: "adjustTotals", extension: RedeemPointsExtension, order: 200 }]);
 */
export function registerExtensions(rows: readonly ExtensionRegistration[]): void {
  for (const row of rows) {
    if (typeof row.point !== "function" || !(row.point.prototype instanceof ExtensionPoint))
      throw new TypeError("registerExtensions: a row's point must extend ExtensionPoint");
    if (typeof row.slot !== "string" || row.slot === "")
      throw new TypeError(`registerExtensions: a row of ${row.point.name} needs its slot name`);
    if (typeof row.extension !== "function" || !(row.extension.prototype instanceof Extension))
      throw new TypeError(
        `registerExtensions: ${row.point.name}.${row.slot} lists a class that does not extend Extension`,
      );
    const known = EXTENSION_REGISTRY.some(
      (entry) =>
        entry.point === row.point && entry.slot === row.slot && entry.extension === row.extension,
    );
    if (!known) EXTENSION_REGISTRY.push(Object.freeze({ ...row }));
  }
}
