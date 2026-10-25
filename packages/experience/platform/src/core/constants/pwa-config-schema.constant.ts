/**
 * Stackra file contract:
 * Purpose: `PWA_CONFIG_SCHEMA`, the zod schema this package ships for `PwaConfig` (exported as `PwaConfig$`): the
 *          manifest entries code reads, the service worker's caching, offline behaviour, Web Push, updates, the
 *          install prompt and periodic sync.
 * Boundary: the stand-in for what gen writes for this package. Every top-level field has a default, so `.parse({})`
 *           gives the full defaults and a host's generated `PwaConfig$` extends it with
 *           `Base$.shape.<field>.unwrap().default(...)`; a nested object is replaced whole. The defaults equal
 *           `PwaOptions`' initializers (tested). The worker scope and `/api/*` network-only are fixed rules of the
 *           generated worker (ADR 0255 decision 2), not fields.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0255.
 */
import { Duration, Enum } from "@stackra/contracts";
import { z } from "zod";

import { DURATION_SCHEMA } from "#core/constants/duration-schema.constant";
import { CachePreset } from "#core/enums/cache-preset.enum";
import { CacheStrategy } from "#core/enums/cache-strategy.enum";
import { FileLaunchType } from "#core/enums/file-launch-type.enum";
import { InstallPrompt } from "#core/enums/install-prompt.enum";
import { PromptMoment } from "#core/enums/prompt-moment.enum";
import { UpdateStrategy } from "#core/enums/update-strategy.enum";

/** A route path inside the app. */
const ROUTE = z.string().startsWith("/");

// shortcut: authored until gen compiles this package's PwaOptions into #stackra/schemas; replace with STA-339.
/** The shipped `PwaConfig$`. */
export const PWA_CONFIG_SCHEMA = z.object({
  manifest: z
    .object({
      protocolHandlers: z.record(z.string().regex(/^web\+[a-z]+$/), ROUTE),
      shareTarget: z
        .object({
          action: ROUTE,
          method: z.enum(["GET", "POST"]),
          enctype: z.enum(["application/x-www-form-urlencoded", "multipart/form-data"]),
          params: z.object({
            title: z.string().min(1).exactOptional(),
            text: z.string().min(1).exactOptional(),
            url: z.string().min(1).exactOptional(),
            files: z
              .array(z.object({ name: z.string().min(1), accept: z.array(z.string().min(1)) }))
              .exactOptional(),
          }),
        })
        .nullable(),
      fileHandlers: z.array(
        z.object({
          action: ROUTE,
          accept: z.record(z.string().min(1), z.array(z.string().startsWith("."))),
          launchType: z.enum(Enum.values(FileLaunchType)),
        }),
      ),
    })
    .default(() => ({ protocolHandlers: {}, shareTarget: null, fileHandlers: [] })),
  caching: z
    .object({
      preset: z.enum(Enum.values(CachePreset)),
      routes: z.record(ROUTE, z.enum(Enum.values(CacheStrategy))),
      precacheShell: z.boolean(),
      runtimeCacheOrigins: z.array(z.url()),
      maxEntries: z.int().positive(),
      maxAge: DURATION_SCHEMA,
      navigationPreload: z.boolean(),
      networkTimeout: DURATION_SCHEMA,
      offlineFallback: ROUTE.nullable(),
    })
    .default(() => ({
      preset: CachePreset.OnlineFirst,
      routes: {},
      precacheShell: true,
      runtimeCacheOrigins: [],
      maxEntries: 100,
      maxAge: Duration.days(30),
      navigationPreload: false,
      networkTimeout: Duration.seconds(3),
      offlineFallback: null,
    })),
  offline: z
    .object({
      persistStorage: z.boolean(),
      backgroundSync: z.boolean(),
      bannerAfter: DURATION_SCHEMA,
    })
    .default(() => ({
      persistStorage: false,
      backgroundSync: false,
      bannerAfter: Duration.seconds(3),
    })),
  push: z
    .object({
      enabled: z.boolean(),
      askOn: z.enum(Enum.values(PromptMoment)),
      badging: z.boolean(),
    })
    .default(() => ({ enabled: false, askOn: PromptMoment.Settings, badging: false })),
  updates: z
    .object({
      strategy: z.enum(Enum.values(UpdateStrategy)),
      checkEvery: DURATION_SCHEMA,
      skipWaitingOnAccept: z.boolean(),
      reloadOnControllerChange: z.boolean(),
    })
    .default(() => ({
      strategy: UpdateStrategy.Prompt,
      checkEvery: Duration.hours(1),
      skipWaitingOnAccept: true,
      reloadOnControllerChange: true,
    })),
  install: z
    .object({
      prompt: z.enum(Enum.values(InstallPrompt)),
      afterSessions: z.int().min(0),
      iosInstructions: z.boolean(),
    })
    .default(() => ({ prompt: InstallPrompt.Browser, afterSessions: 0, iosInstructions: false })),
  periodicSync: z.boolean().default(false),
});
