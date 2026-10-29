/**
 * Stackra file contract:
 * Purpose: `createAppContainer()`, the app's container: the configuration and drivers the mounted Stackra packages
 *          read (i18n, theming, push, consent), the system accessibility, system settings and device permissions
 *          drivers, the app lock (off by default), the consent ledger, and the settings store the language choice is
 *          saved to.
 * Boundary: builds instances only. The app has no generated wiring yet, so each binding is an override of the empty
 *           container; gen's `#stackra/wiring` replaces this file when the app adopts @stackra/app (ADR 0295).
 * Runtime: react-native
 * Governing contract: ADR 0263 (the container); ADR 0302 (2026-10-29 note); ADR 0298; ADR 0007 (documentation).
 */
import { ConsentConfig, ConsentLedger, MemoryConsentStoreDriver } from "@stackra/consent";
import { Container } from "@stackra/container";
import type { Token } from "@stackra/container";
import { I18nConfig } from "@stackra/i18n";
import { AppLockConfig, PushConfig } from "@stackra/platform";
import { AppLock, DevicePermissions, SystemSettings } from "@stackra/platform/contracts";
import {
  ExpoAppLockDriver,
  ExpoDevicePermissionsDriver,
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
      [DevicePermissions, new ExpoDevicePermissionsDriver()],
      // Off by default: an app opts in with its own `AppLockConfig` subclass (`isEnabled`, per-role overrides).
      [AppLockConfig, new AppLockConfig()],
      [AppLock, new ExpoAppLockDriver()],
      [ConsentConfig, consent],
      // shortcut: consent and settings live in memory until the app signs people in and calls the server's operations.
      [ConsentLedger, new ConsentLedger(consent, new MemoryConsentStoreDriver())],
      [SettingValueStore, new MemorySettingValueStoreDriver()],
    ]),
  });
}
