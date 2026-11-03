/**
 * Stackra file contract:
 * Purpose: the web `Schematic`: a blueprint machine of named `SchematicNode`s, laid out by the caller, joined by
 *          orthogonal pipes. After layout it measures each node and draws every link from the bottom centre of its
 *          `from` node to the top centre of its `to` node (down, across, down) in the blueprint pipe, with a junction
 *          square where the pipe turns across. At the `full` motion level it draws the pipes in on the motion kit's
 *          80 ms floor steps (one segment a step, no easing) the first time it comes into view; otherwise they are
 *          drawn at once.
 * Boundary: a group named by `label`; the nodes read in DOM order and keep their own focus stops; the pipes are
 *           decoration hidden from assistive tech. Pipes are measured, never flipped, so right-to-left draws them
 *           where the mirrored layout put the nodes. It re-measures when the machine or a node resizes. The server
 *           renders the nodes only; the pipes need a layout to measure.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0501 (section 9, the blueprint roles); ADR 0060 (right-to-left);
 *          motion principles (one orchestrated moment, 80 ms floor steps); WCAG 2.2 SC 2.3.3; STA-2041.
 */
import { cn } from "@heroui/react";
import { type ReactElement, useEffect, useLayoutEffect, useRef, useState } from "react";

import type { SchematicLink } from "#contracts/types/schematic-link.type";
import { useMotion } from "#react/design-system-provider/use-motion";
import type { SchematicProps } from "#react/schematic/schematic.props";

/** The motion kit's floor step, as TerminalDemo plays it. */
// oxlint-disable-next-line stackra/no-literal-duration -- reason: the 80 ms floor step has no theme motion step yet (design pass §5 proposes one)
const STEP_MS = 80;

/** The segments of a pipe: down, across, down. */
const SEGMENTS = 3;

/** The step each link starts drawing on: a link leaving a node another link reaches starts once that one is drawn. */
const startsOf = (links: readonly SchematicLink[]): number[] => {
  const depth = new Map<string, number>();
  return links.map(({ from, to }) => {
    const level = depth.get(from) ?? 0;
    depth.set(to, Math.max(depth.get(to) ?? 0, level + 1));
    return level * SEGMENTS;
  });
};

/** The four corners of each link's pipe, relative to the machine, with the step it starts on; unknown nodes skipped. */
const measure = (root: HTMLElement, links: readonly SchematicLink[]) => {
  const box = root.getBoundingClientRect();
  const boxes = new Map<string, DOMRect>();
  for (const node of root.querySelectorAll<HTMLElement>("[data-schematic-node]"))
    boxes.set(node.dataset.schematicNode ?? "", node.getBoundingClientRect());
  const starts = startsOf(links);
  return links.flatMap((link, index) => {
    const from = boxes.get(link.from);
    const to = boxes.get(link.to);
    if (!from || !to) return [];
    const x1 = from.left + from.width / 2 - box.left;
    const y1 = from.bottom - box.top;
    const centre = to.left + to.width / 2 - box.left;
    // Under a pixel apart is one straight pipe, not a jog.
    const x2 = Math.abs(centre - x1) < 1 ? x1 : centre;
    const y2 = to.top - box.top;
    const across = (y1 + y2) / 2;
    const corners: readonly (readonly [number, number])[] = [
      [x1, y1],
      [x1, across],
      [x2, across],
      [x2, y2],
    ];
    return [{ key: `${link.from}>${link.to}#${index}`, corners, start: starts[index] ?? 0 }];
  });
};

/** A machine of named parts joined by pipes. */
export function Schematic({
  label,
  children,
  links,
  drawOnView = true,
  className,
}: SchematicProps): ReactElement {
  const root = useRef<HTMLDivElement>(null);
  const motion = useMotion();
  const plays = drawOnView && motion === "full";
  const [pipes, setPipes] = useState<ReturnType<typeof measure>>([]);
  // Every pipe drawn, as the server and a still page show it.
  const [step, setStep] = useState(Number.POSITIVE_INFINITY);
  const [isStarted, setIsStarted] = useState(false);
  const starts = startsOf(links);
  const total = starts.length === 0 ? 0 : Math.max(...starts) + SEGMENTS;

  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return undefined;
    const update = () => setPipes(measure(element, links));
    update();
    if (typeof ResizeObserver !== "function") return undefined;
    const sizes = new ResizeObserver(update);
    sizes.observe(element);
    for (const node of element.querySelectorAll("[data-schematic-node]")) sizes.observe(node);
    return () => sizes.disconnect();
    // A caller's inline `links` re-measures only when the caller renders again: the measure updates this component alone.
  }, [links]);

  // Before paint, so a machine about to draw in never flashes its pipes.
  useLayoutEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- reason: a still page shows every pipe; only a playing one rewinds
    if (plays) setStep(0);
  }, [plays]);

  useEffect(() => {
    const element = root.current;
    if (!plays || isStarted || !element) return undefined;
    if (typeof IntersectionObserver !== "function") {
      // oxlint-disable-next-line react/set-state-in-effect -- reason: with no IntersectionObserver there is no view to wait for
      setIsStarted(true);
      return undefined;
    }
    const sight = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setIsStarted(true);
      },
      { threshold: 0.2 },
    );
    sight.observe(element);
    return () => sight.disconnect();
  }, [plays, isStarted]);

  useEffect(() => {
    if (!plays || !isStarted || step >= total) return undefined;
    const next = setTimeout(() => setStep((count) => count + 1), STEP_MS);
    return () => clearTimeout(next);
  }, [plays, isStarted, step, total]);

  const drawn = plays ? step : Number.POSITIVE_INFINITY;
  const junctions = new Map<string, readonly [number, number]>();
  const paths = pipes.flatMap(({ key: pipe, corners, start }) => {
    const shown = Math.min(SEGMENTS, Math.max(0, drawn - start));
    if (shown === 0) return [];
    const turn = corners[1];
    // The junction sits where the pipe turns across, once it does; a straight pipe has none.
    if (shown >= 2 && turn && corners[0]?.[0] !== corners[3]?.[0])
      junctions.set(`${Math.round(turn[0])}:${Math.round(turn[1])}`, turn);
    const d = corners
      .slice(0, shown + 1)
      .map(([x, y], index) => `${index === 0 ? "M" : "L"}${x} ${y}`)
      .join(" ");
    return [<path key={pipe} d={d} />];
  });

  return (
    <div
      ref={root}
      role="group"
      aria-label={label}
      data-slot="schematic"
      data-drawn={drawn >= total ? "" : undefined}
      className={cn("relative", className)}
    >
      <div
        aria-hidden="true"
        data-slot="schematic-pipes"
        className="pointer-events-none absolute inset-0"
      >
        <svg className="absolute inset-0 size-full overflow-visible fill-none [stroke:var(--blueprint-pipe)] [stroke-width:var(--blueprint-pipe-width)]">
          {paths}
        </svg>
        {[...junctions].map(([at, [x, y]]) => (
          <span
            key={at}
            data-slot="schematic-junction"
            // Measured coordinates are physical, so the junction is placed physically too.
            style={{ left: x, top: y }}
            className="absolute size-(--blueprint-junction-size) -translate-x-1/2 -translate-y-1/2 bg-background [border:var(--blueprint-pipe-width)_solid_var(--blueprint-pipe)]"
          />
        ))}
      </div>
      {children}
    </div>
  );
}
