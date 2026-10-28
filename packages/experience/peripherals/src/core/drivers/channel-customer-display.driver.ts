/**
 * Stackra file contract:
 * Purpose: `ChannelCustomerDisplayDriver`, the `CustomerDisplay` driver that posts each view on a `BroadcastChannel`
 *          (`peripherals.customerDisplay: "channel"`) to the customer display window of the same app: the Electron
 *          second window `@stackra/platform` opens on the external screen, or a browser window on the second screen.
 * Boundary: delivers only; the display window renders with `listenCustomerDisplay`. It refuses with capability
 *           `window` where `BroadcastChannel` does not exist (the React Native till uses another driver). It cannot
 *           know whether a display window is open, so a show with none open is lost, as on a display that is off.
 * Runtime: isomorphic
 * Governing contract: ADR 0339 (decision 1 and open question 3: a second Electron window, a browser window); ADR 0250
 *                     (decision 3).
 */
import { Driver } from "@stackra/container";
import { PlatformCapability } from "@stackra/platform";
import type { CapabilityResult } from "@stackra/platform/contracts";

import { CustomerDisplay } from "#contracts/ports/customer-display.port";
import type { CustomerDisplayView } from "#contracts/types/customer-display-view.type";
import { CUSTOMER_DISPLAY_CHANNEL } from "#core/constants/customer-display-channel.constant";
import { refuse } from "#core/functions/refuse.function";
import type { CustomerDisplayMessage } from "#core/types/customer-display-message.type";

/**
 * The customer display over a broadcast channel.
 *
 * @example
 * // generated renderer wiring
 * { port: CustomerDisplay, selectedBy: "config:peripherals.customerDisplay", candidates: { channel: () => import("@stackra/peripherals").then((m) => m.ChannelCustomerDisplayDriver) } }
 */
export class ChannelCustomerDisplayDriver extends Driver(CustomerDisplay) {
  /** The open channel; opened on the first post. */
  private channel: BroadcastChannel | undefined = undefined;

  /** Answers where a broadcast channel exists. */
  async probe(): Promise<CapabilityResult> {
    if (typeof BroadcastChannel === "undefined")
      return refuse(PlatformCapability.Window, "unavailable");
    return { ok: true, data: undefined };
  }

  /** Posts the view. */
  async show(view: CustomerDisplayView): Promise<CapabilityResult> {
    return this.post({ type: "show", view });
  }

  /** Posts a clear. */
  async clear(): Promise<CapabilityResult> {
    return this.post({ type: "clear" });
  }

  /** Closes the channel, so a shutting-down renderer holds no handle; the next post opens it again. */
  close(): void {
    this.channel?.close();
    this.channel = undefined;
  }

  /** Posts `message`, or refuses with no channel. */
  private post(message: CustomerDisplayMessage): CapabilityResult {
    if (typeof BroadcastChannel === "undefined")
      return refuse(PlatformCapability.Window, "unavailable");
    this.channel ??= new BroadcastChannel(CUSTOMER_DISPLAY_CHANNEL);
    this.channel.postMessage(message);
    return { ok: true, data: undefined };
  }
}
