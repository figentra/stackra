/**
 * Stackra file contract:
 * Purpose: `knobsFromProps`, the knobs of the playground from a part's generated API props: a union of string literals
 *          is a select, a boolean a switch, a plain string named like words (label, placeholder, description, title) a
 *          text field, an optional number `value` a number field. Props HeroUI or React Aria declare, `aria-*`, handlers and render functions are left out.
 * Boundary: a pure function over `ApiProp[]`.
 * Runtime: isomorphic
 * Governing contract: STA-1371 (doc pages wave, 2026-10-28); showcase redesign spec (2026-10-27) section 10 (WP11).
 */
import type { ApiProp } from "@stackra/showcase";

import type { KnobSpec } from "#src/components/doc-page/knob-spec.type";

/** The string props a person writes words into. */
const WORDS = new Set(["label", "placeholder", "description", "title", "errorMessage"]);

/** The literals of `"a" | "b"`, or undefined when the type is anything else. */
function literals(type: string): string[] | undefined {
  const parts = type.split("|").map((part) => part.trim());
  return parts.length > 1 && parts.every((part) => /^"[^"]*"$/.test(part))
    ? parts.map((part) => part.slice(1, -1))
    : undefined;
}

/** The knobs of `props`. */
export function knobsFromProps(props: readonly ApiProp[]): KnobSpec[] {
  const knobs: KnobSpec[] = [];
  for (const prop of props) {
    if (prop.source !== "stackra" || prop.deprecated || prop.name.startsWith("aria-")) continue;
    const initial = prop.default?.replaceAll(/^['"]|['"]$/g, "");
    const options = literals(prop.type);
    if (options)
      knobs.push({ prop: prop.name, control: "select", options, ...(initial ? { initial } : {}) });
    else if (prop.type === "boolean") knobs.push({ prop: prop.name, control: "switch" });
    // A ReactNode word prop takes text too: a field whose `label` is a ReactNode must still get its name.
    else if ((prop.type === "string" || prop.type === "ReactNode") && WORDS.has(prop.name))
      knobs.push({ prop: prop.name, control: "text" });
    // An optional number `value` (a progress bar's): left empty, the component's own unset state shows.
    else if (prop.name === "value" && prop.type === "number" && !prop.required)
      knobs.push({ prop: prop.name, control: "number" });
  }
  return knobs;
}
