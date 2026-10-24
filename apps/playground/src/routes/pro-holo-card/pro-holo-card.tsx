/**
 * Stackra file contract:
 * Purpose: the page of the HoloCard route: `@stackra/ui-pro`'s HoloCard as a membership card on a dark gradient that
 *          tilts and catches a holographic glare as the pointer moves over it, with the card's text as real text, and a
 *          flat, unlit one beside it for comparison.
 * Boundary: presentation only. The tilt and glare are pointer effects, so the card's content is readable without them;
 *          the gradient is set here, and the white text sits on solid plates of its darkest stop, so its contrast
 *          rests on no gradient or glare.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import * as UiPro from "@stackra/ui-pro/react";

import { ProHoloCardRoute } from "#src/routes/pro-holo-card/pro-holo-card.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-holo-card.*` keys.
const STRINGS = {
  documentTitle: `${ProHoloCardRoute.title} · Stackra Playground`,
  intro:
    "A card that tilts toward the pointer and lights up with a holographic glare. The text on it stays readable when the effect is off.",
  interactive: "Interactive",
  flat: "Flat",
  holder: "Marcus Wong",
  number: "Member 0999",
  tier: "Gold membership",
} as const;

const GRADIENT = "linear-gradient(135deg, #1e1b4b 0%, #312e81 55%, #4c1d95 100%)";

/** The plate under the card's text: the gradient's darkest stop, solid, so the white text holds under any glare. */
const PLATE = "rounded-lg bg-[#1e1b4b] text-white";

/** The face of a membership card, shared by both cards: one content layer, its text on solid plates. */
function Face() {
  return (
    <>
      <UiPro.HoloCard.Inset />
      <UiPro.HoloCard.Pattern />
      <UiPro.HoloCard.Content className="flex-col items-center pb-8">
        <span className={`${PLATE} my-auto grid justify-items-center gap-1 px-4 py-2`}>
          <span className="text-3xl font-bold">{STRINGS.holder}</span>
          <span className="text-sm font-medium">{STRINGS.tier}</span>
        </span>
        <span className={`${PLATE} px-3 py-1 text-sm`}>{STRINGS.number}</span>
      </UiPro.HoloCard.Content>
    </>
  );
}

/** The HoloCard page. */
export function ProHoloCard() {
  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProHoloCardRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <div className="flex flex-wrap gap-8">
        <section aria-labelledby="interactive-heading" className="grid gap-3">
          <h2 id="interactive-heading" className="type-h2">
            {STRINGS.interactive}
          </h2>
          <UiPro.HoloCard gradient={GRADIENT}>
            <UiPro.HoloCard.Rotator>
              <UiPro.HoloCard.Frame>
                <UiPro.HoloCard.Surface>
                  <Face />
                  <UiPro.HoloCard.Shine />
                </UiPro.HoloCard.Surface>
              </UiPro.HoloCard.Frame>
            </UiPro.HoloCard.Rotator>
          </UiPro.HoloCard>
        </section>
        <section aria-labelledby="flat-heading" className="grid gap-3">
          <h2 id="flat-heading" className="type-h2">
            {STRINGS.flat}
          </h2>
          <UiPro.HoloCard gradient={GRADIENT} isInteractive={false}>
            <UiPro.HoloCard.Rotator>
              <UiPro.HoloCard.Frame>
                <UiPro.HoloCard.Surface>
                  <Face />
                </UiPro.HoloCard.Surface>
              </UiPro.HoloCard.Frame>
            </UiPro.HoloCard.Rotator>
          </UiPro.HoloCard>
        </section>
      </div>
    </article>
  );
}
