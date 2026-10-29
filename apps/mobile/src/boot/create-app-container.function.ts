/**
 * Stackra file contract:
 * Purpose: `createAppContainer()`, the app's container: the configuration and drivers the mounted Stackra packages
 *          read (i18n, theming, push, consent), the system accessibility, system settings, device permissions and app
 *          icon drivers, the app lock (off by default), the share inbox with the phone disk it keeps files on and the
 *          uploader it uploads them with, the consent ledger, and the settings store the language choice is saved to.
 * Boundary: builds instances only. The app has no generated wiring yet (its manifest says `kind: package`, so gen
 *           writes no `#stackra/wiring` or native entry for it), so each binding is an override of the empty container.
 *           When the app adopts @stackra/app (ADR 0295) and the platform and native-share manifests are regenerated
 *           with their driver tables and config rows (they do not carry the app lock, app icon or share inbox yet), gen
 *           covers the system accessibility, system settings, device permissions, app lock (with `AppLockConfig`), app
 *           icon and share inbox (with `NativeShareConfig`) drivers and the package config rows; what stays here is
 *           `MobileI18nConfig` (or a host config override), the phone disk and uploader the share inbox uses, and the
 *           memory consent ledger and settings store until the app signs people in.
 * Runtime: react-native
 * Governing contract: ADR 0263 (the container); ADR 0302 (2026-10-29 note); ADR 0298; ADR 0007 (documentation).
 */
import { ConsentConfig, ConsentLedger, MemoryConsentStoreDriver } from "@stackra/consent";
import { Container } from "@stackra/container";
import type { Token } from "@stackra/container";
import { FilesystemConfig } from "@stackra/filesystem";
import { FileSystem } from "@stackra/filesystem/contracts";
import { ExpoFileSystemDriver } from "@stackra/filesystem/native";
import { I18nConfig } from "@stackra/i18n";
import { MemoryUploaderDriver, Uploader } from "@stackra/media";
import { NativeShareConfig } from "@stackra/native-share";
import { IncomingShare } from "@stackra/native-share/contracts";
import { ExpoIncomingShareDriver } from "@stackra/native-share/native";
import { AppLockConfig, PushConfig } from "@stackra/platform";
import { AppIcon, AppLock, SystemPermissions, SystemSettings } from "@stackra/platform/contracts";
import {
  ExpoAppIconDriver,
  ExpoAppLockDriver,
  ExpoSystemPermissionsDriver,
  ExpoSystemSettingsDriver,
} from "@stackra/platform/native";
import { MemorySettingValueStoreDriver } from "@stackra/settings";
import { SettingValueStore } from "@stackra/settings/contracts";
import { ThemingConfig } from "@stackra/theming";
import { SystemAccessibility } from "@stackra/theming/contracts";
import { AccessibilityInfoSystemAccessibilityDriver } from "@stackra/theming/native";

import { MobileI18nConfig } from "./mobile-i18n.config";

/**
 * Boots the app's container.
 *
 * @example
 * const container = await createAppContainer();
 * <ContainerProvider container={container}>...</ContainerProvider>
 */
export function createAppContainer(): Promise<Container> {
  const consent = new ConsentConfig();
  return Container.create([], {
    overrides: new Map<Token, object>([
      [I18nConfig, new MobileI18nConfig()],
      [ThemingConfig, new ThemingConfig()],
      [PushConfig, new PushConfig()],
      [SystemAccessibility, new AccessibilityInfoSystemAccessibilityDriver()],
      [SystemSettings, new ExpoSystemSettingsDriver()],
      [SystemPermissions, new ExpoSystemPermissionsDriver()],
      // Off by default: an app opts in with its own `AppLockConfig` subclass (`isEnabled`, per-role overrides).
      [AppLockConfig, new AppLockConfig()],
      [AppLock, new ExpoAppLockDriver()],
      [AppIcon, new ExpoAppIconDriver()],
      [IncomingShare, new ExpoIncomingShareDriver(new NativeShareConfig())],
      // Shared files kept on the phone, under `<documents>/storage`.
      [FileSystem, new ExpoFileSystemDriver(new FilesystemConfig())],
      // shortcut: the app has no API origin or session yet; then `HttpUploaderDriver`, whose `upload.create` call
      // carries the session, so the server checks the person's `media.upload.create`.
      [Uploader, new MemoryUploaderDriver()],
      [ConsentConfig, consent],
      // shortcut: consent and settings live in memory until the app signs people in and calls the server's operations.
      [ConsentLedger, new ConsentLedger(consent, new MemoryConsentStoreDriver())],
      [SettingValueStore, new MemorySettingValueStoreDriver()],
    ]),
  });
}
