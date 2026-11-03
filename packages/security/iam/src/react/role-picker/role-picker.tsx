/**
 * Stackra file contract:
 * Purpose: `RolePicker`, the IAM kit's role field: a single-choice `EntityPicker` over the roles `loadOptions`
 *          answers, named and worded by the host's `labels`.
 * Boundary: composition of @stackra/ui's `EntityPicker` only; it holds no roles and calls no service. Every other
 *           field prop passes through unchanged, so a form adapter binds it like any picker.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0055 (one field contract); ADR 0208 (roles); ADR 0165 (UI through
 *                     @stackra/ui).
 */
import { EntityPicker } from "@stackra/ui/react";
import type { ReactElement } from "react";

import type { RolePickerProps } from "#react/role-picker/role-picker.props";

/**
 * The role field.
 *
 * @example
 * <RolePicker name="role" loadOptions={loadRoles} value={role} onChange={setRole} labels={labels} />
 */
export function RolePicker({ labels, ...field }: RolePickerProps): ReactElement {
  return (
    <EntityPicker
      {...field}
      selectionMode="single"
      label={labels.label}
      loadingLabel={labels.loading}
      emptyMessage={labels.empty}
      loadErrorMessage={labels.loadError}
      placeholder={labels.placeholder}
      createLabel={labels.create}
    />
  );
}
