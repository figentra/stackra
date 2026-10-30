/**
 * Stackra file contract:
 * Purpose: the Theme Studio's contrast report: the theme's main pairs as the components paint them (HeroUI's hover
 *          and soft colours included, translucent ones composited over the page), each against WCAG 2.2 AA (4.5:1
 *          for text, 3:1 for edges and focus), with a drawn sample and a count of the pairs that pass.
 * Boundary: presentation only; the ratios are measured by @stackra/tokens.
 * Runtime: browser
 * Governing contract: ADR 0320 (the Theme Studio); ADR 0340 (decision 4: what is painted); WCAG 2.2 SC 1.4.3, 1.4.11.
 */
import { pairRatio, paintedColour } from "@stackra/tokens";
import type { Theme } from "@stackra/tokens/contracts";
import { Chip, Heading, Text, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { THEME_STUDIO_KEYS } from "#src/routes/theme-studio/theme-studio-keys.constant";

import { CONTRAST_PAIRS } from "./contrast-pairs.constant";
import type { StudioContrastProps } from "./studio-contrast.props";

/** The report's keys. */
const K = THEME_STUDIO_KEYS.theme_studio.contrast;

/** The CSS colour painted for `name`, for the drawn sample; transparent when nothing paints it. */
function cssOf(theme: Theme, name: string, scheme: "light" | "dark") {
  const colour = paintedColour(theme, name, scheme);
  if (!colour) return "transparent";
  const [red, green, blue] = colour.rgb.map(Math.round);
  return `rgb(${red} ${green} ${blue} / ${colour.alpha.toFixed(3)})`;
}

/** The contrast report. */
export function StudioContrast({ theme, scheme }: StudioContrastProps) {
  const t = useCatalogueText(MESSAGES.en);
  const rows = CONTRAST_PAIRS.map((pair) => {
    const ratio = pairRatio(theme, pair, scheme);
    return { ...pair, ratio, isPassing: ratio !== undefined && ratio >= pair.min };
  });
  const passing = rows.filter(({ isPassing }) => isPassing).length;

  return (
    <section aria-labelledby="studio-contrast" className="grid gap-3">
      <div className="grid gap-1">
        <div className="flex items-center justify-between gap-2">
          <Heading id="studio-contrast" level={2} className="[font:var(--h5)]">
            {t(K.title)}
          </Heading>
          <Chip size="sm" variant="soft" tone={passing === rows.length ? "success" : "warning"}>
            {t(K.summary, { passing, total: rows.length })}
          </Chip>
        </div>
        <Text tone="muted" type="small">
          <bdi>{t(K.note)}</bdi>
        </Text>
      </div>
      <ul className="grid gap-2">
        {rows.map(({ id, fg, bg, min, ratio, isPassing }) => (
          <li key={id} className="flex items-center gap-3 text-sm">
            {/* Lines, not text: the sample shows the theme's pair, which a checker must not take for the page's text. */}
            {/* The outline is the page's ink, so a sample as pale as the page still has an edge; an edge or focus
                pair draws its colour as a thick ring, which a hairline on a white fill did not show. */}
            <svg viewBox="0 0 32 32" aria-hidden="true" className="size-7 shrink-0">
              <rect
                x="0.5"
                y="0.5"
                width="31"
                height="31"
                rx="8"
                fill={cssOf(theme, bg, scheme)}
                stroke="currentColor"
                strokeOpacity="0.3"
              />
              {min === 3 ? (
                <rect
                  x="7"
                  y="7"
                  width="18"
                  height="18"
                  rx="4"
                  fill="none"
                  stroke={cssOf(theme, fg, scheme)}
                  strokeWidth="3"
                />
              ) : (
                <g fill={cssOf(theme, fg, scheme)}>
                  <rect x="8" y="11" width="16" height="3" rx="1.5" />
                  <rect x="8" y="18" width="11" height="3" rx="1.5" />
                </g>
              )}
            </svg>
            <span className="min-w-0 flex-1">{t(K.pairs[id])}</span>
            <span className="font-mono text-xs" dir="ltr">
              {ratio === undefined ? "—" : `${ratio.toFixed(1)}:1`}
            </span>
            <Chip size="sm" variant="soft" tone={isPassing ? "success" : "danger"}>
              {isPassing ? t(K.passes) : t(K.fails)}
            </Chip>
          </li>
        ))}
      </ul>
    </section>
  );
}
