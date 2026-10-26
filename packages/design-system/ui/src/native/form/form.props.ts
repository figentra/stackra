/**
 * Stackra file contract:
 * Purpose: `FormProps`, the props of the native `Form` in `form.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3, adapted forms); ADR
 *          0165 (HeroUI Native on native); ADR 0055 (forms); ADR 0303.
 */
import type { ViewProps } from "react-native";
import type { FieldValues } from "react-hook-form";
import type { FormContractProps } from "#contracts/types/form-contract-props.type";
import type { SchemaFormHandle } from "#form/types/schema-form-handle.type";

/** Props of the native Form: the shared contract, the schema form `T` and the props of a `View`, passed through. */
export type FormProps<T extends FieldValues = FieldValues> = FormContractProps & {
  /** The schema form from `useSchemaForm`, provided to the `Field.*` parts inside. */
  readonly form?: SchemaFormHandle<T> | undefined;
} & Omit<ViewProps, keyof FormContractProps>;
