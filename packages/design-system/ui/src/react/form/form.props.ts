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
  /** Called on each key press in the form, before the form's own handling; calling `preventDefault` skips that. */
  readonly onKeyDown?: KeyboardEventHandler<HTMLFormElement> | undefined;
  /** The schema form from `useSchemaForm`, provided to the `Field.*` parts inside. */
  readonly form?: SchemaFormHandle<T> | undefined;
  /** Where a valid submit posts its values, such as a route's `useSubmit()`; needs `form`. */
  readonly submit?: ((values: Readonly<Record<string, unknown>>) => Promise<void>) | undefined;
} & Omit<FormRootProps, keyof FormContractProps | "isSubmitOnModEnter" | "onKeyDown">;
