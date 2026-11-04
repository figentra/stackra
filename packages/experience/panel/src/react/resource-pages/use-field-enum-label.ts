/**
 * Stackra file contract:
 * Purpose: `useFieldEnumLabel(resourceKey, enumOwner)`, the label of an enum code at a form key: the resource's, else the
 *          `enumOwner`'s (the modal's action model), else the code itself.
 * Boundary: platform-free: imports `react` hooks and no UI kit; the web and native form fields label a select's codes
 *           with it. A list row's index is dropped from the key (`fieldLabelPath`).
 * Runtime: isomorphic (react)
 * Governing contract: ADR 0294 decision 22 (derived enum labels); ADR 0307.
 */
import { fieldLabelPath } from "#core/functions/field-label-path.function";
import { useEnumLabel } from "#react/resource-pages/use-enum-label";

/**
 * The code labeller of a form over `resourceKey`.
 *
 * @example
 * const label = useFieldEnumLabel("orders.order", undefined);
 * label("status", "paid"); // "Paid"
 */
export function useFieldEnumLabel(
  resourceKey: string,
  enumOwner: string | undefined,
): (key: string, code: string) => string {
  const enumLabel = useEnumLabel();
  return (key, code) =>
    enumLabel(resourceKey, fieldLabelPath(key), code) ??
    (enumOwner === undefined ? undefined : enumLabel(enumOwner, fieldLabelPath(key), code)) ??
    code;
}
