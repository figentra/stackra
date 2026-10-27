/**
 * Stackra file contract:
 * Purpose: `ExpoPlatformDriver`, the `Platform` driver of the Expo (phone) target: online state from NetInfo, local
 *          notifications and the app icon badge from expo-notifications, the share sheet from React Native's `Share`,
 *          haptics from expo-haptics and the barcode scanner from expo-camera.
 * Boundary: device only; built once per app, it listens to NetInfo for the app's life. `has` answers false for what a
 *           phone lacks (`file_handling`, `share_target`, `install_prompt`, and the desktop and device capabilities),
 *           and those facets refuse with `unavailable` or stay empty. Permissions and camera availability are read
 *           once at construction and again after each request, so the synchronous `permission` and `isAvailable`
 *           start at `prompt` and `false` until the first read lands. Showing a notification while the app is in the
 *           foreground needs the app's own `setNotificationHandler`. The constructor takes nothing, because the
 *           container builds it.
 * Runtime: react-native
 * Governing contract: ADR 0250 (decisions 2 and 3); ADR 0255 (decision 3); ADR 0281 (decision 2: the capability
 *                     matrix); ADR 0294 (decision 17: dependencies by type).
 */
import { addEventListener } from "@react-native-community/netinfo";
import { Driver } from "@stackra/container";
import { signal } from "@stackra/state/react";
import { Camera, CameraView } from "expo-camera";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { Platform as Os, Share } from "react-native";

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
import { ExpoScannerView } from "#native/components/expo-scanner-view";
import { expoPermission } from "#native/functions/expo-permission.function";
import { readPushPermission } from "#native/functions/read-push-permission.function";

/** The successful result of a call that returns nothing. */
const DONE: CapabilityResult = Object.freeze({ ok: true, data: undefined });

/** What a phone offers; a code outside this set answers false. */
const OFFERED: ReadonlySet<string> = new Set([
  Capability.Network,
  Capability.LocalNotifications,
  Capability.Push,
  Capability.Badge,
  Capability.Share,
  Capability.Haptics,
  Capability.Scanner,
  Capability.Camera,
]);

/** The expo-haptics style of each strength. */
const IMPACT = {
  light: Haptics.ImpactFeedbackStyle.Light,
  medium: Haptics.ImpactFeedbackStyle.Medium,
  heavy: Haptics.ImpactFeedbackStyle.Heavy,
} as const;

/**
 * The platform on a phone.
 *
 * @example
 * // generated wiring, expo target
 * { port: Platform, candidates: { expo: () => import("@stackra/platform/native").then((m) => m.ExpoPlatformDriver) } }
 */
export class ExpoPlatformDriver extends Driver(Platform) {
  /** Online state from NetInfo. */
  readonly network: NetworkCapability;

  /** Local notifications through expo-notifications. */
  readonly notifications: NotificationsCapability;

  /** The rear camera through expo-camera. */
  readonly scanner: ScannerCapability;

  /** Not offered on a phone: always empty. */
  readonly fileHandling: FileHandlingCapability;

  /** Not offered on a phone: `take` finds nothing. */
  readonly shareTarget: ShareTargetCapability;

  /** The app icon badge through expo-notifications. */
  readonly badge: BadgeCapability;

  /** React Native's share sheet. */
  readonly share: ShareCapability;

  /** Touch feedback through expo-haptics. */
  readonly haptics: HapticsCapability;

  /** Not offered on a phone: `prompt` refuses. */
  readonly install: InstallCapability;

  /** Starts listening to NetInfo and reads the permissions once. */
  constructor() {
    super();
    const isOnline = signal(true);
    let notifications: PermissionStatus = "prompt";
    let camera: PermissionStatus = "prompt";
    let hasCamera = false;

    // An unknown reachability (null) counts as online, so a slow probe never blocks the app.
    addEventListener((state) =>
      isOnline.set(state.isConnected !== false && state.isInternetReachable !== false),
    );
    void readPushPermission()
      .then((status) => {
        notifications = status;
      })
      .catch(() => undefined); // an unreadable permission keeps `prompt`
    void Camera.getCameraPermissionsAsync()
      .then((response) => {
        camera = expoPermission(response);
      })
      .catch(() => undefined);
    void CameraView.isAvailableAsync()
      .then((available) => {
        hasCamera = available;
      })
      .catch(() => undefined); // an unanswered probe keeps "no camera"

    this.network = { isOnline };

    this.notifications = {
      get permission() {
        return notifications;
      },
      requestPermission: async () => {
        await Notifications.requestPermissionsAsync({
          ios: { allowAlert: true, allowBadge: true, allowSound: true },
        });
        notifications = await readPushPermission();
        return notifications === "granted"
          ? DONE
          : refuse(Capability.LocalNotifications, "permission_denied");
      },
      notify: async (title, options = {}) => {
        if ((await readPushPermission()) !== "granted")
          return refuse(Capability.LocalNotifications, "permission_denied");
        await Notifications.scheduleNotificationAsync({
          ...(options.tag === undefined ? {} : { identifier: options.tag }),
          content: { title, ...(options.body === undefined ? {} : { body: options.body }) },
          trigger: null,
        });
        return DONE;
      },
    };

    this.scanner = {
      View: ExpoScannerView,
      get isAvailable() {
        return hasCamera;
      },
      get permission() {
        return camera;
      },
      requestPermission: async () => {
        camera = expoPermission(await Camera.requestCameraPermissionsAsync());
        return camera;
      },
    };

    this.fileHandling = { launched: signal<readonly File[]>([]) };

    this.shareTarget = { take: async () => null };

    this.badge = {
      set: async (count) =>
        (await Notifications.setBadgeCountAsync(count))
          ? DONE
          : refuse(Capability.Badge, "unavailable"),
      clear: async () =>
        (await Notifications.setBadgeCountAsync(0))
          ? DONE
          : refuse(Capability.Badge, "unavailable"),
    };

    this.share = {
      share: async ({ title, text, url, files }) => {
        if (files !== undefined && files.length > 0) return refuse(Capability.Share, "unavailable");
        // iOS takes the link as its own field; Android has only the message.
        const content =
          Os.OS === "ios"
            ? { title, message: text ?? "", url }
            : { title, message: [text, url].filter(Boolean).join("\n") };
        const result = await Share.share(content);
        return { ok: true, data: result.action === Share.sharedAction };
      },
    };

    this.haptics = {
      impact: async (strength = "medium") => {
        await Haptics.impactAsync(IMPACT[strength]);
        return DONE;
      },
    };

    this.install = {
      canPrompt: signal(false),
      prompt: async () => refuse(Capability.InstallPrompt, "unavailable"),
    };
  }

  /** Whether a phone offers `capability`. */
  has(capability: string): boolean {
    return OFFERED.has(capability);
  }
}
