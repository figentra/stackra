/**
 * Stackra file contract:
 * Purpose: `MemberPickerProps`, what a host hands the web MemberPicker: the single-choice EntityPicker props with
 *          `loadOptions` required, and every word in `labels`.
 * Boundary: a type in its own file beside the component (ADR 0305). The package cannot call a service, so the host
 *           binds `loadOptions`, typically to `TenantMembers.list`; the words are the host's (ADR 0504 decision 4), so
 *           the picker's own word props move into `labels`.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0260 (client ports); ADR 0305; the UI build list (2026-11-02).
 */
import type { SingleEntityPickerContractProps } from "@stackra/ui/contracts";

/**
 * The picker's options, handlers and words.
 *
 * @example
 * <MemberPicker loadOptions={searchMembers} name="assigneeId" labels={{ label: "Assignee" }} />
 */
export type MemberPickerProps = Omit<
  SingleEntityPickerContractProps,
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
  /** The picker's words; the host writes them. */
  readonly labels: {
    /** The visible label and accessible name, for example "Assignee". */
    readonly label: string;
    /** Help text under the field. */
    readonly description?: string | undefined;
    /** Shown under the field while `isInvalid` is true. */
    readonly errorMessage?: string | undefined;
    /** Shown while the field is empty, for example "Choose a member". */
    readonly placeholder?: string | undefined;
    /** The spinner's spoken name, for example "Loading members". */
    readonly loadingLabel?: string | undefined;
    /** What the list says when nothing matches, for example "No member matches". */
    readonly emptyMessage?: string | undefined;
    /** What the list says when a load fails, for example "Members could not be loaded." */
    readonly loadErrorMessage?: string | undefined;
  };
};
