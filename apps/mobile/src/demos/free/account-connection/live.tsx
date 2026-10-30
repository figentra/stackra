/**
 * Stackra file contract:
 * Purpose: the "live" demo of the native Account connection: connect and disconnect the accounting app: the button waits while the
 *          stand-in request runs, then the status fades over and connecting plays the success haptic.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { AccountConnection, Avatar, useCatalogueText } from "@stackra/ui/native";
import { useEffect, useRef, useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { ACCOUNT_CONNECTION_DEMO_KEYS } from "#src/demos/free/account-connection/account-connection-demo-keys.constant";

/** The demo's keys. */
const K = ACCOUNT_CONNECTION_DEMO_KEYS.demo_free.account_connection.sample;

/** How long the stand-in for the provider's round trip takes, in ms. */
const ROUND_TRIP_MS = 800;

/** Account connection: Try it. */
export default function Live() {
  const t = useCatalogueText(MESSAGES.en);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const toggle = (next: boolean) => {
    setIsLoading(true);
    timer.current = setTimeout(() => {
      setIsConnected(next);
      setIsLoading(false);
    }, ROUND_TRIP_MS);
  };
  return (
    <AccountConnection
      title={t(K.xero)}
      description={t(K.xero_description)}
      logo={<Avatar name={t(K.xero)} shape="square" tone="success" variant="soft" />}
      isConnected={isConnected}
      accountName={t(K.xero_account)}
      isLoading={isLoading}
      onConnect={() => toggle(true)}
      onDisconnect={() => toggle(false)}
      connectedLabel={t(K.connected)}
      disconnectedLabel={t(K.not_connected)}
      connectLabel={t(K.connect)}
      disconnectLabel={t(K.disconnect)}
    />
  );
}
