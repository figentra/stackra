/**
 * Stackra file contract:
 * Purpose: `FormProps`, the props of the web `Form` in `form.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0165 (HeroUI v3
 *          on web); ADR 0055 (forms); ADR 0303; WCAG 2.2 SC 2.1.1.
 */
import type { FormRootProps } from "@heroui/react";
import type { KeyboardEventHandler } from "react";
import type { FieldValues } from "react-hook-form";
import type { FormContractProps } from "#contracts/types/form-contract-props.type";
import type { SchemaFormHandle } from "#form/types/schema-form-handle.type";
import type { TamoFieldHint } from "#contracts/types/tamo-field-hint.type";

/**
 * Props of the web Form: the shared contract, `isSubmitOnModEnter`, the schema form `T` with its `submit`, and HeroUI
 * v3's own form props, passed through.
 */
export type FormProps<T extends FieldValues = FieldValues> = FormContractProps & {
  /**
   * True to submit on Cmd or Ctrl plus Enter, and to stop Enter alone submitting from a text box (a long form is too
   * easy to send by accident). Defaults to false, the browser's own behaviour.
   */
  readonly isSubmitOnModEnter?: boolean | undefined;
  /**
   * The binding that submits the form while focus is inside it, registered with the shortcut registry so the cheat
   * sheet lists it and a person can remap it (ADR 0508). Defaults to `mod+enter` when `isSubmitOnModEnter`, else none;
   * `false` registers none.
   */
  readonly submitShortcut?: string | false | undefined;
  /** Called on each key press in the form, before the form's own handling; calling `preventDefault` skips that. */
  readonly onKeyDown?: KeyboardEventHandler<HTMLFormElement> | undefined;
  /** The schema form from `useSchemaForm`, provided to the `Field.*` parts inside. */
  readonly form?: SchemaFormHandle<T> | undefined;
  /** Where a valid submit posts its values, such as a route's `useSubmit()`; needs `form`. */
  readonly submit?: ((values: Readonly<Record<string, unknown>>) => Promise<void>) | undefined;
  /**
   * False to leave out Tamo's "Fill from text" (offered with `form`, the AI module installed and Tamo on for the
   * screen, ADR 0507).
   */
  readonly ai?: boolean | undefined;
  /** The fields Tamo may fill from text; left out, the form's plain text inputs and areas. */
  readonly aiFields?: readonly TamoFieldHint[] | undefined;
} & Omit<
    FormRootProps,
    keyof FormContractProps | "isSubmitOnModEnter" | "submitShortcut" | "onKeyDown"
  >;
