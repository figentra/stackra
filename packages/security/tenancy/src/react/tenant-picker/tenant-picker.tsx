/**
 * Stackra file contract:
 * Purpose: `TenantPicker`, the tenancy kit's field for choosing one organisation: an EntityPicker over the signed-in
 *          person's memberships by default, or over the host's own `loadOptions` (a platform operator's search of
 *          every tenant, say).
 * Boundary: composition of @stackra/ui's EntityPicker over `useTenantSwitcher`, so it needs a `ContainerProvider` whose
 *           container binds `TenantSwitcher` even when `loadOptions` is given. The default answer is one page of the
 *           memberships whose name holds the typed text, case-insensitively; a record's key is its tenant id. Choosing
 *           only reports the record: switching tenants is `TenantMenu`'s.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0208 (memberships); ADR 0165 (UI through @stackra/ui); the UI
 *                     build list (2026-11-02).
 */
import type { EntityOptionPage } from "@stackra/ui/contracts";
import { EntityPicker } from "@stackra/ui/react";
import type { ReactElement } from "react";

import { useTenantSwitcher } from "#react/tenant/use-tenant-switcher";
import type { TenantPickerProps } from "#react/tenant-picker/tenant-picker.props";

/**
 * The organisation field.
 *
 * @example
 * <TenantPicker name="tenantId" labels={{ label: "Organisation", emptyMessage: "No organisation matches" }} />
 */
export function TenantPicker({
  loadOptions,
  describe,
  labels,
  ...rest
}: TenantPickerProps): ReactElement {
  const { memberships } = useTenantSwitcher();
  const fromMemberships = (search: string): Promise<EntityOptionPage> => {
    const needle = search.trim().toLocaleLowerCase();
    return Promise.resolve({
      items: memberships
        .filter((membership) => membership.name.toLocaleLowerCase().includes(needle))
        .map((membership) => ({
          id: membership.tenantId,
          label: membership.name,
          description: describe?.(membership),
          avatar: { name: membership.name },
        })),
      nextCursor: null,
    });
  };
  return (
    <EntityPicker
      {...rest}
      selectionMode="single"
      loadOptions={loadOptions ?? fromMemberships}
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
