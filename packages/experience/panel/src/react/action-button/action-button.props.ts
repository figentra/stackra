/**
 * Stackra file contract:
 * Purpose: `ActionButtonProps`, what a host hands the ActionButton: the `ActionButtonSpec` look (icons, variant, size,
 *          full width, shortcut, disabled and its reason, description, tone, link, permission, confirmation, record
 *          predicate), the visible label, and what a press does: run the consumed action with its input, or the host's
 *          own handler.
 * Boundary: a type in its own file beside the component (ADR 0305). The spec's `action` key is resolved by the host (gen
 *           imports the ref from `#stackra/clients`), so `action` here is the `ActionRef`; `place` is where the host draws
 *           it. Spec text fields are words or i18n keys.
 * Runtime: browser
 * Governing contract: ADR 0307 (rules 3 and 4); ADR 0139; ADR 0504; the SDUI catalogue case `actionButton` (STA-1981).
 */
import type { ActionRef } from "@stackra/clients";
import type { ReactNode } from "react";

import type { ActionButtonSpec } from "#core/types/action-button-spec.type";
import type { ActionRun } from "#react/action-runner/action-run.type";

/**
 * The button's look and what a press does.
 *
 * @example
 * <ActionButton action={CancelOrderAction} input={{ orderId }} variant="danger" startIcon="x">{labels.cancel}</ActionButton>
 */
export interface ActionButtonProps extends Omit<ActionButtonSpec, "action" | "place"> {
  /** The visible label; the host's words. */
  readonly children: ReactNode;
  /** The action a press runs through the panel's action runner; absent with `onPress` or `href`. */
  readonly action?: ActionRef | undefined;
  /** The run's input (the record id, a bound parent id). Defaults to none. */
  readonly input?: Readonly<Record<string, unknown>> | undefined;
  /** Called in place of a run; a returned promise keeps the button busy until it settles. */
  readonly onPress?: (() => void | Promise<void>) | undefined;
  /** The record `visibleWhen` reads. */
  readonly record?: object | undefined;
  /** Called with the end of a run (done, cancelled or refused). */
  readonly onRun?: ((run: ActionRun) => void) | undefined;
}
