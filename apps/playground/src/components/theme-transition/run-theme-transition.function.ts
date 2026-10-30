/**
 * Stackra file contract:
 * Purpose: `runThemeTransition`: applies a change to the page (a scheme, locale, material or brand) inside a View
 *          Transition, drawn by Uniwind Pro's `view-transition.css` presets: `data-uniwind-transition` on <html> and
 *          the origin in `--uniwind-transition-origin-x/y`, the last pointer press or else the focused control.
 *          Reduced motion plays a fade; no View Transitions API (or `none`) applies the change at once.
 * Boundary: the transition only; what changes is the caller's `update`.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 11: Uniwind Pro); WCAG 2.2 SC 2.3.3 (reduced motion).
 */
import "./theme-transition.css";

import { flushSync } from "react-dom";

import { readThemeTransition } from "./read-theme-transition.function";
import type { ThemeTransitionPreset } from "./theme-transition-preset.type";

/** How long a press stays the origin of the transition it starts, in milliseconds. */
const PRESS_WINDOW = 1000;

/** The longest the page stays frozen waiting for the change to reach the DOM, in milliseconds. */
const SETTLE_LIMIT = 300;

let lastPress: { x: number; y: number; time: number } | undefined;
let running = 0;

// A toggle reports its choice, not where it was pressed, so the press is caught on its way down.
if (typeof document !== "undefined")
  document.addEventListener(
    "pointerdown",
    (event) => {
      lastPress = { x: event.clientX, y: event.clientY, time: event.timeStamp };
    },
    { capture: true, passive: true },
  );

/** Where the transition starts: the last press, else the focused control's centre, else the viewport's. */
function origin(): { x: number; y: number } {
  if (lastPress && performance.now() - lastPress.time < PRESS_WINDOW) return lastPress;
  const focused = document.activeElement;
  if (focused && focused !== document.body) {
    const box = focused.getBoundingClientRect();
    return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
  }
  return { x: innerWidth / 2, y: innerHeight / 2 };
}

/**
 * Runs `update` inside a View Transition with the picked preset.
 *
 * @param update the change, applied once (synchronously when there is no transition)
 * @param preset the preset to play; the picked one by default
 */
export function runThemeTransition(
  update: () => void,
  preset: ThemeTransitionPreset = readThemeTransition(),
): void {
  if (preset === "none" || typeof document.startViewTransition !== "function") {
    update();
    return;
  }
  const root = document.documentElement;
  const name = matchMedia("(prefers-reduced-motion: reduce)").matches ? "fade" : preset;
  const { x, y } = origin();
  root.style.setProperty("--uniwind-transition-origin-x", `${x}px`);
  root.style.setProperty("--uniwind-transition-origin-y", `${y}px`);
  root.dataset["uniwindTransition"] = name;
  const id = ++running;
  // React Router commits its updates in a transition, which flushSync does not flush, so the new snapshot waits for the
  // first DOM change the update makes (or the limit, when it makes none).
  const transition = document.startViewTransition(
    () =>
      new Promise<void>((resolve) => {
        const observer = new MutationObserver(() => {
          observer.disconnect();
          resolve();
        });
        observer.observe(root, {
          attributes: true,
          childList: true,
          characterData: true,
          subtree: true,
        });
        setTimeout(() => {
          observer.disconnect();
          resolve();
        }, SETTLE_LIMIT);
        flushSync(update);
      }),
  );
  void transition.finished
    .catch(() => undefined)
    .finally(() => {
      if (id === running) delete root.dataset["uniwindTransition"];
    });
}
