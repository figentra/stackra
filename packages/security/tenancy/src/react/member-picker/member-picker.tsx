/**
 * Stackra file contract:
 * Purpose: `MemberPicker`, the tenancy kit's field for choosing one member of the active tenant: an EntityPicker over
 *          the host's `loadOptions`.
 * Boundary: composition of @stackra/ui's EntityPicker; no container needed. The host maps its `TenantMembers.list`
 *           page to options (a membership id as the key, the name or its "Unnamed member" words as the label).
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0260 (client ports); ADR 0165 (UI through @stackra/ui); the UI
 *                     build list (2026-11-02).
 */
import { EntityPicker } from "@stackra/ui/react";
import type { ReactElement } from "react";

import type { MemberPickerProps } from "#react/member-picker/member-picker.props";

/**
 * The member field.
 *
 * @example
 * <MemberPicker loadOptions={searchMembers} labels={{ label: "Assignee", emptyMessage: "No member matches" }} />
 */
export function MemberPicker({ labels, ...rest }: MemberPickerProps): ReactElement {
  return (
    <EntityPicker
      {...rest}
      selectionMode="single"
      label={labels.label}
      description={labels.description}
      errorMessage={labels.errorMessage}
      placeholder={labels.placeholder}
      loadingLabel={labels.loadingLabel}
      emptyMessage={labels.emptyMessage}
      loadErrorMessage={labels.loadErrorMessage}
    />
  );
}
