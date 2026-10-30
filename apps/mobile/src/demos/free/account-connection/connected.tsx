/**
 * Stackra file contract:
 * Purpose: the "connected" demo of the native Account connection: a delivery partner already connected, with the store's account id.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { AccountConnection, Avatar, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { ACCOUNT_CONNECTION_DEMO_KEYS } from "#src/demos/free/account-connection/account-connection-demo-keys.constant";

/** The demo's keys. */
const K = ACCOUNT_CONNECTION_DEMO_KEYS.demo_free.account_connection.sample;

/** Account connection: Connected. */
export default function Connected() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <AccountConnection
      title={t(K.talabat)}
      description={t(K.talabat_description)}
      logo={<Avatar name={t(K.talabat)} shape="square" tone="warning" variant="soft" />}
      isConnected
      accountName={t(K.talabat_account)}
      connectedLabel={t(K.connected)}
      disconnectedLabel={t(K.not_connected)}
      connectLabel={t(K.connect)}
      disconnectLabel={t(K.disconnect)}
    />
  );
}
