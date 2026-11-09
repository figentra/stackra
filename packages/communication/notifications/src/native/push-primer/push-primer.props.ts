/**
 * Stackra file contract:
 * Purpose: `PushPrimerProps`, what a host hands the native PushPrimer: how it shows, why it shows, the onboarding
 *          step's write key, the permission handler and every word.
 * Boundary: an interface in its own file beside the component (ADR 0305). The permission request and the device's
 *           registration go through the container's `PushRegistration` port, never props; the words are the host's
 *           (ADR 0504 decision 4).
 * Runtime: react-native
 * Governing contract: ADR 0504 (module UI kits); ADR 0260 (client ports); ADR 0305; the UI build list (2026-11-02).
 */
import type { PrimerTrigger } from "#contracts/types/primer-trigger.type";
import type { PushPermission } from "#contracts/types/push-permission.type";

/**
 * The primer's look, trigger, key, handler and words.
 *
 * @example
 * <PushPrimer trigger="onboarding" idempotencyKey={stepKey} onPermission={next} labels={labels} />
 */
export interface PushPrimerProps {
  /** "sheet" is the full screen content; "inline" is the compact card inside onboarding. Defaults to "sheet". */
  readonly variant?: "sheet" | "inline" | undefined;
  /** Why the primer shows, passed to the port so the service records it. */
  readonly trigger: PrimerTrigger;
  /** Onboarding passes its step's write key so a retry registers the device once. */
  readonly idempotencyKey?: string | undefined;
  /** Called with where the permission stands: after the prompt, or `prompt` when the person chose "not now". */
  readonly onPermission?: ((permission: PushPermission) => void) | undefined;
  /** The primer's words; the host writes them. */
  readonly labels: {
    /** The heading, for example "Stay in the loop". */
    readonly title: string;
    /** What turning push on gives, for example "We'll tell you when an order is ready." */
    readonly description: string;
    /** The button that asks for the permission, for example "Turn on notifications". */
    readonly enable: string;
    /** The button that leaves it for later, for example "Not now". */
    readonly later: string;
    /** Shown when the registration fails, for example "Notifications could not be turned on. Try again." */
    readonly failed: string;
  };
}
