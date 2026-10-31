/**
 * Stackra file contract:
 * Purpose: `MirrorTicker`, the mirror hero's bilingual ribbon: the names of a few built components (ones the Arabic
 *          catalogue names in Arabic), each in English and then in Arabic (from the showcase catalogue of each locale), sliding past.
 * Boundary: a picture: `aria-hidden` and `inert`. The ribbon's left-to-right layout is the shared `.hero-ticker` CSS
 *           (it loops by sliding half its width); each name carries its own `lang` and `dir`.
 * Runtime: browser
 * Governing contract: owner decision 2026-10-28 (hero concept C); WCAG 2.2 SC 1.1.1, 2.2.2.
 */
import { formatMessage, type I18nKey } from "@stackra/i18n";
import { bySlug, componentKeys } from "@stackra/showcase";
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { motion } from "motion/react";

import { MESSAGES } from "#src/constants/messages.constant";

import type { MirrorTickerProps } from "./mirror-ticker.props";

/** The components the ribbon names, in both languages. */
const NAMES = [
  "split-button",
  "tree-view",
  "copy-button",
  "date-label",
  "sortable-list",
  "status-indicator",
].flatMap((slug) => {
  const entry = bySlug("free", slug);
  if (!entry) return [];
  const key = componentKeys(entry).title as I18nKey;
  return [
    { slug, locale: "en", name: formatMessage(MESSAGES.en, key, undefined, "en") },
    { slug, locale: "ar", name: formatMessage(MESSAGES.ar, key, undefined, "ar") },
  ] as const;
});

/** One pass of the ribbon, in seconds: twenty-two of the theme's pulses. */
const PASS_S = (motionTiming(STACKRA_THEME, "pulse").durationMs * 22) / 1000;

/** The sliding ribbon of component names. */
export function MirrorTicker({ isStill }: MirrorTickerProps) {
  return (
    <div
      aria-hidden="true"
      inert
      className="hero-ticker overflow-hidden text-xl text-muted opacity-70 select-none [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]"
    >
      <motion.div
        className="flex w-max whitespace-nowrap"
        animate={isStill ? {} : { x: ["0%", "-50%"] }}
        // oxlint-disable-next-line stackra/no-literal-duration -- a marquee slides at constant speed, so it has no easing curve
        transition={{ duration: PASS_S, ease: "linear", repeat: Infinity }}
      >
        {[0, 1].flatMap((copy) =>
          NAMES.map(({ slug, locale, name }) => (
            <span key={`${copy}-${slug}-${locale}`} className="pe-14">
              <span lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
                {name}
              </span>
            </span>
          )),
        )}
      </motion.div>
    </div>
  );
}
