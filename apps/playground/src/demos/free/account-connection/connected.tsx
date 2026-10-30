/**
 * Stackra file contract:
 * Purpose: the "connected" demo of the web Account connection: a delivery partner already connected; the store id stays left to right in
 *          Arabic.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0060 (light, dark, RTL).
 */
import { AccountConnection, Avatar, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { ACCOUNT_CONNECTION_KEYS } from "#src/demos/free/account-connection/account-connection-keys.constant";

/** The demo's keys. */
const K = ACCOUNT_CONNECTION_KEYS.account_connection;

/** Account connection: Connected. */
export default function Connected() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <AccountConnection
      className="max-w-lg"
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
