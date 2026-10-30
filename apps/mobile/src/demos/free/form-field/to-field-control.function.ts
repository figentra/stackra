/**
 * Stackra file contract:
 * Purpose: `toFieldControl`, a react-hook-form control typed as @stackra/ui's native FormField takes it.
 * Boundary: a type cast only.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract).
 */
import type { FormFieldProps } from "@stackra/ui/native";
import type { Control, FieldValues } from "react-hook-form";

/**
 * The form's control, typed as FormField takes it.
 * shortcut: the app's react-hook-form and the one @stackra/ui resolves are two installs (React 19.2 and 19.3 peers)
 * whose deep types do not match, though Metro loads one copy (metro.config.js); drop it once both share one React.
 */
export function toFieldControl<TValues extends FieldValues>(control: Control<TValues>) {
  return control as unknown as NonNullable<FormFieldProps<TValues>["control"]>;
}
