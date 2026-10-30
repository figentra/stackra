/**
 * Stackra file contract:
 * Purpose: `HeroStack`, landing hero A, "the stack": the headline "Tokens. Components. Products." beside three glass
 *          layers of real @stackra/ui pieces in 3D (`StackLayers`): the tokens (colours, type, radius), the components
 *          (buttons, a switch, a search field, status badges) and a product (orders today: bars and figures). The
 *          layers float apart and a light scans the product; an icon button in the picture's corner assembles them
 *          into the product and explodes them again.
 * Boundary: the h1 and the controls are the only content; the layers are a picture (`aria-hidden`, `inert`) beside
 *           the copy, never over it. Reduced motion stops the float, the scan and the bars and draws the change at once.
 * Runtime: browser
 * Governing contract: owner decision 2026-10-28 (hero concept A); STA-1371; WCAG 2.2 SC 1.1.1, 2.2.2, 2.3.3.
 */
import { IconButton, Text, useCatalogueText } from "@stackra/ui/react";
import { motion, useReducedMotion } from "motion/react";
import { Fragment, useState } from "react";

import { HeroActions } from "#src/components/landing-hero";
import { SHELL_KEYS } from "#src/components/playground-shell/shell-keys.constant";
import { BRAND_KEYS } from "#src/constants/brand-keys.constant";
import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";

import { StackLayers } from "./stack-layers";

/** The stack hero's keys. */
const K = BRAND_KEYS.brand.hero.stack;

/** The words' rise: each line a beat after the last. */
const rise = (index: number, isStill: boolean) =>
  isStill
    ? {}
    : {
        initial: { opacity: 0, y: 24, filter: "blur(8px)" },
        animate: { opacity: 1, y: 0, filter: "blur(0px)" },
        transition: { duration: 0.9, delay: index * 0.12, ease: [0.2, 0.8, 0.2, 1] as const },
      };

/** Hero A: the stack. */
export function HeroStack() {
  const t = useCatalogueText(MESSAGES.en);
  const isStill = useReducedMotion() ?? false;
  const [isAssembled, setIsAssembled] = useState(false);
  const lines = [t(K.tokens), t(K.components), t(K.products)];

  return (
    <section
      aria-labelledby="hero-title"
      className="grid items-center gap-8 py-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:py-10"
    >
      <title>{`${lines.join(" ")} · ${t(SHELL_KEYS.shell.title)}`}</title>
      <div className="grid justify-items-start gap-6">
        <motion.p className="hero-eyebrow text-muted" {...rise(0, isStill)}>
          {t(K.eyebrow)}
        </motion.p>
        <h1 id="hero-title" className="hero-headline">
          {lines.map((line, index) => (
            <Fragment key={line}>
              {index > 0 ? " " : null}
              <motion.span
                className={`block ${index === 2 ? "text-[var(--stk-ink)]" : ""}`}
                {...rise(index + 1, isStill)}
              >
                {line}
              </motion.span>
            </Fragment>
          ))}
        </h1>
        <motion.div {...rise(4, isStill)}>
          <Text tone="muted" className="max-w-md text-lg text-pretty">
            {t(K.pitch)}
          </Text>
        </motion.div>
        <HeroActions />
      </div>
      {/* The control sits on the picture, outside its `inert` layers, so it stays reachable. */}
      <div className="relative">
        <StackLayers isAssembled={isAssembled} isStill={isStill} />
        <IconButton
          icon={Icons.Layers}
          label={t(isAssembled ? K.explode : K.assemble)}
          variant="secondary"
          size="sm"
          aria-pressed={isAssembled}
          onPress={() => setIsAssembled((was) => !was)}
          className="absolute end-3 top-3"
        />
      </div>
    </section>
  );
}
