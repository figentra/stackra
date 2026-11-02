/**
 * Stackra file contract:
 * Purpose: `AccountMenuProps`, what a host hands the AccountMenu: its own groups of items (profile, security,
 *          appearance, language), what to do after signing out, and every word.
 * Boundary: an interface in its own file beside the component (ADR 0305). The user and the sign-out are the
 *           container's `SessionService`, never props; the words are the host's (ADR 0504 decision 4).
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0206 (decision 8); ADR 0305.
 */
import type { MenuSection } from "@stackra/ui/contracts";

/**
 * The account menu's items, handler and words.
 *
 * @example
 * <AccountMenu sections={[{ id: "account", title: "Account", items: [{ id: "security", label: "Security", href: "/me/security" }] }]} onSignOut={() => navigate("/")} labels={labels} />
 */
export interface AccountMenuProps {
  /** The host's groups, drawn above the sign-out group: profile, security, appearance, language. */
  readonly sections?: readonly MenuSection[] | undefined;
  /** Called after the session ended (send the visitor home or to sign in). */
  readonly onSignOut?: (() => void) | undefined;
  /** The menu's words; the host writes them. */
  readonly labels: {
    /**
     * The trigger's spoken name before the user's name, for example "Account menu"; the menu is named by its
     * trigger.
     */
    readonly trigger: string;
    /** The sign-out item, for example "Sign out". */
    readonly signOut: string;
  };
  /** Classes on the trigger. */
  readonly className?: string | undefined;
}
