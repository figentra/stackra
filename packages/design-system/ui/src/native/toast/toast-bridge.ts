/**
 * Stackra file contract:
 * Purpose: the link between the imperative native `toast()` and the mounted `ToastProvider`: HeroUI Native shows a
 *          toast only through the `useToast()` hook, so the provider hands its manager to this module and `toast()`
 *          calls through it, from any file, with no hook. A toast called before a provider mounts waits and is shown
 *          when one connects, as the web queue does.
 * Boundary: module state, one provider at a time (the last to connect wins); internal, not in the `native` barrel.
 *           HeroUI Native's manager changes identity as toasts come and go, so the provider reconnects on every change;
 *           `show` and `hide` are called only from event handlers and timers, never during render.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0312 (decision 2); ADR 0165 (HeroUI Native on native).
 */
import type { ToastManager, ToastShowOptions } from "heroui-native";

/** A toast the bridge can hold until a provider connects: it always has an id, so it can be closed meanwhile. */
type PendingToast = ToastShowOptions & { readonly id: string };

/** What the connected provider gave: its manager and the dismiss button's accessible name. */
const state: { manager: ToastManager | undefined; dismissLabel: string; pending: PendingToast[] } =
  {
    manager: undefined,
    dismissLabel: "",
    pending: [],
  };

/** The bridge between `toast()` and the provider. */
export const toastBridge = {
  /** Called by the provider with its current manager: stores it and shows the toasts that were waiting. */
  connect(manager: ToastManager, dismissLabel: string): void {
    state.manager = manager;
    state.dismissLabel = dismissLabel;
    const waiting = state.pending;
    state.pending = [];
    for (const options of waiting) manager.show(options);
  },
  /** Called by the provider when it unmounts: later toasts wait for the next one. */
  disconnect(): void {
    state.manager = undefined;
  },
  /** Shows a toast now, or holds it until a provider connects. */
  show(options: PendingToast): void {
    if (state.manager === undefined) state.pending.push(options);
    else state.manager.show(options);
  },
  /** Hides one toast by id, or every toast with `"all"`, including the ones still waiting. */
  hide(ids: string): void {
    state.pending = ids === "all" ? [] : state.pending.filter((options) => options.id !== ids);
    state.manager?.hide(ids);
  },
  /** The dismiss button's accessible name the connected provider was given. */
  dismissLabel(): string {
    return state.dismissLabel;
  },
};
