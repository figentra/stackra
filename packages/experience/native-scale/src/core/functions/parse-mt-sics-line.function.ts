/**
 * Stackra file contract:
 * Purpose: `parseMtSicsLine`, one MT-SICS answer line read as a `ScaleLine`: `S S`/`S D` (a settled or moving net
 *          weight with its unit, the answer to `S`, `SI` and `SIR`), `T S`/`TA A` (the tare), `S +`/`S -` (over
 *          capacity, under zero), `S I` (busy) and `ES`/`ET`/`EL` (command errors).
 * Boundary: pure. Any other line (an `@` or `I4` answer, a blank line) is null, never a fault. MT-SICS weights are net
 *           of the tare, so `isNet` is null here: the driver sets it from the tare it read. The grammar is
 *           transcribed from Mettler Toledo's public MT-SICS reference manual; certification replaces the tests'
 *           transcribed lines with recordings (STA-739).
 * Runtime: isomorphic
 * Governing contract: ADR 0478 (decision 5: mapping stays in the TypeScript driver).
 */
import { toGrams } from "#core/functions/to-grams.function";
import type { ScaleLine } from "#core/types/scale-line.type";

/** `<command> <status> <value> <unit>`, as `S S      100.00 g` or `TA A   0.500 kg`. */
const VALUE_LINE = /^(S|SI|SIR|T|TA)\s+([SDA])\s+([+-]?\s*\d+(?:\.\d+)?)\s+(\S+)\s*$/;

/** `S +`, `S -`, `S I` and the same for `SI` and `T`. */
const STATUS_LINE = /^(?:S|SI|SIR|T|TA)\s+([+\-IL])\s*$/;

/**
 * The parsed line, or null.
 *
 * @example
 * parseMtSicsLine("S S      1.250 kg"); // { kind: "weight", value: 1.25, unit: "kg", grams: 1250, isStable: true, isNet: null }
 * parseMtSicsLine("S +"); // { kind: "fault", fault: "overload" }
 */
export function parseMtSicsLine(line: string): ScaleLine | null {
  const text = line.trim();
  if (text === "ES" || text === "ET" || text === "EL") return { kind: "fault", fault: "error" };
  const status = STATUS_LINE.exec(text);
  if (status !== null) {
    if (status[1] === "+") return { kind: "fault", fault: "overload" };
    if (status[1] === "-") return { kind: "fault", fault: "underload" };
    if (status[1] === "I") return { kind: "fault", fault: "busy" };
    return { kind: "fault", fault: "error" };
  }
  const match = VALUE_LINE.exec(text);
  if (match === null) return null;
  const [, command, flag, raw, unit] = match as unknown as [string, string, string, string, string];
  const value = Number(raw.replaceAll(/\s+/g, ""));
  const grams = toGrams(value, unit);
  if (grams === null) return null;
  if (command === "T" || command === "TA") return { kind: "tare", grams };
  return { kind: "weight", value, unit, grams, isStable: flag === "S", isNet: null };
}
