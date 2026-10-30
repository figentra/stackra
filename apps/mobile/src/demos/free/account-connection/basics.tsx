/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native Account connection: a payments provider the store has not connected yet, with its terms.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { AccountConnection, Avatar, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { ACCOUNT_CONNECTION_DEMO_KEYS } from "#src/demos/free/account-connection/account-connection-demo-keys.constant";

/** The demo's keys. */
const K = ACCOUNT_CONNECTION_DEMO_KEYS.demo_free.account_connection.sample;

/** Account connection: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <AccountConnection
      title={t(K.stripe)}
      description={t(K.stripe_description)}
      logo={<Avatar name={t(K.stripe)} shape="square" tone="accent" variant="soft" />}
      isConnected={false}
      connectedLabel={t(K.connected)}
      disconnectedLabel={t(K.not_connected)}
      connectLabel={t(K.connect)}
      disconnectLabel={t(K.disconnect)}
      details={t(K.terms)}
    />
  );
}
