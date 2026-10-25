/**
 * Stackra file contract:
 * Purpose: the native `Form`, the adapted form of the web one: HeroUI Native has no form component and a screen has no
 *          submit event, so it is a plain `View` that groups the fields and the button; the user submits by pressing
 *          that button, whose handler is the caller's. Given a schema form (`form={useSchemaForm(...)}`), it provides
 *          that form to the `Field.*` parts inside it.
 * Boundary: built on the free `View` only; every `View` prop passes through. The web's `isSubmitOnModEnter` and
 *          `validationErrors` have no native counterpart here: a field takes its error from its own `isInvalid` and
 *          `errorMessage`, or from the schema form.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3, adapted forms); ADR 0165 (HeroUI Native on native); ADR 0055 (forms);
 *          ADR 0303.
 */
import type { ReactElement } from "react";
import { View, type ViewProps } from "react-native";
import { type FieldValues, FormProvider, type UseFormReturn } from "react-hook-form";

import type { FormContractProps } from "#contracts/types/form-contract-props.type";
import type { SchemaFormHandle } from "#form/types/schema-form-handle.type";

/** Props of the native Form: the shared contract, the schema form `T` and the props of a `View`, passed through. */
export type FormProps<T extends FieldValues = FieldValues> = FormContractProps & {
  /** The schema form from `useSchemaForm`, provided to the `Field.*` parts inside. */
  readonly form?: SchemaFormHandle<T> | undefined;
} & Omit<ViewProps, keyof FormContractProps>;

/** The group that holds a screen's fields and its submit button. */
export function Form<T extends FieldValues = FieldValues>({
  form,
  ...rest
}: FormProps<T>): ReactElement {
  if (form === undefined) return <View {...rest} />;
  return (
    // The handle is react-hook-form's form with two members widened; the provider passes `control` and the rest on.
    <FormProvider {...(form as unknown as UseFormReturn<FieldValues>)}>
      <View {...rest} />
    </FormProvider>
  );
}
