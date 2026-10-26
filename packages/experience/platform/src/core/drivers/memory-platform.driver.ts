/**
 * Stackra file contract:
 * Purpose: `MemoryPlatformDriver`, the `Platform` driver that keeps every capability in memory: the `memory` candidate
 *          gen lists for every target, the driver a server render and the testing module bind, and the body of
 *          `fakePlatform()`. It offers only `network` (online) until `configure` says otherwise.
 * Boundary: no device is touched. Each facet behaves as a real driver does (a capability not offered refuses with
 *           `unavailable`, a denied permission with `permission_denied`) and records what was asked of it (`sent`,
 *           `shared`, `impacts`) so a test can assert on it; `scanner.emit` feeds the mounted scanner view. The
 *           constructor takes nothing, because the container builds it.
 * Runtime: isomorphic
 * Governing contract: ADR 0250 (decisions 2 and 3); ADR 0266 (memory drivers first); ADR 0269 (fakes are real
 *                     drivers).
 */
import { Driver } from "@stackra/container";

import { Platform } from "#contracts/ports/platform.port";
import type { BadgeCapability } from "#contracts/types/badge-capability.type";
import type { CapabilityResult } from "#contracts/types/capability-result.type";
import type { HapticsCapability } from "#contracts/types/haptics-capability.type";
import type { InstallCapability } from "#contracts/types/install-capability.type";
import type { NotificationsCapability } from "#contracts/types/notifications-capability.type";
import type { PermissionStatus } from "#contracts/types/permission-status.type";
import type { ScannerCapability } from "#contracts/types/scanner-capability.type";
import type { ScannerViewProps } from "#contracts/types/scanner-view-props.type";
import type { ShareCapability } from "#contracts/types/share-capability.type";
import type { ShareData } from "#contracts/types/share-data.type";
import type { SharedPayload } from "#contracts/types/shared-payload.type";
import type { ShareTargetCapability } from "#contracts/types/share-target-capability.type";
import { Capability } from "#core/enums/capability.enum";
import { liveValue } from "#core/functions/live-value.function";
import { refuse } from "#core/functions/refuse.function";
import type { LiveValue } from "#core/types/live-value.type";
import type { MemoryPlatformOptions } from "#core/types/memory-platform-options.type";

/** The successful result of a call that returns nothing. */
const DONE: CapabilityResult = Object.freeze({ ok: true, data: undefined });

/**
 * The platform in memory.
 *
 * @example
 * const platform = new MemoryPlatformDriver().configure({ network: { isOnline: false } });
 * platform.network.isOnline.set(true);
 */
export class MemoryPlatformDriver extends Driver(Platform) {
  /** Online state; a test flips it with `network.isOnline.set(false)`. */
  readonly network: { readonly isOnline: LiveValue<boolean> };

  /** Local notifications; `sent` lists every notification shown. */
  readonly notifications: NotificationsCapability & {
    readonly sent: readonly {
      readonly title: string;
      readonly body?: string;
      readonly tag?: string;
    }[];
  };

  /** The scanner; `emit(code)` decodes a code in the view rendered last. */
  readonly scanner: ScannerCapability & { emit(code: string): void };

  /** Files opened with the app; a test sets them with `fileHandling.launched.set([...])`. */
  readonly fileHandling: { readonly launched: LiveValue<readonly File[]> };

  /** The share inbox. */
  readonly shareTarget: ShareTargetCapability;

  /** The app icon badge; `count` holds the number shown (0 when cleared). */
  readonly badge: BadgeCapability & { readonly count: LiveValue<number> };

  /** The share sheet; `shared` lists every share. */
  readonly share: ShareCapability & { readonly shared: readonly ShareData[] };

  /** Touch feedback; `impacts` lists each strength asked for. */
  readonly haptics: HapticsCapability & { readonly impacts: readonly string[] };

  /** The install prompt; a test holds one with `install.canPrompt.set(true)`. */
  readonly install: InstallCapability & { readonly canPrompt: LiveValue<boolean> };

  /** The capability codes offered. */
  private readonly offered = new Set<string>([Capability.Network]);

  /** The permission each capability answers with; `prompt` when absent. */
  private readonly permissions = new Map<string, PermissionStatus>();

  /** Payloads waiting in the share inbox, by id. */
  private readonly inbox = new Map<string, SharedPayload>();

  /** Whether the device has a camera now. */
  private cameraPresent = true;

  /** The barcode handler of the scanner view rendered last. */
  private barcodeHandler: ((code: string) => void) | undefined = undefined;

  /** Online, nothing else offered, every permission still to be asked. */
  constructor() {
    super();
    const permissionOf = (capability: string): PermissionStatus =>
      this.permissions.get(capability) ?? "prompt";
    const sent: { title: string; body?: string; tag?: string }[] = [];
    const shared: ShareData[] = [];
    const impacts: string[] = [];

    this.network = { isOnline: liveValue(true) };

    this.notifications = {
      sent,
      get permission() {
        return permissionOf(Capability.LocalNotifications);
      },
      requestPermission: async () => {
        if (!this.has(Capability.LocalNotifications))
          return refuse(Capability.LocalNotifications, "unavailable");
        if (permissionOf(Capability.LocalNotifications) === "denied")
          return refuse(Capability.LocalNotifications, "permission_denied");
        this.permissions.set(Capability.LocalNotifications, "granted");
        return DONE;
      },
      notify: async (title, options = {}) => {
        if (!this.has(Capability.LocalNotifications))
          return refuse(Capability.LocalNotifications, "unavailable");
        if (permissionOf(Capability.LocalNotifications) !== "granted")
          return refuse(Capability.LocalNotifications, "permission_denied");
        sent.push({ title, ...options });
        return DONE;
      },
    };

    const handOver = (handler: (code: string) => void): void => {
      this.barcodeHandler = handler;
    };
    /** Renders nothing; remembers the handler `emit` feeds. */
    function MemoryScannerView(props: ScannerViewProps): null {
      handOver(props.onBarcode);
      return null;
    }
    const isCameraPresent = (): boolean => this.has(Capability.Scanner) && this.cameraPresent;
    this.scanner = {
      View: MemoryScannerView,
      get isAvailable() {
        return isCameraPresent();
      },
      get permission() {
        return permissionOf(Capability.Scanner);
      },
      requestPermission: async () => {
        const next: PermissionStatus =
          isCameraPresent() && permissionOf(Capability.Scanner) !== "denied" ? "granted" : "denied";
        this.permissions.set(Capability.Scanner, next);
        return next;
      },
      emit: (code) => {
        if (this.barcodeHandler === undefined)
          throw new Error("scanner.emit() needs a mounted ScannerView");
        this.barcodeHandler(code);
      },
    };

    this.fileHandling = { launched: liveValue<readonly File[]>([]) };

    this.shareTarget = {
      take: async (id) => {
        const payload = this.inbox.get(id) ?? null;
        this.inbox.delete(id);
        return payload;
      },
    };

    const count = liveValue(0);
    this.badge = {
      count,
      set: async (value) => {
        if (!this.has(Capability.Badge)) return refuse(Capability.Badge, "unavailable");
        count.set(value);
        return DONE;
      },
      clear: async () => {
        if (!this.has(Capability.Badge)) return refuse(Capability.Badge, "unavailable");
        count.set(0);
        return DONE;
      },
    };

    this.share = {
      shared,
      share: async (data) => {
        if (!this.has(Capability.Share)) return refuse(Capability.Share, "unavailable");
        shared.push(data);
        return { ok: true, data: true };
      },
    };

    this.haptics = {
      impacts,
      impact: async (strength = "medium") => {
        if (!this.has(Capability.Haptics)) return refuse(Capability.Haptics, "unavailable");
        impacts.push(strength);
        return DONE;
      },
    };

    const canPrompt = liveValue(false);
    this.install = {
      canPrompt,
      prompt: async () => {
        if (!this.has(Capability.InstallPrompt) || !canPrompt.get())
          return refuse(Capability.InstallPrompt, "unavailable");
        canPrompt.set(false);
        return { ok: true, data: true };
      },
    };
  }

  /** Whether `capability` is offered; never for the requirement levels `required` and `optional`. */
  has(capability: string): boolean {
    return this.offered.has(capability);
  }

  /**
   * Applies `options` and returns this platform, for chaining.
   *
   * @example
   * fakePlatform({ capabilities: [Capability.LocalNotifications], permissions: { local_notifications: "denied" } });
   */
  configure(options: MemoryPlatformOptions): this {
    if (options.capabilities !== undefined) {
      this.offered.clear();
      for (const capability of options.capabilities) this.offered.add(capability);
    }
    for (const [capability, status] of Object.entries(options.permissions ?? {}))
      if (status !== undefined) this.permissions.set(capability, status);
    if (options.network !== undefined) {
      this.offered.add(Capability.Network);
      this.network.isOnline.set(options.network.isOnline ?? true);
    }
    if (options.scanner !== undefined) {
      this.offered.add(Capability.Scanner);
      this.cameraPresent = options.scanner.isAvailable ?? true;
      if (options.scanner.permission !== undefined)
        this.permissions.set(Capability.Scanner, options.scanner.permission);
    }
    if (options.launchedFiles !== undefined) {
      this.offered.add(Capability.FileHandling);
      this.fileHandling.launched.set(options.launchedFiles);
    }
    if (options.shared !== undefined) {
      this.offered.add(Capability.ShareTarget);
      for (const [id, payload] of Object.entries(options.shared)) this.inbox.set(id, payload);
    }
    if (options.canInstall !== undefined) {
      this.offered.add(Capability.InstallPrompt);
      this.install.canPrompt.set(options.canInstall);
    }
    return this;
  }
}
