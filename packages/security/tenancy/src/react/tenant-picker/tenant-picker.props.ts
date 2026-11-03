/**
 * Stackra file contract:
 * Purpose: `TenantPickerProps`, what a host hands the web TenantPicker: the single-choice EntityPicker props (value,
 *          change, form name, states, create-new row) with `loadOptions` optional, the line under each membership, and
 *          every word in `labels`.
 * Boundary: a type in its own file beside the component (ADR 0305). Left out, `loadOptions` answers from the
 *           container's `TenantSwitcher` memberships, filtered on the client; the words are the host's (ADR 0504
 *           decision 4), so the picker's own word props move into `labels`.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0208 (memberships); ADR 0305; the UI build list (2026-11-02,
 *                     TenantPicker: `loadOptions` optional).
 */
import type { SingleEntityPickerContractProps } from "@stackra/ui/contracts";

import type { TenantMembership } from "#core/types/tenant-membership.type";

/**
 * The picker's options, handlers and words.
 *
 * @example
 * <TenantPicker name="tenantId" onChange={setTenant} labels={{ label: "Organisation" }} />
 */
export type TenantPickerProps = Omit<
  SingleEntityPickerContractProps,
  | "loadOptions"
  | "selectionMode"
  | "removeLabel"
  | "label"
  | "description"
  | "errorMessage"
  | "placeholder"
  | "loadingLabel"
  | "emptyMessage"
  | "loadErrorMessage"
> & {
  /**
   * Answers a search with a page of records. Left out, the picker lists the signed-in person's memberships from the
   * container's `TenantSwitcher`, each keyed by its tenant id, and filters them by name as the user types.
   */
  readonly loadOptions?: SingleEntityPickerContractProps["loadOptions"] | undefined;
  /** The muted line under a membership when `loadOptions` is left out, such as its role's name; none by default. */
  readonly describe?: ((membership: TenantMembership) => string) | undefined;
  /** The picker's words; the host writes them. */
  readonly labels: {
    /** The visible label and accessible name, for example "Organisation". */
    readonly label: string;
    /** Help text under the field. */
    readonly description?: string | undefined;
    /** Shown under the field while `isInvalid` is true. */
    readonly errorMessage?: string | undefined;
    /** Shown while the field is empty, for example "Choose an organisation". */
    readonly placeholder?: string | undefined;
    /** The spinner's spoken name, for example "Loading organisations". */
    readonly loadingLabel?: string | undefined;
    /** What the list says when nothing matches, for example "No organisation matches". */
    readonly emptyMessage?: string | undefined;
    /** What the list says when a load fails, for example "Organisations could not be loaded." */
    readonly loadErrorMessage?: string | undefined;
  };
};
