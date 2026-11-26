/**
 * Stackra file contract:
 * Purpose: `NotificationPreferencesProps`, what a host hands the web NotificationPreferences: whose preferences are
 *          edited, which channels are offered, and every word.
 * Boundary: an interface in its own file beside the component (ADR 0305). The rows are read and saved through the
 *           container's `NotificationPreferencesClient` port, never props; the words are the host's (ADR 0504
 *           decision 4). Channels are `NotificationChannel` codes.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0260 (client ports); ADR 0305; the UI build list (2026-11-02).
 */
import type { NotificationChannel } from "#contracts/enums/notification-channel.enum";

/**
 * The editor's scope, channels and words.
 *
 * @example
 * <NotificationPreferences channels={["mail", "push"]} labels={labels} />
 */
export interface NotificationPreferencesProps {
  /** The channels offered, in this order. Defaults to every channel a topic offers, in the enum's order. */
  readonly channels?: readonly NotificationChannel[] | undefined;
  /** Whose preferences are edited: the person's (`user`) or their organisation's (`tenant`). Defaults to `user`. */
  readonly scope?: "user" | "tenant" | undefined;
  /** The editor's words; the host writes them. */
  readonly labels: {
    /** The section's title, for example "Notifications". */
    readonly title: string;
    /** The line under the title. */
    readonly description?: string | undefined;
    /** Each channel's name, for example `{ mail: "Email", push: "Push" }`. */
    readonly channels: Readonly<Record<NotificationChannel, string>>;
    /** Under a channel that cannot be turned off, for example "Always on". */
    readonly locked: string;
    /** The spoken name of the editor while it loads, for example "Loading preferences". */
    readonly loading: string;
    /** Shown when the preferences cannot be read, for example "Your preferences could not be loaded." */
    readonly loadFailed: string;
    /** The retry button after a failed read, for example "Try again". */
    readonly retry: string;
    /** Shown when there is nothing to set, for example "There is nothing to set yet." */
    readonly empty: string;
    /** The save button, for example "Save preferences". */
    readonly save: string;
    /** Announced after a save, for example "Preferences saved". */
    readonly saved: string;
    /** Shown when a save fails, for example "Your preferences could not be saved." */
    readonly saveFailed: string;
  };
}
