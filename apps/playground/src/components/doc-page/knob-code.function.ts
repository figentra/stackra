/**
 * Stackra file contract:
 * Purpose: `knobCode`, the JSX the knobs playground shows for its current values: only the props that differ from
 *          their defaults, booleans as bare attributes, children between the tags.
 * Boundary: a pure function; the values are the knobs' own, never evaluated.
 * Runtime: isomorphic
 * Governing contract: STA-1371 (doc pages wave, 2026-10-28).
 */
import type { KnobSpec } from "#src/components/doc-page/knob-spec.type";

/** The JSX of `name` with `values`. */
export function knobCode(
  name: string,
  knobs: readonly KnobSpec[],
  values: Readonly<Record<string, unknown>>,
  children?: string,
): string {
  const attributes = knobs.flatMap((knob) => {
    const value = values[knob.prop];
    if (value === undefined || value === false || value === "" || value === knob.initial) return [];
    if (value === true) return [knob.prop];
    return [
      typeof value === "number"
        ? `${knob.prop}={${value}}`
        : `${knob.prop}=${JSON.stringify(value)}`,
    ];
  });
  const open = [name, ...attributes].join(" ");
  return children ? `<${open}>${children}</${name}>` : `<${open} />`;
}
