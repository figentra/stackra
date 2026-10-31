/**
 * Stackra file contract:
 * Purpose: `createShortcutRegistry`, the runtime registry of UI actions behind `ShortcutProvider`: it registers and
 *          lists actions, keeps the overlay stack, matches a key press to the one action that answers it (scope,
 *          typing guard, IME composition, single-key setting, two-key sequences, `when`) and runs it, and drives the
 *          hold-Mod reveal (`REVEAL_DELAY` of Mod alone).
 * Boundary: no React; the provider feeds it window key events. Matching reads the physical key (`shortcutStepOf`),
 *           so a layout that types other characters still matches. A disabled action, or one whose permission the
 *           host's `can` refuses, is never active and never listed. A matched key is consumed: default prevented and
 *           propagation stopped, so the focused widget does not act on it too.
 * Runtime: browser
 * Governing contract: ADR 0508 (scopes, typing guard, IME, sequences, reveal).
 */
import { CHORD_TIMEOUT } from "#core/constants/chord-timeout.constant";
import { REVEAL_DELAY } from "#core/constants/reveal-delay.constant";
import { ShortcutScope } from "#core/enums/shortcut-scope.enum";
import { effectiveShortcutKeys } from "#core/functions/effective-shortcut-keys.function";
import { isCharacterShortcutStep } from "#core/functions/is-character-shortcut-step.function";
import { isPlainShortcutStep } from "#core/functions/is-plain-shortcut-step.function";
import { resolveShortcutStep } from "#core/functions/resolve-shortcut-step.function";
import { shortcutStepOf } from "#core/functions/shortcut-step-of.function";
import type { ShortcutAction } from "#core/types/shortcut-action.type";
import { isTypingTarget } from "#react/shortcut-provider/is-typing-target.function";
import type { RegisteredShortcut } from "#react/shortcut-provider/registered-shortcut.type";
import type { ShortcutRegistration } from "#react/shortcut-provider/shortcut-registration.type";
import type { ShortcutRegistry } from "#react/shortcut-provider/shortcut-registry.type";
import type { ShortcutRegistryConfig } from "#react/shortcut-provider/shortcut-registry-config.type";

/** The narrower the scope, the earlier it answers. */
const PRIORITY: Readonly<Record<ShortcutScope, number>> = {
  [ShortcutScope.Focus]: 3,
  [ShortcutScope.Overlay]: 2,
  [ShortcutScope.Page]: 1,
  [ShortcutScope.App]: 0,
};

/** Whether `target` is inside `element`. */
const inside = (element: Element | null | undefined, target: unknown): boolean =>
  element !== null &&
  element !== undefined &&
  typeof Node !== "undefined" &&
  target instanceof Node &&
  element.contains(target);

/** Whether `target` is inside a key recorder that is capturing (`data-shortcut-recording`). */
const isRecording = (target: unknown): boolean =>
  typeof Element !== "undefined" &&
  target instanceof Element &&
  target.closest("[data-shortcut-recording]") !== null;

/** Runs `action` unless its `when` says no. */
const runAction = (action: ShortcutAction): boolean => {
  if (action.when !== undefined && !action.when()) return false;
  action.run();
  return true;
};

/**
 * A registry reading its settings, platform and permission check from `config` at each call.
 *
 * @example
 * const registry = createShortcutRegistry(() => ({ settings, apple: true, rtl: false, can: () => true }));
 * registry.register({ action: () => save, scope: "page", overlay: null });
 */
export function createShortcutRegistry(config: () => ShortcutRegistryConfig): ShortcutRegistry {
  const registrations = new Map<number, ShortcutRegistration>();
  const overlays: number[] = [];
  const listeners = new Set<() => void>();
  const viewListeners = new Set<() => void>();
  let next = 0;
  let listing: readonly RegisteredShortcut[] | null = null;
  let pending: { steps: string[]; at: number } | null = null;
  let revealTimer: ReturnType<typeof setTimeout> | undefined;
  let revealed = false;
  let keyboard = false;

  const changed = () => {
    listing = null;
    for (const listener of listeners) listener();
  };
  const setView = (nextRevealed: boolean, nextKeyboard = keyboard) => {
    if (nextRevealed === revealed && nextKeyboard === keyboard) return;
    revealed = nextRevealed;
    keyboard = nextKeyboard;
    for (const listener of viewListeners) listener();
  };
  const cancelReveal = () => {
    if (revealTimer !== undefined) clearTimeout(revealTimer);
    revealTimer = undefined;
    setView(false);
  };

  /** The usable registrations, each with its action and binding in force. */
  const usable = () => {
    const { settings, rtl, can } = config();
    return [...registrations.entries()].flatMap(([token, registration]) => {
      const action = registration.action();
      if (action === undefined || action.isDisabled) return [];
      if (action.permission !== undefined && !can(action.permission)) return [];
      return [{ token, registration, action, keys: effectiveShortcutKeys(action, settings, rtl) }];
    });
  };

  /** Whether a registration listens now. */
  const isActive = (registration: ShortcutRegistration, target: unknown): boolean => {
    switch (registration.scope) {
      case ShortcutScope.App: {
        return true;
      }
      case ShortcutScope.Page: {
        return overlays.length === 0;
      }
      case ShortcutScope.Overlay: {
        return registration.overlay !== null && overlays.at(-1) === registration.overlay;
      }
      case ShortcutScope.Focus: {
        return inside(registration.within?.current, target);
      }
    }
  };

  return {
    config,
    register(registration) {
      const token = next++;
      registrations.set(token, registration);
      changed();
      return () => {
        registrations.delete(token);
        changed();
      };
    },
    pushOverlay(id) {
      overlays.push(id);
      return () => {
        const index = overlays.lastIndexOf(id);
        if (index !== -1) overlays.splice(index, 1);
      };
    },
    list() {
      listing ??= usable().map(({ registration, action, keys }) => ({
        id: action.id,
        label: action.label,
        group: action.group,
        scope: registration.scope,
        icon: action.icon,
        defaultKeys: action.shortcut,
        keys,
      }));
      return listing;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    run(id) {
      const found = usable().find(({ action }) => action.id === id);
      return found === undefined ? false : runAction(found.action);
    },
    keyDown(press, now) {
      const { settings, apple } = config();
      const modKey = apple ? "Meta" : "Control";
      if (!keyboard) setView(revealed, true);
      if (press.key === modKey && !press.shiftKey && !press.altKey) {
        if (revealTimer === undefined && !revealed)
          revealTimer = setTimeout(() => {
            revealTimer = undefined;
            setView(true);
          }, REVEAL_DELAY);
        return false;
      }
      cancelReveal();
      if (!settings.enabled || press.isComposing === true || press.keyCode === 229) return false;
      // A key recorder (the settings panel) is capturing this press: it is the new binding, not a shortcut.
      if (isRecording(press.target)) return false;
      const step = shortcutStepOf(press);
      if (step === undefined) return false;
      const typing = isTypingTarget(press.target);
      const candidates = usable().flatMap((entry) => {
        if (entry.keys === undefined || !isActive(entry.registration, press.target)) return [];
        const steps = entry.keys.split(" ");
        if (typing && isPlainShortcutStep(steps[0] ?? "")) return [];
        if (!settings.singleKey && steps.some(isCharacterShortcutStep)) return [];
        return [{ ...entry, steps: steps.map((one) => resolveShortcutStep(one, apple)) }];
      });
      const attempt = (pressed: readonly string[]) => {
        const starts = candidates.filter((candidate) =>
          pressed.every((one, index) => candidate.steps[index] === one),
        );
        const full = starts
          .filter((candidate) => candidate.steps.length === pressed.length)
          .toSorted(
            (first, second) =>
              PRIORITY[second.registration.scope] - PRIORITY[first.registration.scope] ||
              second.token - first.token,
          );
        for (const candidate of full)
          if (runAction(candidate.action)) {
            pending = null;
            press.preventDefault();
            // Consumed: the focused widget must not act on the same key (Space would also select a row).
            press.stopPropagation?.();
            return true;
          }
        if (starts.some((candidate) => candidate.steps.length > pressed.length)) {
          pending = { steps: [...pressed], at: now };
          return true;
        }
        return false;
      };
      const earlier = pending !== null && now - pending.at <= CHORD_TIMEOUT ? pending.steps : [];
      pending = null;
      if (earlier.length > 0 && attempt([...earlier, step])) return true;
      return attempt([step]);
    },
    keyUp(key) {
      const modKey = config().apple ? "Meta" : "Control";
      if (key === modKey) cancelReveal();
    },
    reset() {
      pending = null;
      cancelReveal();
    },
    isRevealed: () => revealed,
    hasKeyboard: () => keyboard,
    subscribeView(listener) {
      viewListeners.add(listener);
      return () => viewListeners.delete(listener);
    },
  };
}
