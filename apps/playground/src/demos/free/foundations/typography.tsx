/**
 * Stackra file contract:
 * Purpose: the "typography" demo of the web Foundations.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 2 and 5);
 *          ADR 0060 (light, dark, RTL).
 */
import { useCatalogueText } from "@stackra/ui/react";
import { SHOWCASE_THEME } from "#src/constants/showcase-theme.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { FOUNDATIONS_KEYS } from "#src/demos/free/foundations/foundations-keys.constant";

/** The demo's keys. */
const K = FOUNDATIONS_KEYS.foundations;

/** A CSS custom property reference. */
const cssVar = (name: string) => `var(--${name})`;

/** The Foundations demo: typography. */
export default function Typography() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <ul className="grid gap-4">
      {Object.entries(SHOWCASE_THEME.typography).map(([name, style]) => (
        <li key={name} className="grid gap-1">
          <span className="font-mono text-xs text-muted">
            <bdi dir="ltr">
              {name}: {style.weight} {style.size}/{style.lineHeight} {style.family}
            </bdi>
          </span>
          <p
            lang={style.family === "arabic" ? "ar" : "en"}
            dir={style.family === "arabic" ? "rtl" : "ltr"}
            className="break-words"
            style={{ font: cssVar(name), letterSpacing: cssVar(`${name}-letter-spacing`) }}
          >
            {style.family === "arabic" ? t(K.arabic_sample) : t(K.latin_sample)}
          </p>
        </li>
      ))}
    </ul>
  );
}
