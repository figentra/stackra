/**
 * Stackra file contract:
 * Purpose: the "radius" demo of the web Foundations.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 2 and 5);
 *          ADR 0060 (light, dark, RTL).
 */
import { SHOWCASE_THEME } from "#src/constants/showcase-theme.constant";

/** Every radius the theme renders: the CSS variable name and its value. */
const RADII: readonly (readonly [string, string])[] = [
  ["radius", SHOWCASE_THEME.radius.base],
  ["field-radius", SHOWCASE_THEME.radius.field],
  ...Object.entries(SHOWCASE_THEME.radius.steps).map(
    ([name, value]) => [`radius-${name}`, value] as const,
  ),
];

/** A CSS custom property reference. */
const cssVar = (name: string) => `var(--${name})`;

/** Foundations: Radius. */
export default function Radius() {
  return (
    <ul className="flex flex-wrap gap-4">
      {RADII.map(([name, value]) => (
        <li key={name} className="grid justify-items-center gap-2">
          <span
            className="block size-16 border-2 border-foreground bg-surface"
            style={{ borderRadius: cssVar(name) }}
          />
          <span className="font-mono text-xs">
            <bdi dir="ltr">
              {name} {value}
            </bdi>
          </span>
        </li>
      ))}
    </ul>
  );
}
