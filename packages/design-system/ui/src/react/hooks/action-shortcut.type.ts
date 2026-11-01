/**
 * Stackra file contract:
 * Purpose: `ActionShortcut`, what `useActionShortcut` returns for a component to draw: the inline hint, the hold-Mod
 *          badge, the `aria-keyshortcuts` prop and the tooltip wrapper.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0508.
 */
import type { ReactElement, ReactNode, Ref, RefCallback } from "react";

/** What the component draws. */
export interface ActionShortcut {
  /** The inline Kbd, in visible mode. */
  readonly hint: ReactNode;
  /** The badge over the control while Mod is held, when no inline hint shows. */
  readonly badge: ReactNode;
  /** The `aria-keyshortcuts` prop, spread on a plain DOM control. */
  readonly aria: { readonly "aria-keyshortcuts"?: string };
  /**
   * A ref that writes `aria-keyshortcuts` on the element, merged with the caller's own ref: React Aria's components
   * drop unknown aria props, so a HeroUI control takes the attribute this way.
   */
  readonly attach: <T extends Element>(own?: Ref<T> | undefined) => RefCallback<T>;
  /** Wraps the control in a Tooltip with the keys when the mode asks for one. */
  readonly wrap: (element: ReactElement) => ReactElement;
  /** True when a binding is in force. */
  readonly isBound: boolean;
}
