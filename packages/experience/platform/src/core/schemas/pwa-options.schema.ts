/**
 * Stackra file contract:
 * Purpose: `PwaOptions`, the shape of `PwaConfig`: what the installed web app and its service worker do while they
 *          run: the manifest entries code reads (protocol handlers, share target, file handlers), the caching preset
 *          with per-route overrides, offline behaviour, Web Push, how a new worker reaches open tabs, the install
 *          prompt and periodic sync.
 * Boundary: a shape class; it registers this package's own schema (`PWA_CONFIG_SCHEMA`) for itself when the module
 *           loads, so `buildConfig(PwaConfig)` validates with no generated file. Gen copies these values into the
 *           generated `sw.ts` and each locale's manifest; the manifest's presentation keys (names, colours, icons)
 *           are stackra.config.ts `pwa`, read by the browser only. Tenant data never enters Cache Storage.
 * Runtime: isomorphic
 * Governing contract: ADR 0255; ADR 0252 (mutation queue); ADR 0294 (decisions 19 and 26); ADR 0305 (rule 34).
 */
import { Duration } from "@stackra/contracts";
import { registerSchemas, Schema } from "@stackra/validation";

import { PWA_CONFIG_SCHEMA } from "#core/constants/pwa-config-schema.constant";
import { CachePreset } from "#core/enums/cache-preset.enum";
import type { CacheStrategy } from "#core/enums/cache-strategy.enum";
import type { FileLaunchType } from "#core/enums/file-launch-type.enum";
import { InstallPrompt } from "#core/enums/install-prompt.enum";
import { PromptMoment } from "#core/enums/prompt-moment.enum";
import { UpdateStrategy } from "#core/enums/update-strategy.enum";

/**
 * The PWA settings.
 *
 * @example
 * export class PwaConfig extends BasePwaConfig {
 *   override caching: BasePwaConfig["caching"] = { ...this.caching, preset: CachePreset.Balanced };
 * }
 */
export class PwaOptions extends Schema {
  /** The manifest entries code reads; each route gets the locale prefix in the built manifest. */
  manifest: {
    /** `web+<name>` scheme to the route it opens; `%s` is the link. */
    protocolHandlers: Record<string, string>;
    /** Where another app's share sheet posts; null for none. */
    shareTarget: {
      /** The route the share posts to; the worker answers it. */
      action: string;
      /** The HTTP method of the share. */
      method: "GET" | "POST";
      /** The form encoding; files need `multipart/form-data`. */
      enctype: "application/x-www-form-urlencoded" | "multipart/form-data";
      /** The form field names of each shared part. */
      params: {
        /** The field of the shared title. */
        title?: string;
        /** The field of the shared text. */
        text?: string;
        /** The field of the shared link. */
        url?: string;
        /** The file fields and the media types each accepts. */
        files?: { name: string; accept: string[] }[];
      };
    } | null;
    /** The files the installed app opens and the route each lands on. */
    fileHandlers: {
      /** The route the files open on. */
      action: string;
      /** Media type to file extensions. */
      accept: Record<string, string[]>;
      /** All in one window, or one window per file. */
      launchType: FileLaunchType;
    }[];
  } = { protocolHandlers: {}, shareTarget: null, fileHandlers: [] };

  /** What the worker caches: the preset, per-route overrides and limits. */
  caching: {
    /** The strategy of every route at once. */
    preset: CachePreset;
    /** Path prefix to the strategy that replaces the preset's there. */
    routes: Record<string, CacheStrategy>;
    /** Precache the built shell. */
    precacheShell: boolean;
    /** Other origins whose responses may be cached; none by default. */
    runtimeCacheOrigins: string[];
    /** Most entries per runtime cache. */
    maxEntries: number;
    /** Oldest entry kept. */
    maxAge: Duration;
    /** Navigation preload. */
    navigationPreload: boolean;
    /** How long a network-first route waits before the cache answers. */
    networkTimeout: Duration;
    /** The prerendered page served when even the shell is missing; null for none. */
    offlineFallback: string | null;
  } = {
    preset: CachePreset.OnlineFirst,
    routes: {},
    precacheShell: true,
    runtimeCacheOrigins: [],
    maxEntries: 100,
    maxAge: Duration.days(30),
    navigationPreload: false,
    networkTimeout: Duration.seconds(3),
    offlineFallback: null,
  };

  /** The service worker's offline behaviour. */
  offline: {
    /** Ask for persistent storage, so the browser does not evict the outbox. */
    persistStorage: boolean;
    /** Wake the outbox drain with Background Sync where the browser has it. */
    backgroundSync: boolean;
    /** How long without connectivity before the banner shows. */
    bannerAfter: Duration;
  } = { persistStorage: false, backgroundSync: false, bannerAfter: Duration.seconds(3) };

  /** Web Push; in-app notices where the browser has none (ADR 0255 decision 3). */
  push: {
    /** Receive Web Push. */
    enabled: boolean;
    /** When the permission prompt first shows. */
    askOn: PromptMoment;
    /** Mirror the unread count on the app icon. */
    badging: boolean;
  } = { enabled: false, askOn: PromptMoment.Settings, badging: false };

  /** How a new worker reaches open tabs. */
  updates: {
    /** Prompt, or take over at once. */
    strategy: UpdateStrategy;
    /** How often to check for a new worker. */
    checkEvery: Duration;
    /** Activate the waiting worker as soon as the user accepts. */
    skipWaitingOnAccept: boolean;
    /** Reload once the new worker takes control. */
    reloadOnControllerChange: boolean;
  } = {
    strategy: UpdateStrategy.Prompt,
    checkEvery: Duration.hours(1),
    skipWaitingOnAccept: true,
    reloadOnControllerChange: true,
  };

  /** The install prompt. */
  install: {
    /** Which prompt shows. */
    prompt: InstallPrompt;
    /** Sessions before the house prompt shows. */
    afterSessions: number;
    /** Show the Add to Home Screen steps on iOS. */
    iosInstructions: boolean;
  } = { prompt: InstallPrompt.Browser, afterSessions: 0, iosInstructions: false };

  /** Periodic Background Sync; off registers no periodic listener. */
  periodicSync = false;
}

registerSchemas([[PwaOptions, PWA_CONFIG_SCHEMA]]);
