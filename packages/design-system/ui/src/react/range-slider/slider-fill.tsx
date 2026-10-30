/**
 * Stackra file contract:
 * Purpose: `SliderFill`, the filled part of a web slider's track, placed with logical properties: HeroUI's own fill
 *          is placed from the physical left, so in right-to-left it grew away from the thumb.
 * Boundary: internal; drawn inside `Slider.Track`'s render function by Slider and RangeSlider. Decoration only.
 * Runtime: browser
 * Governing contract: ADR 0060 (right-to-left); STA-1371 (wave A: fixes live in the component).
 */
import type { ReactElement } from "react";
import type { SliderTrackRenderProps } from "react-aria-components";

/** The fill between the track's start (or the first thumb) and the last thumb. */
export function SliderFill({ state }: Pick<SliderTrackRenderProps, "state">): ReactElement {
  const last = state.values.length - 1;
  const start = last > 0 ? state.getThumbPercent(0) * 100 : 0;
  const size = state.getThumbPercent(last) * 100 - start;
  return (
    <div
      aria-hidden
      data-slot="slider-fill"
      className="slider__fill"
      style={
        state.orientation === "vertical"
          ? { bottom: `${start}%`, height: `${size}%` }
          : { insetInlineStart: `${start}%`, width: `${size}%` }
      }
    />
  );
}
