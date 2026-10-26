/**
 * Stackra file contract:
 * Purpose: `deviceCatalogueOf(rows)`, the device kinds of a device catalogue's rows (`BASE_DEVICE_CATALOGUE` or a
 *          product's seed-pack record), checked: snake_case keys, each once, yes-or-no flags and snake_case peripheral
 *          names. A row without `counted` counts and one without `fiscalUnit` is not a fiscal unit, so catalogues
 *          seeded before the flags still read.
 * Boundary: pure; the reader the seed loader and the admin run before a catalogue is stored, as the plan catalogue's
 *           readers are. It refuses a bad row with a RangeError naming it.
 * Runtime: isomorphic
 * Governing contract: ADR 0430 (decision 2); config-model (device kinds are device-catalogue data).
 */
import type { Json } from "@stackra/contracts";

import type { DeviceKind } from "#contracts/types/device-kind.type";

/** A snake_case name. */
const SNAKE = /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/;

/**
 * The kinds of a device catalogue.
 *
 * @example
 * deviceCatalogueOf(BASE_DEVICE_CATALOGUE).find((kind) => kind.key === device.kind)?.unattended;
 *
 * @throws RangeError for a row that is not a device kind, a bad key or flag, a repeated key or a bad peripheral name.
 */
export function deviceCatalogueOf(
  rows: readonly Readonly<Record<string, Json>>[],
): readonly DeviceKind[] {
  const seen = new Set<string>();
  return Object.freeze(
    rows.map((row, index) => {
      const where = `deviceCatalogueOf: row ${index + 1}`;
      if (row["record"] !== "device_kind")
        throw new RangeError(`${where} is not a device_kind row`);
      const key = row["key"];
      if (typeof key !== "string" || !SNAKE.test(key))
        throw new RangeError(`${where} needs a snake_case key`);
      if (seen.has(key)) throw new RangeError(`${where} repeats ${key}`);
      seen.add(key);
      const { unattended, customerFacing, peripherals, counted = true, fiscalUnit = false } = row;
      if (typeof unattended !== "boolean" || typeof customerFacing !== "boolean")
        throw new RangeError(
          `${where} (${key}) needs unattended and customerFacing as true or false`,
        );
      if (typeof counted !== "boolean" || typeof fiscalUnit !== "boolean")
        throw new RangeError(`${where} (${key}) needs counted and fiscalUnit as true or false`);
      if (
        !Array.isArray(peripherals) ||
        !peripherals.every((name) => typeof name === "string" && SNAKE.test(name))
      )
        throw new RangeError(`${where} (${key}) needs a list of snake_case peripheral names`);
      return Object.freeze({
        key,
        unattended,
        customerFacing,
        counted,
        fiscalUnit,
        peripherals: Object.freeze([...(peripherals as string[])]),
      });
    }),
  );
}
