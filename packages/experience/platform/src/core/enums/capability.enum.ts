/**
 * Stackra file contract:
 * Purpose: `Capability`, the codes of what a target can offer (ADR 0250, the matrix of ADR 0281 decision 2): the
 *          argument of `platform.has(...)`, the entries of the client manifest's capability section gen writes, and,
 *          with `Required` and `Optional`, the levels a route's `capability: { scanner: Capability.Required }` map
 *          declares.
 * Boundary: an `Enum.of` value plus the type of the same name. `Required` and `Optional` are requirement levels, not
 *           capabilities: `platform.has` answers false for them. A new capability is a new case and, when code calls
 *           it, a new facet on the `Platform` port.
 * Runtime: isomorphic
 * Governing contract: ADR 0250 (decisions 2 to 4); ADR 0281 (decision 2); ADR 0294 (decision 16: the Enum row); ADR
 *                     0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/** What a target offers, and how strongly a route needs it. */
export const Capability = Enum.of({
  /** Online state. */
  Network: "network",
  /** Local notifications while the app runs. */
  LocalNotifications: "local_notifications",
  /** Remote push. */
  Push: "push",
  /** The app icon badge. */
  Badge: "badge",
  /** The clipboard. */
  Clipboard: "clipboard",
  /** Saving files to a place the user picks. */
  FilesSave: "files_save",
  /** Printing. */
  Print: "print",
  /** In-app updates of the shell (desktop auto-update, the service worker, OTA). */
  Updates: "updates",
  /** Extra windows and overlays. */
  Window: "window",
  /** A tray or menu-bar icon. */
  Tray: "tray",
  /** Files opened with the app. */
  FileHandling: "file_handling",
  /** Receiving shares from other apps. */
  ShareTarget: "share_target",
  /** The system share sheet. */
  Share: "share",
  /** Touch feedback. */
  Haptics: "haptics",
  /** The install prompt. */
  InstallPrompt: "install_prompt",
  /** The barcode scanner. */
  Scanner: "scanner",
  /** The camera. */
  Camera: "camera",
  /** The microphone. */
  Microphone: "microphone",
  /** USB devices. */
  Usb: "usb",
  /** Bluetooth devices. */
  Bluetooth: "bluetooth",
  /** Serial ports. */
  Serial: "serial",
  /** Requirement level: a target without the capability fails gen. */
  Required: "required",
  /** Requirement level: the feature degrades on a target without the capability. */
  Optional: "optional",
});

/** One of the codes above. */
export type Capability = Enum.Value<typeof Capability>;
