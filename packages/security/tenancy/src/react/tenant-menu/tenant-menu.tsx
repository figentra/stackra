/**
 * Stackra file contract:
 * Purpose: `TenantMenu`, the tenancy kit's web switcher: a button with the current membership's mark and name that
 *          opens a menu of every membership, the current one checked; choosing another switches to it.
 * Boundary: composition of @stackra/ui over `useTenant` and `useTenantSwitcher`. The switch is the container's
 *           `TenantSwitcher.switchTo` (an app that also tells its server wraps that service); a refused or failed
 *           switch shows the host's `failed` words. Renders nothing while no membership is active.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0208 (memberships); ADR 0327 (decision 10); ADR 0165 (UI through
 *                     @stackra/ui).
 */
import { Avatar, Dropdown, Text } from "@stackra/ui/react";
import { type ReactElement, useState } from "react";

import { useTenant } from "#react/tenant/use-tenant";
import { useTenantSwitcher } from "#react/tenant/use-tenant-switcher";
import type { TenantMenuProps } from "#react/tenant-menu/tenant-menu.props";

/**
 * The membership menu. Place it in a sidebar header or an app bar.
 *
 * @example
 * <TenantMenu onSwitched={() => navigate("/")} labels={labels} />
 */
export function TenantMenu({
  describe,
  onSwitched,
  labels,
  className,
}: TenantMenuProps): ReactElement | null {
  const current = useTenant({ optional: true });
  const { memberships, switchTo } = useTenantSwitcher();
  const [pending, setPending] = useState<string | null>(null);
  const [isFailed, setFailed] = useState(false);
  if (current === null) return null;
  const choose = async (tenantId: string) => {
    if (tenantId === current.tenantId) return onSwitched?.(tenantId);
    setPending(tenantId);
    setFailed(false);
    try {
      await switchTo(tenantId);
      onSwitched?.(tenantId);
    } catch {
      setFailed(true);
    } finally {
      setPending(null);
    }
  };
  return (
    <div className={`flex flex-col gap-1 ${className ?? ""}`}>
      <Dropdown>
        <Dropdown.Trigger
          aria-label={`${labels.trigger}: ${current.name}`}
          isDisabled={pending !== null}
          className="flex min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 text-start"
        >
          <Avatar name={current.name} shape="square" size="sm" />
          <span className="min-w-0 flex-1 truncate font-medium" dir="auto">
            {current.name}
          </span>
        </Dropdown.Trigger>
        <Dropdown.Menu
          selectionMode="single"
          selectedKeys={[current.tenantId]}
          onAction={(key) => void choose(String(key))}
        >
          {memberships.map((membership) => (
            <Dropdown.Item
              key={membership.tenantId}
              id={membership.tenantId}
              description={
                pending === membership.tenantId ? labels.switching : describe?.(membership)
              }
            >
              {membership.name}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
      {isFailed && (
        <Text role="alert" tone="danger" type="small">
          {labels.failed}
        </Text>
      )}
    </div>
  );
}
