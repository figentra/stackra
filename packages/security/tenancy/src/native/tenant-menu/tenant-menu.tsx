/**
 * Stackra file contract:
 * Purpose: `TenantMenu`, the tenancy kit's native switcher: a list of every membership with its mark and name, the
 *          current one selected; pressing another switches to it. An app shows it in its own sheet route.
 * Boundary: composition of @stackra/ui/native over `useTenant` and `useTenantSwitcher` (isomorphic hooks of the react
 *           entry). The switch is the container's `TenantSwitcher.switchTo`; a failed one goes to `onError`. Pressing
 *           the current row reports `onSwitched` without switching. Renders nothing while no membership is active.
 * Runtime: react-native
 * Governing contract: ADR 0504 (module UI kits); ADR 0208 (memberships); ADR 0327 (decision 10); ADR 0302 (decision
 *                     3: native UI from @stackra/ui).
 */
import { Avatar, List, Spinner } from "@stackra/ui/native";
import { type ReactElement, useState } from "react";

import type { TenantMenuProps } from "#native/tenant-menu/tenant-menu.props";
import { useTenant } from "#react/tenant/use-tenant";
import { useTenantSwitcher } from "#react/tenant/use-tenant-switcher";

/**
 * The membership list.
 *
 * @example
 * <TenantMenu onSwitched={() => router.dismiss()} onError={toastError} labels={labels} />
 */
export function TenantMenu({
  describe,
  onSwitched,
  onError,
  labels,
}: TenantMenuProps): ReactElement | null {
  const current = useTenant({ optional: true });
  const { memberships, switchTo } = useTenantSwitcher();
  const [pending, setPending] = useState<string | null>(null);
  if (current === null) return null;
  const choose = async (tenantId: string) => {
    if (tenantId === current.tenantId) return onSwitched?.(tenantId);
    setPending(tenantId);
    try {
      await switchTo(tenantId);
      onSwitched?.(tenantId);
    } catch {
      onError?.(labels.failed);
    } finally {
      setPending(null);
    }
  };
  return (
    <List
      label={labels.label}
      scrollEnabled={false}
      selectionMode="single"
      selectedKeys={[current.tenantId]}
      // Pressing the selected row of a single selection clears it: that is the current membership chosen again.
      onSelectionChange={(keys) => void choose(keys[0] ?? current.tenantId)}
      items={memberships.map((membership) => ({
        id: membership.tenantId,
        title: membership.name,
        description: pending === membership.tenantId ? labels.switching : describe?.(membership),
        startIcon: <Avatar name={membership.name} shape="square" />,
        endContent: pending === membership.tenantId ? <Spinner size="sm" /> : undefined,
        isDisabled: pending !== null,
      }))}
    />
  );
}
