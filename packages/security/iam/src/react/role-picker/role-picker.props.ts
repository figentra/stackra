/**
 * Stackra file contract:
 * Purpose: `RolePickerProps`, what a host hands the RolePicker: the single-choice `EntityPicker` props (value, change,
 *          `loadOptions`, field state, create-new) with the picker's words gathered in `labels`.
 * Boundary: a type in its own file beside the component (ADR 0305). `loadOptions` is required: the package cannot call
 *           the service that lists roles, so the host binds it to its generated client. The words are the host's
 *           (ADR 0504 decision 4); `description` and `errorMessage` stay field props, since a form adapter sets them.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0055 (one field contract); ADR 0208 (roles); ADR 0305.
 */
import type { EntityPickerProps } from "@stackra/ui/react";

/** The single-choice EntityPicker's props. */
type SingleEntityPickerProps = Extract<EntityPickerProps, { readonly removeLabel?: undefined }>;

/**
 * The picker's field props and words.
 *
 * @example
 * <RolePicker loadOptions={(search, cursor) => client.roles.list({ search, cursor }).then(toOptions)} labels={labels} />
 */
export type RolePickerProps = Omit<
  SingleEntityPickerProps,
  | "selectionMode"
  | "removeLabel"
  | "label"
  | "placeholder"
  | "loadingLabel"
  | "emptyMessage"
  | "loadErrorMessage"
  | "createLabel"
> & {
  /** The picker's words; the host writes them. */
  readonly labels: {
    /** The field's visible label and accessible name, for example "Role". */
    readonly label: string;
    /** The spoken name of the spinner while roles load, for example "Loading roles". */
    readonly loading: string;
    /** What the list says when no role matches, for example "No roles found". */
    readonly empty: string;
    /** What the list says when the roles could not be loaded, for example "Roles could not be loaded. Type to try again." */
    readonly loadError: string;
    /** Text shown while the field is empty, for example "Choose a role". */
    readonly placeholder?: string | undefined;
    /** The create-new row's text from the typed text, for example `(text) => \`Add role "${text}"\``; needs `onCreate`. */
    readonly create?: ((text: string) => string) | undefined;
  };
};
