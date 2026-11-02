/**
 * Stackra file contract:
 * Purpose: `RolesPageProps`, what a host hands the RolesPage: the roles, the permission groups and the grants to show,
 *          which modules' permissions to list, whether custom roles may be edited, the save handler and every word.
 * Boundary: an interface in its own file beside the component (ADR 0305). The package cannot call the service that
 *           stores roles, so the data comes in through props and a save goes out through `onSave`; the host binds both
 *           to its generated client. The words are the host's (ADR 0504 decision 4).
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0208 (roles and permission names); ADR 0305.
 */
import type { PermissionGrants, PermissionGroup, PermissionRole } from "@stackra/ui/contracts";

/**
 * The roles page's data, handlers and words.
 *
 * @example
 * <RolesPage roles={roles} groups={groups} grants={grants} isEditable onSave={saveGrants} labels={labels} />
 */
export interface RolesPageProps {
  /** The roles, one column each; `isCustom` marks a role the organisation made, the only kind that can be edited. */
  readonly roles: readonly (PermissionRole & { readonly isCustom?: boolean | undefined })[];
  /** The permissions in groups, one group per module whose `id` is the module key, with translated names. */
  readonly groups: readonly PermissionGroup[];
  /** The permission ids each role holds, by role id. */
  readonly grants: PermissionGrants;
  /** The module keys whose permission groups are listed; every group given by default. */
  readonly permissionGroups?: readonly string[] | undefined;
  /** True to allow editing the custom roles' grants; the built-in roles stay read-only. */
  readonly isEditable?: boolean | undefined;
  /**
   * Called with the custom roles' grants when the person saves; a rejection keeps the edits and shows `failed`. The
   * host passes the stored grants back through `grants` afterwards.
   */
  readonly onSave?: ((grants: PermissionGrants) => Promise<void> | void) | undefined;
  /** The page's words; the host writes them. */
  readonly labels: {
    /** The page title, for example "Roles and permissions". */
    readonly title: string;
    /** The line under the title, for example "Choose what each role can do." */
    readonly description?: string | undefined;
    /** The name of the built-in roles' matrix, for example "Built-in roles". */
    readonly builtIn: string;
    /** The name of the custom roles' matrix, for example "Custom roles". */
    readonly custom: string;
    /** The save button, for example "Save changes". */
    readonly save: string;
    /** The save button while the save runs, for example "Saving…". */
    readonly saving: string;
    /** Announced after a save succeeds, for example "Changes saved." */
    readonly saved: string;
    /** Shown when a save fails, for example "Couldn't save the changes. Try again." */
    readonly failed: string;
  };
  /** Classes on the page's wrapper. */
  readonly className?: string | undefined;
}
