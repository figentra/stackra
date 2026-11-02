/**
 * Stackra file contract:
 * Purpose: `MembersPageProps`, what a host hands the web MembersPage: the roles and their words, the roles an invite
 *          may grant, whether outside members are allowed, what to do after an invitation is sent, and every word.
 * Boundary: an interface in its own file beside the component (ADR 0305). The members and invitations are the
 *           container's `TenantMembers` port, never props. The roles come from the host, because tenancy must not
 *           depend on @stackra/iam; the words are the host's (ADR 0504 decision 4).
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0260 (client ports); ADR 0208 (memberships); OS ADR 0010
 *                     (external members); ADR 0305.
 */
import type { SelectItem } from "@stackra/ui/contracts";

/**
 * The page's roles, handler and words.
 *
 * @example
 * <MembersPage roles={roles} inviteRoles={["admin", "staff"]} onInvited={() => toast.show(sent)} labels={labels} />
 */
export interface MembersPageProps {
  /** Every role a member may hold: its code as `id` and its name in the app's language as `label`. */
  readonly roles: readonly SelectItem[];
  /** The codes of the roles an invite may grant. Defaults to every role in `roles`. */
  readonly inviteRoles?: readonly string[] | undefined;
  /** True to show each member's kind and to let an invite be for an outside member (a portal role). */
  readonly allowExternal?: boolean | undefined;
  /** Called with the new invitation's id after an invitation is sent. */
  readonly onInvited?: ((invitationId: string) => void) | undefined;
  /** The page's words; the host writes them. */
  readonly labels: {
    /** The page title, for example "Members". */
    readonly title: string;
    /** The line under the title. */
    readonly description?: string | undefined;
    /** The members table's name, for example "Members". */
    readonly members: string;
    /** The spoken name of the members table while it loads, for example "Loading members". */
    readonly loadingMembers: string;
    /** What the members table says when it is empty, for example "No members yet". */
    readonly noMembers: string;
    /** The name column, for example "Name". */
    readonly name: string;
    /** Shown for a member whose name identity cannot say, for example "Unnamed member". */
    readonly unnamedMember: string;
    /** The role column and field, for example "Role". */
    readonly role: string;
    /** The kind column and field, for example "Type". */
    readonly kind: string;
    /** A staff member's kind, for example "Staff". */
    readonly internal: string;
    /** An outside member's kind, for example "External". */
    readonly external: string;
    /** The actions column, for example "Actions". */
    readonly actions: string;
    /** The remove button, for example "Remove". */
    readonly remove: string;
    /** The question before a removal, for example "Remove this member?". */
    readonly removeTitle: string;
    /** What a removal does, for example "They lose access to this organisation at once." */
    readonly removeDescription?: string | undefined;
    /** The confirming button of a removal, for example "Remove member". */
    readonly removeConfirm: string;
    /** The refusing button of a dialog, for example "Cancel". */
    readonly cancel: string;
    /** The invite action and the invite dialog's submit, for example "Invite". */
    readonly invite: string;
    /** The invite dialog's title, for example "Invite a member". */
    readonly inviteTitle: string;
    /** The email field, for example "Email". */
    readonly email: string;
    /** The invitations table's name, for example "Invitations". */
    readonly invitations: string;
    /** The spoken name of the invitations table while it loads, for example "Loading invitations". */
    readonly loadingInvitations: string;
    /** What the invitations table says when it is empty, for example "No invitations". */
    readonly noInvitations: string;
    /** The status column, for example "Status". */
    readonly status: string;
    /** Each invitation status's word. */
    readonly statuses: {
      readonly pending: string;
      readonly accepted: string;
      readonly revoked: string;
      readonly expired: string;
    };
    /** The revoke button, for example "Revoke". */
    readonly revoke: string;
    /** Shown when a table cannot be loaded, for example "This list could not be loaded." */
    readonly loadFailed: string;
    /** The retry button after a failed load, for example "Try again". */
    readonly retry: string;
    /** Shown when a change is refused because it would leave no owner, for example "Name another owner first." */
    readonly lastOwner: string;
    /** Shown when a role does not fit the member's kind, for example "That role is not for outside members." */
    readonly externalRole: string;
    /** Shown when any other change fails, for example "The change could not be made." */
    readonly failed: string;
  };
}
