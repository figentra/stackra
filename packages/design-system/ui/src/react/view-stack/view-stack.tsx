/**
 * Stackra file contract:
 * Purpose: the web `ViewStack`: a drill-down inside one region. Its `ViewStack.View`s are shown one at a time, the top
 *          of a stack that `useViewStack().push(id)` grows and `pop()` (or `ViewStack.Back`) shrinks, moving with the
 *          shared transition vocabulary (`push`, `push-parallax`, `from-top`, `fade`, `none`). A push comes from the
 *          reading end, the left in right-to-left, and going back mirrors it.
 * Boundary: plays the move with the View Transitions API where the browser has it: the region gets a
 *           `view-transition-name` for the move only, and `viewStackKeyframes` drives its old and new snapshots, clipped
 *           to the region. Without the API, the entering view plays the entering frames alone. At the `reduced` motion
 *           level every move is a fade, at `none` nothing plays. The stack lives in the component (not the URL); a
 *           drill-down that should survive a reload is a route.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0329 (motion layer); ADR 0060 (right-to-left); WCAG 2.2 SC 2.3.3 and
 *          2.4.3.
 */
import { type ReactElement, use, useEffect, useId, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";

import type { ViewStackState } from "#contracts/types/view-stack-state.type";
import { viewStackKeyframes } from "#core/functions/view-stack-keyframes.function";
import { DesignSystemContext } from "#react/design-system-provider/design-system-context";
import { useMotion } from "#react/design-system-provider/use-motion";
import { ViewStackBack } from "#react/view-stack/view-stack-back";
import { ViewStackContext } from "#react/view-stack/view-stack-context";
import { ViewStackView } from "#react/view-stack/view-stack-view";
import type { ViewStackProps } from "#react/view-stack/view-stack.props";

/**
 * The snapshot frames drawn as plain, filled layers: opaque unless a frame says otherwise, without the browser's
 * `plus-lighter` blend, and on `fill`, the colour behind the region. A view's snapshot is otherwise as see-through as
 * the view, so a view sliding over another (a parallax push, a back move) showed both views' text at once.
 */
const solid = (frames: readonly Keyframe[], fill: Keyframe): Keyframe[] =>
  frames.map((frame) => ({ opacity: 1, mixBlendMode: "normal", ...fill, ...frame }));

/** The alpha of a computed colour (`rgba(…, a)`, `oklch(… / a)`), 1 when it has none. */
const alphaOf = (color: string): number => {
  const match = /(?:,|\/)\s*([\d.]+)(%?)\s*\)$/u.exec(color);
  if (!match || (!color.includes("/") && !color.startsWith("rgba"))) return 1;
  return Number(match[1]) / (match[2] ? 100 : 1);
};

/**
 * The backgrounds painted at and above `element` down to the first opaque one, as one fill: the opaque colour under
 * the see-through ones (a glass card on the page) layered as flat gradients, so the snapshot matches what is behind.
 */
function backdropOf(element: HTMLElement): Keyframe {
  const layers: string[] = [];
  for (let at: Element | null = element; at; at = at.parentElement) {
    const color = getComputedStyle(at).backgroundColor;
    const alpha = alphaOf(color);
    if (alpha >= 1) {
      return {
        backgroundColor: color,
        backgroundImage:
          layers.map((layer) => `linear-gradient(${layer}, ${layer})`).join(", ") || "none",
      };
    }
    if (alpha > 0) layers.push(color);
  }
  return { backgroundColor: "Canvas", backgroundImage: "none" };
}

/** The view stack root: holds the stack and plays each move. */
// oxlint-disable-next-line react/only-export-components -- the compound is Object.assign(Root, parts), so the export is the root function, which React Refresh takes as a component; the boundary holds (rule-gap B-6)
function ViewStackRoot({
  children,
  defaultView,
  transition = "push",
  onViewChange,
}: ViewStackProps): ReactElement {
  const [stack, setStack] = useState<readonly string[]>([defaultView]);
  const [hasMoved, setHasMoved] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const motion = useMotion();
  const direction = use(DesignSystemContext)?.direction ?? "ltr";
  const name = `stackra-view-stack-${useId().replaceAll(/[^a-zA-Z0-9]/gu, "")}`;
  const current = stack.at(-1) ?? defaultView;
  const isFirst = useRef(true);
  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    onViewChange?.(current);
    // Called once per move, with the view the move ended on.
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- reports moves only, not a new callback identity
  }, [current]);

  const state = useMemo<ViewStackState>(() => {
    const move = (next: readonly string[], way: "forward" | "back") => {
      const commit = () => {
        setHasMoved(true);
        setStack(next);
      };
      const frames = viewStackKeyframes(transition, way, direction, motion);
      const element = ref.current;
      if (!frames || !element) return commit();
      const timing = { duration: frames.durationMs, easing: frames.easing, fill: "both" } as const;
      if (typeof document.startViewTransition !== "function") {
        flushSync(commit);
        element.animate(frames.entering as Keyframe[], timing);
        return undefined;
      }
      element.style.viewTransitionName = name;
      const viewTransition = document.startViewTransition(() => flushSync(commit));
      viewTransition.ready
        .then(() => {
          const root = document.documentElement;
          // The snapshots are drawn above the page: the group is clipped so a slide stays inside the region.
          root.animate([{ clipPath: "inset(0)" }, { clipPath: "inset(0)" }], {
            ...timing,
            pseudoElement: `::view-transition-group(${name})`,
          });
          const fill = backdropOf(element);
          // Going back, the leaving view slides off over the one it uncovers, so it is drawn on top.
          const leavingLayer = way === "back" ? { zIndex: "var(--z-pinned)" } : {};
          root.animate(
            solid(frames.leaving as Keyframe[], fill).map((frame) => ({
              ...frame,
              ...leavingLayer,
            })),
            { ...timing, pseudoElement: `::view-transition-old(${name})` },
          );
          root.animate(solid(frames.entering as Keyframe[], fill), {
            ...timing,
            pseudoElement: `::view-transition-new(${name})`,
          });
        })
        .catch(() => undefined);
      void viewTransition.finished.finally(() => {
        element.style.viewTransitionName = "";
      });
      return undefined;
    };
    return {
      stack,
      current,
      canGoBack: stack.length > 1,
      push: (view) => move([...stack, view], "forward"),
      pop: () => {
        if (stack.length > 1) move(stack.slice(0, -1), "back");
      },
    };
  }, [stack, current, transition, direction, motion, name]);

  const value = useMemo(() => ({ state, hasMoved }), [state, hasMoved]);
  return (
    <ViewStackContext value={value}>
      <div ref={ref} className="relative overflow-hidden" data-slot="view-stack">
        {children}
      </div>
    </ViewStackContext>
  );
}

/** The parts of the compound. */
interface ViewStackParts {
  /** One view, drawn while it is on top. */
  readonly View: typeof ViewStackView;
  /** The button that goes back one view, drawn when there is one. */
  readonly Back: typeof ViewStackBack;
}

/**
 * A drill-down inside one region: `ViewStack.View`s shown one at a time, moved between with `useViewStack()` and
 * `ViewStack.Back`, with one transition vocabulary on web and native.
 */
export const ViewStack: typeof ViewStackRoot & ViewStackParts = Object.assign(ViewStackRoot, {
  View: ViewStackView,
  Back: ViewStackBack,
});
