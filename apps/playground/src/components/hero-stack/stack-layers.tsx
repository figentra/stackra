/**
 * Stackra file contract:
 * Purpose: `StackLayers`, the stack hero's picture: three glass layers tilted in 3D, each a real @stackra/ui piece in
 *          the theme's tokens: 01 the tokens (swatches, type, radius), 02 the components (Button, Switch, SearchField,
 *          StatusBadge) and 03 a product (orders today: bars and `Stat` figures). Apart, the layers float and a light
 *          scans the product; assembled, they lie flat as the product alone.
 * Boundary: a picture: `aria-hidden` and `inert`, so its words are neither read nor measured as content. Every colour
 *           is a theme variable. Its size steps with the viewport so it fits from a phone up.
 * Runtime: browser
 * Governing contract: owner decision 2026-10-28 (hero concept A); STA-1371; WCAG 2.2 SC 1.1.1, 2.3.3.
 */
import {
  Button,
  SearchField,
  Stat,
  StatusBadge,
  Switch,
  useCatalogueText,
} from "@stackra/ui/react";
import { motionEasing, motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { motion } from "motion/react";

import { BRAND_KEYS } from "#src/constants/brand-keys.constant";
import { MESSAGES } from "#src/constants/messages.constant";

import type { StackLayersProps } from "./stack-layers.props";

/** The stack hero's keys. */
const K = BRAND_KEYS.brand.hero.stack;

/** The hero words of the brand catalogue. */
const H = BRAND_KEYS.brand.hero;

/** The type specimens, Latin and Arabic: letterforms on show, never translated. */
const STRINGS = { latin: "Aa", arabic: "أب" } as const;

/** The product's bars, in percent of their row. */
const BARS = [42, 64, 50, 78, 58, 88, 70, 96, 74, 100];

/** The settle every change of the stack eases with. */
const EASE = motionEasing(STACKRA_THEME, "enter");

/** The theme's pulse in seconds (the settle, and the beat the loops count in), and the curve the loops breathe on. */
const PULSE_S = motionTiming(STACKRA_THEME, "pulse").durationMs / 1000;
const STANDARD = motionEasing(STACKRA_THEME, "standard");

/** One layer's card: glass over the page, the theme's radius, a hairline edge. */
const LAYER =
  "absolute inset-0 hero-card material-thin border border-border p-6 shadow-[var(--overlay-shadow)]";

/** The three tilted layers. */
export function StackLayers({ isAssembled, isStill }: StackLayersProps) {
  const t = useCatalogueText(MESSAGES.en);
  const isFloating = !isAssembled && !isStill;
  const settle = { duration: isStill ? 0 : PULSE_S, ease: EASE };
  // Apart, each layer floats a little further from its rest, on its own beat.
  const depth = (rest: number, drift: number) =>
    isAssembled
      ? { z: 0, transition: settle }
      : isFloating
        ? {
            z: [rest, rest + drift, rest],
            transition: { duration: PULSE_S * 5, ease: STANDARD, repeat: Infinity },
          }
        : { z: rest, transition: settle };

  return (
    <div
      aria-hidden="true"
      inert
      className="relative h-88 select-none [perspective:1800px] sm:h-120 xl:h-152"
    >
      <motion.div
        className="absolute start-1/2 top-[62%] -ms-70 -mt-48 h-96 w-140 scale-[0.46] [transform-style:preserve-3d] sm:scale-[0.72] xl:scale-100"
        initial={false}
        animate={isAssembled ? { rotateX: 0, rotateZ: 0 } : { rotateX: 56, rotateZ: -36 }}
        transition={settle}
      >
        <motion.div
          className={`${LAYER} grid grid-cols-4 content-start gap-3.5`}
          initial={false}
          animate={{ ...depth(0, -14), opacity: isAssembled ? 0 : 1 }}
        >
          <span className="col-span-full font-mono text-xs tracking-widest text-muted">
            {t(K.layer_tokens)}
          </span>
          {["bg-[var(--stk-ink)]", "bg-accent", "bg-default", "bg-foreground"].map((fill) => (
            <span key={fill} className={`h-16 hero-chip ${fill}`} />
          ))}
          <span className="col-span-2 text-5xl font-semibold tracking-tight">{STRINGS.latin}</span>
          <span lang="ar" dir="rtl" className="col-span-2 text-5xl">
            {STRINGS.arabic}
          </span>
          <span className="col-span-full flex gap-2.5">
            {["var(--radius-sm)", "var(--radius)", "var(--radius-full)"].map((corner) => (
              <span
                key={corner}
                className="size-7 border-2 border-accent"
                style={{ borderRadius: corner }}
              />
            ))}
          </span>
        </motion.div>
        <motion.div
          className={`${LAYER} flex flex-col gap-4`}
          initial={false}
          animate={{ ...depth(150, 12), opacity: isAssembled ? 0 : 1 }}
        >
          <span className="font-mono text-xs tracking-widest text-muted">
            {t(K.layer_components)}
          </span>
          <div className="flex flex-wrap items-center gap-2.5">
            <Button variant="primary" size="sm">
              {t(K.publish)}
            </Button>
            <Button variant="outline" size="sm">
              {t(K.preview)}
            </Button>
            <span className="ms-auto">
              <Switch defaultValue label={t(H.storm.notifications)} />
            </span>
          </div>
          <SearchField aria-label={t(K.search)} placeholder={t(K.search)} isFullWidth />
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone="success">{t(H.status.paid)}</StatusBadge>
            <StatusBadge tone="warning">{t(H.status.pending)}</StatusBadge>
            <StatusBadge tone="default">{t(H.status.shipped)}</StatusBadge>
          </div>
        </motion.div>
        <motion.div
          className={`${LAYER} flex flex-col gap-3.5 overflow-hidden`}
          initial={false}
          animate={depth(300, 26)}
        >
          {isFloating ? (
            <motion.span
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_30%,color-mix(in_oklch,var(--accent)_24%,transparent)_48%,transparent_62%)] bg-[length:300%_100%]"
              animate={{ backgroundPosition: ["120% 0%", "-120% 0%"] }}
              // oxlint-disable-next-line stackra/no-literal-duration -- a light scanning at constant speed has no easing curve
              transition={{ duration: PULSE_S * 4, ease: "linear", repeat: Infinity }}
            />
          ) : null}
          <div className="flex items-center gap-2.5">
            <motion.span
              className="size-2 hero-round bg-success"
              animate={isStill ? {} : { opacity: [1, 0.25, 1] }}
              transition={{ duration: PULSE_S, ease: STANDARD, repeat: Infinity }}
            />
            <span className="font-semibold">{t(K.orders_today)}</span>
            <span className="ms-auto font-mono text-xs tracking-widest text-muted">
              {t(K.layer_product)}
            </span>
          </div>
          <div className="flex h-36 items-end gap-2.5 pt-2.5">
            {BARS.map((height, index) => (
              <motion.span
                key={height}
                className="flex-1 origin-bottom hero-bar bg-accent"
                style={{ height: `${height}%` }}
                animate={isFloating ? { scaleY: [0.35, 1] } : { scaleY: 1 }}
                transition={
                  isFloating
                    ? {
                        duration: PULSE_S * 2,
                        ease: EASE,
                        delay: index * 0.12,
                        repeat: Infinity,
                        repeatType: "reverse",
                      }
                    : settle
                }
              />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { label: t(K.orders), value: 128 },
              { label: t(K.revenue), value: 5440 },
              { label: t(K.returns), value: 3 },
            ].map(({ label, value }) => (
              <div key={label} className="hero-chip bg-default/60 p-3">
                <Stat label={label} value={value} />
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
