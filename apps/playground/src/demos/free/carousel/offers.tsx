/**
 * Stackra file contract:
 * Purpose: the "offers" demo of the web Carousel: this week's offers.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { Carousel, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { CAROUSEL_KEYS } from "#src/demos/free/carousel/carousel-keys.constant";

/** The demo's keys. */
const K = CAROUSEL_KEYS.carousel;

/** Carousel: three offers, one at a time. */
export default function Offers() {
  const t = useCatalogueText(MESSAGES.en);
  const slides = [
    ["one", "one_note", "bg-accent-soft"],
    ["two", "two_note", "bg-surface-secondary"],
    ["three", "three_note", "bg-default"],
  ] as const;
  return (
    <Carousel label={t(K.label)} className="w-full max-w-md">
      {slides.map(([title, note, surface]) => (
        <div
          key={title}
          className={`flex h-40 flex-col justify-end gap-1 rounded-xl p-5 ${surface}`}
        >
          <p className="m-0 text-lg font-semibold">{t(K[title])}</p>
          <p className="m-0 text-sm text-muted">{t(K[note])}</p>
        </div>
      ))}
    </Carousel>
  );
}
