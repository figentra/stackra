/**
 * Stackra file contract:
 * Purpose: `OUTBOX_ROW_OWNERS_CODEMOD`, 0.27.0: the outbox tables become tenant-owned and the outbox driver ports
 *          claim, then load; the codemod reports each custom driver.
 * Boundary: data only; the rule is `portWithout`'s (a class extending the port without the named method).
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); ADR 0013 (decision 5); STA-145; changeset 8a70552.
 */
import { portWithout } from "#node/upgrade/functions/port-without.function";
import type { UpgradeCodemod } from "#node/upgrade/types/upgrade-codemod.type";

/** The outbox tables are tenant-owned and its driver ports claim, then load. */
export const OUTBOX_ROW_OWNERS_CODEMOD: UpgradeCodemod = {
  id: "outbox-row-owners",
  version: "0.27.0",
  title: "The outbox tables are tenant-owned and its driver ports claim, then load",
  note: "Drain the relay before you migrate outbox.0006: it refuses, changing nothing, while a message, delivery, change, replica change or device sequence sits below a tenant node, and names the remedy for each. A custom driver ports to the new shapes: OutboxDriver due is claim (OutboxClaim) plus load, pruneDead is claimDead plus remove; ChangeFeed read is claim plus load, and expired and remove take over the default partition's deletes; DeliveryDriver lease and list return DeliveryClaim, list takes an id and load returns the delivery. pruneOutbox takes the isolation as its last argument. The codemod lists each custom driver to port.",
  source: "8a70552",
  report: {
    modules: ["@stackra/outbox", "@stackra/outbox/contracts"],
    rule: {
      any: [
        portWithout("OutboxDriver", "claim"),
        portWithout("ChangeFeed", "claim"),
        portWithout("DeliveryDriver", "load"),
      ],
    },
    message:
      "port this outbox driver: OutboxDriver and ChangeFeed claim then load, DeliveryDriver answers DeliveryClaim and load(id) (see the 0.27.0 note)",
  },
};
