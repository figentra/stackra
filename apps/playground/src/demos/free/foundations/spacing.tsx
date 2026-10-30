/**
 * Stackra file contract:
 * Purpose: the "spacing" demo of the web Foundations.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 2 and 5);
 *          ADR 0060 (light, dark, RTL).
 */
import { SHOWCASE_THEME } from "#src/constants/showcase-theme.constant";

/** A CSS custom property reference. */
const cssVar = (name: string) => `var(--${name})`;

/** Foundations: Spacing. */
export default function Spacing() {
  return (
    <ul className="grid gap-2">
      {Object.entries(SHOWCASE_THEME.spacing).map(([name, size]) => (
        <li key={name} className="flex items-center gap-3">
          <span className="w-24 shrink-0 font-mono text-xs">
            <bdi dir="ltr">
              {`space-${name}`} {size}
            </bdi>
          </span>
          <span
            className="block h-3 bg-foreground"
            style={{ inlineSize: cssVar(`space-${name}`) }}
          />
        </li>
      ))}
    </ul>
  );
}
