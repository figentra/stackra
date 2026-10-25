/**
 * Stackra file contract:
 * Purpose: the page of the Carousel route: `@stackra-pro/ui`'s Carousel with five slides, previous and next buttons,
 *          pagination dots, a loop, and a line that says which slide is showing, over slides drawn from token colours.
 * Boundary: presentation and local state only. The slides are coloured panels with a caption, not photographs, so the
 *          page needs no network and every slide's text is checked for contrast; there are no thumbnails, which need an
 *          image address each.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import * as UiPro from "@stackra-pro/ui/react";

import { ProCarouselRoute } from "#src/routes/pro-carousel/pro-carousel.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-carousel.*` keys.
const STRINGS = {
  documentTitle: `${ProCarouselRoute.title} · Stackra Playground`,
  intro:
    "A set of slides to browse. Use the previous and next buttons, the dots, the arrow keys when the carousel has focus, or swipe; the carousel loops.",
  slides: "Release highlights",
  carousel: "Highlights carousel",
  slide: (index: number, total: number) => `Slide ${index} of ${total}`,
  dots: "Slides",
  goTo: (index: number) => `Go to slide ${index}`,
} as const;

const SLIDES = [
  { id: "tokens", title: "Tokens", text: "Colour, type and spacing from one source." },
  { id: "components", title: "Components", text: "HeroUI wrapped behind one contract." },
  { id: "playground", title: "Playground", text: "Every component on its own page." },
  { id: "rtl", title: "Right to left", text: "Logical properties throughout." },
  { id: "dark", title: "Dark mode", text: "Every token has a dark value." },
] as const;

/**
 * One pagination dot. HeroUI Pro's own dots are plain buttons in a `tablist`, which must hold tabs, and 8 px targets,
 * so the page draws each as a 24 px button around the 8 px dot, marks the slide on screen with `aria-current`, and
 * makes the row a plain group.
 */
function SlideDot({ index, isSelected }: { index: number; isSelected: boolean }) {
  const { scrollTo } = UiPro.useCarousel();
  return (
    <button
      type="button"
      aria-label={STRINGS.goTo(index + 1)}
      aria-current={isSelected ? "true" : undefined}
      className="grid size-6 place-items-center rounded-full outline-focus focus-visible:outline-2"
      onClick={() => scrollTo(index)}
    >
      <span className="carousel__dot block" data-selected={isSelected || undefined} />
    </button>
  );
}

/** The Carousel page. */
export function ProCarousel() {
  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProCarouselRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <section aria-labelledby="slides-heading" className="grid gap-3">
        <h2 id="slides-heading" className="type-h2">
          {STRINGS.slides}
        </h2>
        <div className="w-full max-w-md">
          <UiPro.Carousel label={STRINGS.carousel} opts={{ loop: true }}>
            <UiPro.Carousel.Content>
              {SLIDES.map((slide, index) => (
                <UiPro.Carousel.Item key={slide.id}>
                  <div
                    role="group"
                    aria-roledescription="slide"
                    aria-label={STRINGS.slide(index + 1, SLIDES.length)}
                    className="flex aspect-video flex-col items-center justify-center gap-1 rounded-2xl bg-surface-secondary p-6 text-center"
                  >
                    <p className="type-h3">{slide.title}</p>
                    <p className="text-sm">
                      <bdi>{slide.text}</bdi>
                    </p>
                  </div>
                </UiPro.Carousel.Item>
              ))}
            </UiPro.Carousel.Content>
            <UiPro.Carousel.Previous />
            <UiPro.Carousel.Next />
            <UiPro.Carousel.Dots
              role="group"
              aria-label={STRINGS.dots}
              renderDot={(dot) => <SlideDot {...dot} />}
            />
          </UiPro.Carousel>
        </div>
      </section>
    </article>
  );
}
