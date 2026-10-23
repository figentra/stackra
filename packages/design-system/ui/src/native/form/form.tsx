/**
 * Stackra file contract:
 * Purpose: the native `Form`, the adapted form of the web one: HeroUI Native has no form component and a screen has no
 *          submit event, so it is a plain `View` that groups the fields and the button; the user submits by pressing
 *          that button, whose handler is the caller's.
 * Boundary: built on the free `View` only; every `View` prop passes through. The web's `isSubmitOnModEnter` and
 *          `validationErrors` have no native counterpart here: a field takes its error from its own `isInvalid` and
 *          `errorMessage`.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3, adapted forms); ADR 0165 (HeroUI Native on native); ADR 0055 (forms);
 *          ADR 0303.
 */
import type { ReactElement } from "react";
import { View, type ViewProps } from "react-native";

import type { FormContractProps } from "#contracts/types/form-contract-props.type";

/** Props of the native Form: the shared contract plus the props of a `View`, passed through unchanged. */
export type FormProps = FormContractProps & Omit<ViewProps, keyof FormContractProps>;

/** The group that holds a screen's fields and its submit button. */
export function Form(props: FormProps): ReactElement {
  return <View {...props} />;
}
