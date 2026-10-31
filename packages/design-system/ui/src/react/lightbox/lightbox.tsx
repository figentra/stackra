/**
 * Stackra file contract:
 * Purpose: the web `Lightbox`: a full-screen viewer over a dark scrim, one picture at a time at its whole size, with
 *          "3 of 8", a caption, previous and next buttons, a zoom toggle and a close button. The arrow keys, Home and
 *          End step through the pictures, a swipe does too, and Escape or a press on the scrim closes it.
 * Boundary: React Aria's ModalOverlay, Modal and Dialog: focus is trapped, the page behind is hidden from assistive
 *           technology and focus goes back to what opened it. The arrows follow the reading direction, so in Arabic
 *           the left arrow goes forward. The counter is announced politely. The scrim fades only at full motion.
 *           Zoom shows the picture at its own pixels in a scrolling stage.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); ADR 0329 (motion); WCAG 2.2 SC 1.1.1, 2.1.1,
 *          2.1.2 and 2.4.3; STA-1371 (wave C: content and media).
 */
import { cn } from "@heroui/react";
import { type KeyboardEvent, type ReactElement, useRef, useState } from "react";
import { Dialog, Modal, ModalOverlay, useLocale } from "react-aria-components";

import { MEDIA_KEYS } from "#core/constants/media-keys.constant";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { useMotion } from "#react/design-system-provider/use-motion";
import { useNumberFormat } from "#react/hooks/use-number-format";
import { useUiText } from "#react/hooks/use-ui-text";
import { IconButton } from "#react/icon-button/icon-button";
import type { LightboxProps } from "#react/lightbox/lightbox.props";

/** The lightbox's keys. */
const K = MEDIA_KEYS.ui.lightbox;

/** The buttons on the dark stage. */
const ON_DARK = "text-white hover:bg-white/15";

/** The dark scrim behind the stage. */
const SCRIM = "fixed inset-0 z-(--z-overlay) bg-black/95";

/** The distance in pixels a swipe must travel to change the picture. */
const SWIPE = 48;

/** A full-screen picture viewer. */
export function Lightbox({
  images,
  index,
  defaultIndex = 0,
  onIndexChange,
  isOpen,
  defaultOpen,
  onOpenChange,
  label,
  className,
}: LightboxProps): ReactElement {
  const t = useUiText();
  const format = useNumberFormat();
  const motion = useMotion();
  const { direction } = useLocale();
  const [own, setOwn] = useState(defaultIndex);
  const [isZoomed, setZoomed] = useState(false);
  const swipeStart = useRef<number | null>(null);
  const count = images.length;
  const at = Math.max(0, Math.min(count - 1, index ?? own));
  const image = images[at];

  const goTo = (next: number) => {
    const target = Math.max(0, Math.min(count - 1, next));
    if (target === at) return;
    setOwn(target);
    setZoomed(false);
    onIndexChange?.(target);
  };
  const step = (by: number) => goTo(at + by);
  const onKeyDown = (event: KeyboardEvent) => {
    const forward = direction === "rtl" ? "ArrowLeft" : "ArrowRight";
    const back = direction === "rtl" ? "ArrowRight" : "ArrowLeft";
    const moves: Record<string, () => void> = {
      [forward]: () => step(1),
      [back]: () => step(-1),
      Home: () => goTo(0),
      End: () => goTo(count - 1),
    };
    const move = moves[event.key];
    if (!move || isZoomed) return;
    event.preventDefault();
    move();
  };

  return (
    <ModalOverlay
      isDismissable
      {...omitUndefined({ isOpen, defaultOpen, onOpenChange })}
      className={
        motion === "full"
          ? `${SCRIM} data-[entering]:animate-in data-[entering]:fade-in data-[exiting]:animate-out data-[exiting]:fade-out data-[entering]:duration-(--duration-moderate)`
          : SCRIM
      }
    >
      <Modal className="h-full w-full outline-none">
        {/* oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- reason: React Aria's Dialog takes no key handler, so the keys of the focused dialog and its buttons are read as they bubble through this wrapper */}
        <div className="h-full" onKeyDown={onKeyDown}>
          <Dialog
            aria-label={label ?? t(K.label)}
            data-slot="lightbox"
            className={["flex h-full flex-col text-white outline-none", className]
              .filter(Boolean)
              .join(" ")}
          >
            {({ close }) => (
              <>
                <div className="flex items-center justify-between gap-3 p-3">
                  <span aria-live="polite" className="ps-2 text-sm tabular-nums">
                    {t(K.counter, { index: format(at + 1), count: format(count) })}
                  </span>
                  <div className="flex items-center gap-1">
                    <IconButton
                      icon={isZoomed ? "zoom-out" : "zoom-in"}
                      label={t(isZoomed ? K.zoom_out : K.zoom_in)}
                      variant="ghost"
                      className={ON_DARK}
                      onPress={() => setZoomed(!isZoomed)}
                    />
                    <IconButton
                      icon="x"
                      label={t(K.close)}
                      variant="ghost"
                      className={ON_DARK}
                      onPress={close}
                    />
                  </div>
                </div>
                <div
                  className={cn(
                    "relative flex min-h-0 flex-1 items-center justify-center px-14",
                    isZoomed ? "overflow-auto" : "overflow-hidden",
                  )}
                  onPointerDown={(event) => {
                    swipeStart.current = event.clientX;
                  }}
                  onPointerUp={(event) => {
                    const start = swipeStart.current;
                    swipeStart.current = null;
                    if (start === null || isZoomed) return;
                    const moved = event.clientX - start;
                    if (Math.abs(moved) < SWIPE) return;
                    // A swipe towards the start goes forward: leftwards in English, rightwards in Arabic.
                    step(moved < 0 === (direction === "ltr") ? 1 : -1);
                  }}
                >
                  {image ? (
                    <img
                      key={image.id}
                      src={image.src}
                      alt={image.alt}
                      draggable={false}
                      className={cn(
                        "select-none",
                        isZoomed ? "m-auto max-w-none" : "max-h-full max-w-full object-contain",
                      )}
                    />
                  ) : null}
                  <IconButton
                    icon="chevron-left"
                    label={t(K.previous)}
                    variant="ghost"
                    className={`absolute start-2 top-1/2 -translate-y-1/2 ${ON_DARK}`}
                    isDisabled={at === 0}
                    onPress={() => step(-1)}
                  />
                  <IconButton
                    icon="chevron-right"
                    label={t(K.next)}
                    variant="ghost"
                    className={`absolute end-2 top-1/2 -translate-y-1/2 ${ON_DARK}`}
                    isDisabled={at >= count - 1}
                    onPress={() => step(1)}
                  />
                </div>
                <p className="m-0 min-h-12 p-3 text-center text-sm text-white/80">
                  {image?.caption ?? ""}
                </p>
              </>
            )}
          </Dialog>
        </div>
      </Modal>
    </ModalOverlay>
  );
}
