/**
 * Stackra file contract:
 * Purpose: `Sequence`, the kind base of a gapless document number: `class InvoiceSequence extends Sequence({ key:
 *          "invoice", series: ["legalEntityId"], format: "INV-{year}-{n:06}", reset: "yearly" }) {}` in a module's
 *          `database/sequences/` group, one `<name>.sequence.ts` per series. The interface of the same name is its
 *          instance side.
 * Boundary: called only (`key` is required). The call checks the options and records them, normalised, in the kind
 *           registry; `SequenceService` and gen read them through `kindOf`. A sequence holds no number: the counters
 *           are rows of this package's tables, and a module never writes its own counter table (ADR 0342 d5). `{year}`
 *           belongs to yearly sequences only, and a yearly sequence's format has it, so a formatted number never
 *           repeats.
 * Runtime: node
 * Governing contract: ADR 0342 (decisions 1, 4 and 5); ADR 0294 (decisions 13, 20 and 25); ADR 0305 (rules 2 and 3).
 */
import { createKind } from "@stackra/container";

import { formatSequenceNumber } from "#core/functions/format-sequence-number.function";
import type { SequenceClass } from "#core/types/sequence-class.type";
import type { SequenceOptions } from "#core/types/sequence-options.type";

/** A written key: snake_case words joined by dots. */
const KEY = /^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)*$/;

/** A dimension name: camelCase, the name of the field the value comes from. */
const DIMENSION = /^[a-z][A-Za-z0-9]*$/;

/** The largest block a device may hold. */
const MAX_BLOCK = 10_000;

/** The instance side of every sequence class. */
export interface Sequence {
  /** Type-only kind brand, so a class of another kind cannot stand in for a sequence. */
  readonly "~kind": "sequence";
}

/**
 * Checks `options` and returns them with every default filled in.
 *
 * @throws TypeError for a bad key, dimension, format, reset or reservation.
 */
function readSequenceOptions(options: SequenceOptions): Readonly<Record<string, unknown>> {
  const { key, series = [], format = "{n}", reset = "never", reserve = false } = options ?? {};
  if (typeof key !== "string" || !KEY.test(key))
    throw new TypeError(
      `Sequence({ key }) is snake_case words joined by dots, such as "invoice", got ${JSON.stringify(key)}`,
    );
  if (
    !Array.isArray(series) ||
    series.some((name) => typeof name !== "string" || !DIMENSION.test(name))
  )
    throw new TypeError(`Sequence ${key}: series lists camelCase dimension names`);
  if (new Set(series).size !== series.length)
    throw new TypeError(`Sequence ${key}: a series dimension is named twice`);
  if (reset !== "never" && reset !== "yearly")
    throw new TypeError(
      `Sequence ${key}: reset is "never" or "yearly", got ${JSON.stringify(reset)}`,
    );
  if (typeof format !== "string" || !/\{n(?::0\d{1,2})?\}/.test(format))
    throw new TypeError(`Sequence ${key}: the format has the number, {n} or {n:06}`);
  formatSequenceNumber(format, 1, 2000); // refuses an unknown token
  if (format.includes("{year}") !== (reset === "yearly"))
    throw new TypeError(
      `Sequence ${key}: {year} goes with reset "yearly" and only with it, so a formatted number never repeats`,
    );
  if (
    reserve !== false &&
    (typeof reserve !== "object" ||
      reserve === null ||
      !Number.isInteger(reserve.size) ||
      reserve.size < 1 ||
      reserve.size > MAX_BLOCK)
  )
    throw new TypeError(
      `Sequence ${key}: reserve is false or { size } with a size from 1 to ${MAX_BLOCK}`,
    );
  return Object.freeze({
    key,
    series: Object.freeze([...series]),
    format,
    reset,
    reserve: reserve === false ? false : Object.freeze({ size: reserve.size }),
  });
}

/**
 * The sequence kind base.
 *
 * @example
 * export class InvoiceSequence extends Sequence({
 *   key: "invoice",
 *   series: ["legalEntityId"],
 *   format: "INV-{year}-{n:06}",
 *   reset: "yearly",
 *   reserve: { size: 50 },
 * }) {}
 */
export const Sequence = createKind(
  "sequence",
  // oxlint-disable-next-line typescript/no-extraneous-class -- reason: createKind needs a class; a sequence holds no state
  class SequenceBase {},
  readSequenceOptions,
) as (options: SequenceOptions) => SequenceClass;
