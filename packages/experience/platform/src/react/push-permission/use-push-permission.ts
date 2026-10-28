/**
 * Stackra file contract:
 * Purpose: `usePushPermission()`, the push permission for the settings switch: where it stands, a request, and a way
 *          to the OS settings; `null` on a target that binds no `PlatformPushTransport`, so the switch is not rendered.
 * Boundary: reads the permission once on mount and after each request; it never registers the device (the push
 *           context does). A permission changed in the OS settings shows after the next mount.
 * Runtime: isomorphic
 * Governing contract: ADR 0255 (decision 3); ADR 0294 (decision 17).
 */
import { useContainer } from "@stackra/container/react";
import { useCallback, useEffect, useState } from "react";

import { PlatformPushTransport } from "#contracts/ports/platform-push-transport.port";
import type { PermissionStatus } from "#contracts/types/permission-status.type";
import type { PushPermission } from "#react/push-permission/push-permission.type";

/**
 * The push permission, or `null` without push.
 *
 * @example
 * const push = usePushPermission();
 * <Switch isSelected={push.isGranted} onSelectedChange={(on) => void (on ? push.request() : push.openSettings())} />
 */
export function usePushPermission(): PushPermission | null {
  const container = useContainer();
  const transport = container.has(PlatformPushTransport) ? container.get(PlatformPushTransport) : null;
  const [status, setStatus] = useState<PermissionStatus>("prompt");

  useEffect(() => {
    if (transport === null) return;
    let live = true;
    void transport.permission().then((next) => {
      if (live) setStatus(next);
    });
    return () => {
      live = false;
    };
  }, [transport]);

  const request = useCallback(async (): Promise<PermissionStatus> => {
    if (transport === null) return "denied";
    const next = await transport.requestPermission();
    setStatus(next);
    return next;
  }, [transport]);

  if (transport === null) return null;
  return {
    status,
    isGranted: status === "granted",
    request,
    openSettings: () => transport.openSettings(),
  };
}
