/**
 * Stackra file contract:
 * Purpose: `ShowSecondScreenBridge` (`platform.screen.second`), the renderer's way to open the customer display window
 *          on the second display at a route of the app, or close it.
 * Boundary: main process only. The input comes from the renderer, so the route is checked (a path of at most 256
 *           characters, never another origin) before the port is touched; the answer is the port's result.
 * Runtime: node
 * Governing contract: ADR 0251 (decisions 1 to 3); ADR 0339 (open question 3); registry A13.
 */
import type { SecondScreen } from "#contracts/ports/second-screen.port";
import type { CapabilityResult } from "#contracts/types/capability-result.type";
import { Capability } from "#core/enums/capability.enum";
import { Bridge } from "#desktop/bases/bridge.base";
import type { ShowSecondScreenInput } from "#desktop/types/show-second-screen-input.type";

/** A path of the app: one leading slash, no scheme, no host, at most 256 characters. */
const ROUTE = /^\/(?!\/)[^\s\\]{0,255}$/;

/**
 * Opens or closes the second-display window.
 *
 * @example
 * // renderer, through the generated preload
 * await window.stackra.invoke("platform.screen.second", { route: "/customer-display" });
 */
export class ShowSecondScreenBridge extends Bridge({
  key: "screen.second",
  capability: Capability.Window,
}) {
  /** The bound second screen. */
  private readonly screen: SecondScreen;

  /**
   * @param screen - the bound second screen (`ElectronSecondScreenDriver`).
   */
  constructor(screen: SecondScreen) {
    super();
    this.screen = screen;
  }

  /**
   * Opens `route` on the second display, or closes the window for `null`.
   *
   * @throws TypeError when `route` is neither null nor a path of the app.
   */
  async handle(input: ShowSecondScreenInput): Promise<CapabilityResult> {
    const { route } = (input ?? {}) as Partial<ShowSecondScreenInput>;
    if (route === null) return this.screen.close();
    if (typeof route !== "string" || !ROUTE.test(route))
      throw new TypeError(
        "screen.second needs a route of the app, such as /customer-display, or null",
      );
    return this.screen.open(route);
  }
}
