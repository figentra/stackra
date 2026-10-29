/**
 * Stackra file contract:
 * Purpose: `StripeTerminalCardTerminalDriver`, the `CardTerminal` driver of a Stripe Bluetooth reader (Stripe Reader
 *          M2, BBPOS WisePad 3) on an Expo app (`peripherals.cardTerminal: "stripe_terminal"`): it pairs the reader by
 *          its serial number at the Stripe location the server names, and reports ready, busy or offline.
 * Boundary: pairs and reports only; the payment is the payments driver's (ADR 0339 decision 1), through the native
 *           `StripeTerminalBridge` over the same module. Reads the `StackraCardTerminal` Expo module when it runs and
 *           imports no native package. It asks through @stackra/platform's `SystemPermissions` for Bluetooth, then
 *           location, before discovery, and never asks on its own; a permission denied or blocked there, or refused
 *           to the SDK, resolves `permission_denied` on `bluetooth`; no module, another provider, a LAN address, a
 *           location the server will not name, no reader of that serial, or an SDK error resolves `unavailable` on
 *           `card_terminal`. Certification pending (STA-739).
 * Runtime: isomorphic
 * Governing contract: ADR 0479 (decisions 2 and 4); ADR 0478 (decision 5); ADR 0339 (decision 1); ADR 0253
 *                     (decision 4).
 */
import { Driver } from "@stackra/container";
import { CardTerminal, TerminalState } from "@stackra/peripherals/contracts";
import type { PairedTerminal, TerminalPairing } from "@stackra/peripherals/contracts";
import { PlatformCapability } from "@stackra/platform";
import type { CapabilityResult, SystemPermissions } from "@stackra/platform/contracts";

import type { StripeTerminalServer } from "#contracts/ports/stripe-terminal-server.port";
import { STRIPE_TERMINAL } from "#native/constants/stripe-terminal.constant";
import { cardTerminalModule } from "#native/functions/card-terminal-module.function";
import { prepareCardTerminal } from "#native/functions/prepare-card-terminal.function";
import { refuse } from "#native/functions/refuse.function";
import { sdkName } from "#native/functions/sdk-name.function";
import { sdkRefusal } from "#native/functions/sdk-refusal.function";

/**
 * A Stripe Bluetooth reader paired to this device.
 *
 * @example
 * // generated native wiring, an Expo app listing @stackra/native-card-terminal
 * { port: CardTerminal, selectedBy: "config:peripherals.cardTerminal", candidates: { stripe_terminal: () => import("@stackra/native-card-terminal/native").then((m) => m.StripeTerminalCardTerminalDriver) } }
 * await terminal.pair({ terminalId: "STRM26138003393", provider: "stripe", address: null });
 */
export class StripeTerminalCardTerminalDriver extends Driver(CardTerminal) {
  /** The server that mints connection tokens and names the location. */
  private readonly server: StripeTerminalServer;

  /** The app's permission helper, asked before Bluetooth and location are used. */
  private readonly permissions: SystemPermissions;

  /** The paired reader; null when none is paired. */
  private paired: TerminalPairing | null = null;

  /**
   * @param server - the host's binding over its Stripe Terminal server actions.
   * @param permissions - the app's `SystemPermissions`, asked for Bluetooth and location before discovery.
   */
  constructor(server: StripeTerminalServer, permissions: SystemPermissions) {
    super();
    this.server = server;
    this.permissions = permissions;
  }

  /** Discovers the reader of `pairing.terminalId` over Bluetooth and connects it, replacing any reader paired before. */
  async pair(pairing: TerminalPairing): Promise<CapabilityResult<PairedTerminal>> {
    if (pairing.provider !== STRIPE_TERMINAL.provider || pairing.address !== null)
      return refuse(PlatformCapability.CardTerminal, "unavailable");
    const module = await prepareCardTerminal(this.server);
    if (module === undefined) return refuse(PlatformCapability.CardTerminal, "unavailable");
    for (const permission of STRIPE_TERMINAL.readerPermissions)
      if ((await this.permissions.request(permission).catch(() => "denied" as const)) !== "granted")
        return refuse(PlatformCapability.Bluetooth, "permission_denied");
    let locationId: string;
    try {
      locationId = await this.server.locationId();
    } catch {
      return refuse(PlatformCapability.CardTerminal, "unavailable");
    }
    await this.unpair();
    const found = await module.discoverBluetoothReaders(
      STRIPE_TERMINAL.discoveryTimeoutMs,
      pairing.terminalId,
    );
    if (found.error !== undefined) return sdkRefusal(found.error);
    if (!(found.readers ?? []).some((reader) => reader.serialNumber === pairing.terminalId))
      return refuse(PlatformCapability.CardTerminal, "unavailable");
    const connected = await module.connectBluetoothReader(pairing.terminalId, locationId);
    if (connected.error !== undefined) return sdkRefusal(connected.error);
    this.paired = pairing;
    return this.status();
  }

  /** Busy while the reader takes a payment, ready while it is connected, offline once it is not. */
  async status(): Promise<CapabilityResult<PairedTerminal>> {
    if (this.paired === null) return refuse(PlatformCapability.CardTerminal, "unavailable");
    const { terminalId, provider } = this.paired;
    const module = cardTerminalModule();
    const reader = module === undefined ? null : await module.connectedReader();
    let state: TerminalState = TerminalState.Offline;
    if (module !== undefined && reader?.serialNumber === terminalId) {
      const payment = sdkName(await module.paymentStatus());
      state = (STRIPE_TERMINAL.busyStatuses as readonly string[]).includes(payment)
        ? TerminalState.Busy
        : TerminalState.Ready;
    }
    return { ok: true, data: { terminalId, provider, state } };
  }

  /** Disconnects the paired reader and forgets it; succeeds when none is paired. */
  async unpair(): Promise<CapabilityResult> {
    if (this.paired !== null) {
      // A reader that already dropped answers with an error; it is forgotten either way.
      await cardTerminalModule()?.disconnectReader();
      this.paired = null;
    }
    return { ok: true, data: undefined };
  }
}
