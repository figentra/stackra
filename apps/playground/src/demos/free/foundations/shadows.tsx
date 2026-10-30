/**
 * Stackra file contract:
 * Purpose: the "shadows" demo of the web Foundations.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 2 and 5);
 *          ADR 0060 (light, dark, RTL).
 */
import { SHOWCASE_THEME } from "#src/constants/showcase-theme.constant";

/** A CSS custom property reference. */
const cssVar = (name: string) => `var(--${name})`;

/** Foundations: Shadows. */
export default function Shadows() {
  return (
    <ul className="flex flex-wrap gap-6">
      {Object.keys(SHOWCASE_THEME.shadows).map((name) => (
        <li key={name} className="grid justify-items-center gap-2">
          <span
            className="block size-20 bg-surface"
            style={{ boxShadow: cssVar(`${name}-shadow`) }}
          />
          <span className="font-mono text-xs">
            <bdi dir="ltr">{`${name}-shadow`}</bdi>
          </span>
        </li>
      ))}
    </ul>
  );
}
