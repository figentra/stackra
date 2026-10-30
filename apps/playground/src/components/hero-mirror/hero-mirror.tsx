/**
 * Stackra file contract:
 * Purpose: `HeroMirror`, landing hero C, "the mirror": the headline "Build once. Theme anywhere." beside an orders card
 *          built from real @stackra/ui components (`MirrorOrders`) that turns between English and Arabic every 4.2
 *          seconds with a 3D turn: the card's language, direction, digits and type all switch, through the same
 *          catalogues and i18n mount as the rest of the playground. A toggle picks the language (and stops the turn), a
 *          button pauses and plays it; a bilingual ribbon of component names slides underneath (`MirrorTicker`).
 * Boundary: the headline, pitch and controls stay in the page's language; the card and the ribbon are a picture
 *           (`aria-hidden`, `inert`) beside and under the copy, never over it. Reduced motion never turns on its own and
 *           draws a pick at once.
 * Runtime: browser
 * Governing contract: owner decision 2026-10-28 (hero concept C); ADR 0060 (RTL); STA-1371; WCAG 2.2 SC 2.2.2,
 *          2.3.3, 3.1.2.
 */
import {
  Button,
  Text,
  ToggleButton,
  ToggleButtonGroup,
  useCatalogueText,
  useDesignSystem,
} from "@stackra/ui/react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import { HeroActions } from "#src/components/landing-hero";
import { LOCALES } from "#src/components/playground-shell/display-settings-locales.constant";
import { SHELL_KEYS } from "#src/components/playground-shell/shell-keys.constant";
import { ShowcaseI18n } from "#src/components/showcase-i18n";
import { BRAND_KEYS } from "#src/constants/brand-keys.constant";
import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";

import { MirrorOrders } from "./mirror-orders";
import { MirrorTicker } from "./mirror-ticker";

/** The mirror hero's keys. */
const K = BRAND_KEYS.brand.hero.mirror;

/** How long each language stays, in ms. */
const TURN = 4200;

/** Hero C: the mirror. */
export function HeroMirror() {
  const t = useCatalogueText(MESSAGES.en);
  const isStill = useReducedMotion() ?? false;
  const { locale } = useDesignSystem();
  const pageIsRtl = locale.startsWith("ar");
  // The card opens in the page's language and turns to the other.
  const [side, setSide] = useState<"en" | "ar">(pageIsRtl ? "ar" : "en");
  const [isPlaying, setIsPlaying] = useState(true);
  const isTurning = isPlaying && !isStill;
  const isRtl = side === "ar";

  useEffect(() => {
    if (!isTurning) return undefined;
    const timer = setInterval(() => setSide((was) => (was === "ar" ? "en" : "ar")), TURN);
    return () => clearInterval(timer);
  }, [isTurning]);

  const lines = [t(K.title), t(K.title_accent)];

  return (
    <section aria-labelledby="hero-title" className="grid gap-10 py-6 lg:py-10">
      <title>{`${lines.join(" ")} · ${t(SHELL_KEYS.shell.title)}`}</title>
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="grid justify-items-start gap-6">
          <p className="hero-eyebrow text-muted">
            {t(isRtl === pageIsRtl ? K.eyebrow : K.eyebrow_other)}
          </p>
          <h1 id="hero-title" className="hero-headline">
            {lines[0]} <span className="block text-[var(--stk-ink)]">{lines[1]}</span>
          </h1>
          <Text tone="muted" className="max-w-md text-lg text-pretty">
            {t(K.pitch)}
          </Text>
          <div className="flex flex-wrap items-center gap-2">
            <ToggleButtonGroup
              aria-label={t(K.direction)}
              size="sm"
              selectionMode="single"
              disallowEmptySelection
              selectedKeys={[side]}
              onSelectionChange={(keys) => {
                const picked = LOCALES.find(({ id }) => keys.has(id));
                if (!picked) return;
                setSide(picked.id);
                setIsPlaying(false);
              }}
            >
              {LOCALES.map(({ id, short, name, dir }) => (
                <ToggleButton key={id} id={id} aria-label={name}>
                  <span lang={id} dir={dir}>
                    {short}
                  </span>
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            {isStill ? null : (
              <Button
                variant="ghost"
                size="sm"
                startIcon={isPlaying ? Icons.Pause : Icons.Play}
                onPress={() => setIsPlaying((was) => !was)}
              >
                {t(isPlaying ? K.pause : K.play)}
              </Button>
            )}
          </div>
          <HeroActions />
        </div>
        <div aria-hidden="true" inert className="relative select-none [perspective:1400px]">
          <span className="pointer-events-none absolute inset-y-[-10%] start-1/2 -z-10 w-px bg-[var(--stk-ink)] opacity-40 [mask-image:linear-gradient(transparent,black_30%,black_70%,transparent)]" />
          <motion.div
            key={side}
            lang={side}
            dir={isRtl ? "rtl" : "ltr"}
            initial={
              isStill
                ? false
                : { opacity: 0, rotateY: isRtl ? 70 : -70, scale: 0.94, filter: "blur(6px)" }
            }
            animate={{ opacity: 1, rotateY: 0, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 1, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <ShowcaseI18n locale={side}>
              <MirrorOrders locale={side} isStill={isStill} />
            </ShowcaseI18n>
          </motion.div>
        </div>
      </div>
      <MirrorTicker isStill={isStill} />
    </section>
  );
}
