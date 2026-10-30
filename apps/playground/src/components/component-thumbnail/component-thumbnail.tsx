/**
 * Stackra file contract:
 * Purpose: the thumbnail of a listing card: the entry's `card` example (else its first), rendered live at a readable
 *          scale (0.75 by default), centred on a dot grid, filling the pane its parent sizes (16:10 on the cards). A
 *          demo bigger than its frame scales further down to show whole, to no less than `FLOOR` of the scale (past
 *          that its top shows). Inert and hidden from assistive technology (the card names the component); lazy: the
 *          demo loads once the pane nears the viewport, a skeleton until then, the category glyph when there is no
 *          demo or it throws.
 * Boundary: presentation only; the demo comes from `demos/<tier>/<slug>/<id>.tsx`, the same file the component page
 *           shows as code, so the thumbnail follows scheme, brand, material and direction for free.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 5; owner answer Q4 (live previews); STA-1371
 *          (readable thumbnails, 2026-10-28).
 */
import { Skeleton } from "@stackra/ui/react";
import { lazy, Suspense, useEffect, useMemo, useRef, useState, type ComponentType } from "react";

import { CategoryGlyph } from "#src/components/category-glyph";
import type { ComponentThumbnailProps } from "#src/components/component-thumbnail/component-thumbnail.props";
import { PreviewBoundary } from "#src/components/component-thumbnail/preview-boundary";

/** The demo modules, by path, loaded on demand. */
const DEMOS = import.meta.glob<{ default: ComponentType }>("../../demos/*/*/*.tsx");

/** The least share of the scale a big demo shrinks to, so its text stays readable. */
const FLOOR = 0.7;

/** The live, inert, scaled-down demo, or the category glyph on the brand gradient when there is none. */
export function ComponentThumbnail({ entry, scale = 0.75 }: ComponentThumbnailProps) {
  const example = entry.examples.find((item) => item.card) ?? entry.examples[0];
  const loader = example
    ? DEMOS[`../../demos/${entry.tier}/${entry.slug}/${example.id}.tsx`]
    : undefined;
  const Demo = useMemo(() => (loader ? lazy(loader) : undefined), [loader]);
  const pane = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const [isNear, setNear] = useState(false);
  // The pane's size and the demo's laid-out size, in px; unknown until measured (a test never measures).
  const [box, setBox] = useState<{
    width: number;
    height: number;
    demoWidth: number;
    demoHeight: number;
  }>();

  // The demo mounts once the pane nears the viewport; without an observer (a test) it mounts at once.
  useEffect(() => {
    const element = pane.current;
    if (!element || isNear) return;
    if (typeof IntersectionObserver === "undefined") {
      // oxlint-disable-next-line react/set-state-in-effect -- reason: with no IntersectionObserver (a test) there is nothing to wait for, so the demo mounts at once
      setNear(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((item) => item.isIntersecting)) setNear(true);
      },
      { rootMargin: "200px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [isNear]);

  // Measures the pane and the demo (its scroll size: past the frame when it overflows).
  useEffect(() => {
    const outer = pane.current;
    const inner = content.current;
    // Without an observer (a test) the demo keeps the plain 1/scale frame.
    if (!isNear || !outer || !inner || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() =>
      setBox({
        width: outer.clientWidth,
        height: outer.clientHeight,
        demoWidth: inner.scrollWidth,
        demoHeight: inner.scrollHeight,
      }),
    );
    observer.observe(outer);
    observer.observe(inner);
    return () => observer.disconnect();
  }, [isNear]);

  const glyph = (
    <div className="grid size-full place-items-center bg-linear-to-br from-accent/30 to-accent/5 text-accent">
      <CategoryGlyph category={entry.category} className="size-10" />
    </div>
  );

  // The frame is the pane at 1/scale, grown to the demo; the fit scales it back into the pane, down to the floor.
  const frame = box && {
    width: Math.max(box.width / scale, box.demoWidth),
    height: Math.max(box.height / scale, box.demoHeight),
  };
  const fit =
    box && frame
      ? Math.max(scale * FLOOR, Math.min(box.width / frame.width, box.height / frame.height))
      : scale;
  const isClipped = box !== undefined && frame !== undefined && frame.height * fit > box.height + 1;

  return (
    <div
      ref={pane}
      inert
      aria-hidden="true"
      className="pointer-events-none relative grid size-full place-items-center overflow-hidden select-none [background-image:radial-gradient(var(--border)_1px,transparent_1px)] [background-size:12px_12px]"
    >
      {!Demo ? (
        glyph
      ) : !isNear ? (
        <Skeleton>
          <div className="size-full" />
        </Skeleton>
      ) : (
        <div
          className="absolute left-1/2"
          style={{
            width: frame ? frame.width : `${100 / scale}%`,
            height: frame ? frame.height : `${100 / scale}%`,
            top: isClipped ? 0 : "50%",
            transformOrigin: isClipped ? "top" : "center",
            transform: `translate(-50%, ${isClipped ? "0" : "-50%"}) scale(${fit})`,
          }}
        >
          {/* `safe` centring: a demo bigger than the frame overflows to the end, where it is measured, not both ways. */}
          <div ref={content} className="grid size-full p-6 [place-items:safe_center]">
            <PreviewBoundary fallback={glyph}>
              <Suspense fallback={null}>
                {/* oxlint-disable-next-line react/static-components -- reason: useMemo keys the lazy component on the demo loader, so it is made once per demo file, not on every render */}
                <Demo />
              </Suspense>
            </PreviewBoundary>
          </div>
        </div>
      )}
    </div>
  );
}
