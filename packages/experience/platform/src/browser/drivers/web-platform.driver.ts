/**
 * Stackra file contract:
 * Purpose: `WebPlatformDriver`, the `Platform` driver of the web and PWA targets, the baseline every other target
 *          builds on (ADR 0250): online state from the browser, the Notifications, Badging, Web Share, Vibration and
 *          Shape Detection APIs, the PWA launch queue, the install prompt and the service worker's share inbox.
 * Boundary: browser only; built once per page, it listens to `online`, `offline`, `beforeinstallprompt` and
 *           `appinstalled` for the page's life. `has` detects each API when asked, so a capability the browser lacks
 *           answers false and its calls refuse with `unavailable`. Safe to construct during a server render (it reads
 *           nothing there and offers only `network`). The constructor takes nothing, because the container builds it.
 * Runtime: browser
 * Governing contract: ADR 0250 (decisions 2 and 3); ADR 0255 (PWA: launch queue, share target, Web Push); ADR 0281
 *                     (decision 2: the capability matrix).
 */
import { Driver } from "@stackra/container";
import { signal } from "@stackra/state/react";

import { Platform } from "#contracts/ports/platform.port";
import type { BadgeCapability } from "#contracts/types/badge-capability.type";
import type { CapabilityResult } from "#contracts/types/capability-result.type";
import type { FileHandlingCapability } from "#contracts/types/file-handling-capability.type";
import type { HapticsCapability } from "#contracts/types/haptics-capability.type";
import type { InstallCapability } from "#contracts/types/install-capability.type";
import type { NetworkCapability } from "#contracts/types/network-capability.type";
import type { NotificationsCapability } from "#contracts/types/notifications-capability.type";
import type { PermissionStatus } from "#contracts/types/permission-status.type";
import type { ScannerCapability } from "#contracts/types/scanner-capability.type";
import type { ShareCapability } from "#contracts/types/share-capability.type";
import type { ShareTargetCapability } from "#contracts/types/share-target-capability.type";
import { Capability } from "#core/enums/capability.enum";
import { refuse } from "#core/functions/refuse.function";
import { takeSharedPayload } from "#core/functions/take-shared-payload.function";
import { WebScannerView } from "#browser/components/web-scanner-view";
import { browserPermission } from "#browser/functions/browser-permission.function";

/** The successful result of a call that returns nothing. */
const DONE: CapabilityResult = Object.freeze({ ok: true, data: undefined });

/** The browser APIs this driver reaches that the DOM lib does not type yet. */
interface BrowserExtras {
  setAppBadge?(count?: number): Promise<void>;
  clearAppBadge?(): Promise<void>;
}

/** The deferred `beforeinstallprompt` event. */
interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ readonly outcome: "accepted" | "dismissed" }>;
}

/** One file handle of a launch. */
interface LaunchParams {
  readonly files: readonly { getFile(): Promise<File> }[];
}

/** Vibration length per strength, in milliseconds. */
const VIBRATION = { light: 10, medium: 20, heavy: 40 } as const;

/** How each capability is detected; a code with no row is not offered. */
const DETECT: Readonly<Record<string, () => boolean>> = {
  [Capability.Network]: () => true,
  [Capability.LocalNotifications]: () => "Notification" in globalThis,
  [Capability.Push]: () => "PushManager" in globalThis && "serviceWorker" in navigator,
  [Capability.Badge]: () => "setAppBadge" in navigator,
  [Capability.Clipboard]: () => "clipboard" in navigator,
  [Capability.FilesSave]: () => "showSaveFilePicker" in globalThis,
  [Capability.Print]: () => typeof globalThis.print === "function",
  [Capability.Updates]: () => "serviceWorker" in navigator,
  [Capability.FileHandling]: () => "launchQueue" in globalThis,
  [Capability.ShareTarget]: () => "serviceWorker" in navigator && "indexedDB" in globalThis,
  [Capability.Share]: () => "share" in navigator,
  [Capability.Haptics]: () => "vibrate" in navigator,
  [Capability.InstallPrompt]: () => "onbeforeinstallprompt" in globalThis,
  [Capability.Scanner]: () => "BarcodeDetector" in globalThis && "mediaDevices" in navigator,
  [Capability.Camera]: () => "mediaDevices" in navigator,
  [Capability.Microphone]: () => "mediaDevices" in navigator,
  [Capability.Usb]: () => "usb" in navigator,
  [Capability.Bluetooth]: () => "bluetooth" in navigator,
  [Capability.Serial]: () => "serial" in navigator,
};

/**
 * The platform in a browser.
 *
 * @example
 * // generated wiring, web and pwa targets
 * { port: Platform, candidates: { web: () => import("@stackra/platform/browser").then((m) => m.WebPlatformDriver) } }
 */
export class WebPlatformDriver extends Driver(Platform) {
  /** Online state from the browser's `online` and `offline` events. */
  readonly network: NetworkCapability;

  /** The Notifications API. */
  readonly notifications: NotificationsCapability;

  /** The rear camera through the Shape Detection API. */
  readonly scanner: ScannerCapability;

  /** The PWA launch queue. */
  readonly fileHandling: FileHandlingCapability;

  /** The service worker's share inbox. */
  readonly shareTarget: ShareTargetCapability;

  /** The Badging API. */
  readonly badge: BadgeCapability;

  /** The Web Share API. */
  readonly share: ShareCapability;

  /** The Vibration API. */
  readonly haptics: HapticsCapability;

  /** The deferred install prompt. */
  readonly install: InstallCapability;

  /** Starts listening to the browser; reads nothing outside a browser. */
  constructor() {
    super();
    const inBrowser = typeof window !== "undefined";
    const isOnline = signal(inBrowser ? navigator.onLine : true);
    const launched = signal<readonly File[]>([]);
    const canPrompt = signal(false);
    let deferred: InstallPromptEvent | undefined;
    let camera: PermissionStatus = "prompt";

    if (inBrowser) {
      window.addEventListener("online", () => isOnline.set(true));
      window.addEventListener("offline", () => isOnline.set(false));
      window.addEventListener("beforeinstallprompt", (event) => {
        event.preventDefault(); // the app shows the prompt from its own button
        deferred = event as InstallPromptEvent;
        canPrompt.set(true);
      });
      window.addEventListener("appinstalled", () => {
        deferred = undefined;
        canPrompt.set(false);
      });
      const queue = (
        globalThis as {
          launchQueue?: { setConsumer(consumer: (params: LaunchParams) => void): void };
        }
      ).launchQueue;
      queue?.setConsumer((params) => {
        void Promise.all(params.files.map((handle) => handle.getFile())).then((files) =>
          launched.set(files),
        );
      });
      void navigator.permissions
        ?.query({ name: "camera" as PermissionName })
        .then((status) => {
          camera = status.state;
        })
        .catch(() => undefined); // a browser that cannot query the camera keeps `prompt`
    }

    this.network = { isOnline };

    this.notifications = {
      get permission() {
        return browserPermission();
      },
      requestPermission: async () => {
        if (!this.has(Capability.LocalNotifications))
          return refuse(Capability.LocalNotifications, "unavailable");
        const status = browserPermission(await Notification.requestPermission());
        return status === "granted"
          ? DONE
          : refuse(Capability.LocalNotifications, "permission_denied");
      },
      notify: async (title, options = {}) => {
        if (!this.has(Capability.LocalNotifications))
          return refuse(Capability.LocalNotifications, "unavailable");
        if (browserPermission() !== "granted")
          return refuse(Capability.LocalNotifications, "permission_denied");
        // Chrome on Android shows notifications only through the service worker.
        const registration = await navigator.serviceWorker?.getRegistration();
        if (registration === undefined) void new Notification(title, options);
        else await registration.showNotification(title, options);
        return DONE;
      },
    };

    const hasScanner = (): boolean => this.has(Capability.Scanner);
    this.scanner = {
      View: WebScannerView,
      get isAvailable() {
        return hasScanner();
      },
      get permission() {
        return camera;
      },
      requestPermission: async () => {
        if (!hasScanner()) return "denied";
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          for (const track of stream.getTracks()) track.stop();
          camera = "granted";
        } catch {
          camera = "denied";
        }
        return camera;
      },
    };

    this.fileHandling = { launched };

    this.shareTarget = {
      take: (id) =>
        this.has(Capability.ShareTarget) ? takeSharedPayload(id) : Promise.resolve(null),
    };

    const badging = (inBrowser ? navigator : {}) as BrowserExtras;
    this.badge = {
      set: async (count) => {
        if (badging.setAppBadge === undefined) return refuse(Capability.Badge, "unavailable");
        await (count === 0 ? badging.clearAppBadge?.() : badging.setAppBadge(count));
        return DONE;
      },
      clear: async () => {
        if (badging.clearAppBadge === undefined) return refuse(Capability.Badge, "unavailable");
        await badging.clearAppBadge();
        return DONE;
      },
    };

    this.share = {
      share: async ({ files, ...rest }) => {
        if (!this.has(Capability.Share)) return refuse(Capability.Share, "unavailable");
        const data: globalThis.ShareData =
          files === undefined ? rest : { ...rest, files: [...files] };
        if (files !== undefined && navigator.canShare?.(data) === false)
          return refuse(Capability.Share, "unavailable");
        try {
          await navigator.share(data);
          return { ok: true, data: true };
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError")
            return { ok: true, data: false };
          if (error instanceof DOMException && error.name === "NotAllowedError")
            return refuse(Capability.Share, "permission_denied");
          throw error;
        }
      },
    };

    this.haptics = {
      impact: async (strength = "medium") =>
        this.has(Capability.Haptics) && navigator.vibrate(VIBRATION[strength])
          ? DONE
          : refuse(Capability.Haptics, "unavailable"),
    };

    this.install = {
      canPrompt,
      prompt: async () => {
        const event = deferred;
        if (event === undefined) return refuse(Capability.InstallPrompt, "unavailable");
        deferred = undefined;
        canPrompt.set(false);
        await event.prompt();
        return { ok: true, data: (await event.userChoice).outcome === "accepted" };
      },
    };
  }

  /** Whether this browser has the API behind `capability`; always for `network`. */
  has(capability: string): boolean {
    if (typeof window === "undefined") return capability === Capability.Network;
    return DETECT[capability]?.() ?? false;
  }
}
