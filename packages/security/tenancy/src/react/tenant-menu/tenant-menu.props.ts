/**
 * Stackra file contract:
 * Purpose: `TenantMenuProps`, what a host hands the web TenantMenu: the line under each membership, what to do
 *          after a switch, and every word.
 * Boundary: an interface in its own file beside the component (ADR 0305). The memberships and the switch are the
 *           container's `TenantSwitcher`, never props; the words are the host's (ADR 0504 decision 4).
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0208 (memberships); ADR 0327 (decision 10); ADR 0305.
 */
import type { TenantMembership } from "#core/types/tenant-membership.type";

/**
 * The switcher's handlers and words.
 *
 * @example
 * <TenantMenu describe={(m) => roleName(m.role)} onSwitched={() => navigate("/")} labels={labels} />
 */
export interface TenantMenuProps {
  /** The muted line under a membership, such as its role's name; none by default, since role codes are not words. */
  readonly describe?: ((membership: TenantMembership) => string) | undefined;
  /** Called after a switch succeeds, and when the current membership is chosen again (close a drawer, go home). */
  readonly onSwitched?: ((tenantId: string) => void) | undefined;
  /** The switcher's words; the host writes them. */
  readonly labels: {
    /**
     * The trigger's spoken name before the current membership's name, for example "Switch organisation"; the menu is
     * named by its trigger.
     */
    readonly trigger: string;
    /** The line a membership shows while the switch to it runs, for example "Switching…". */
    readonly switching: string;
    /** Shown when a switch fails, for example "Couldn't switch organisation. Try again." */
    readonly failed: string;
  };
  /** Classes on the switcher's wrapper. */
  readonly className?: string | undefined;
}
