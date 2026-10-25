/**
 * Stackra file contract:
 * Purpose: `PUSH_CONFIG_SCHEMA`, the zod schema this package ships for `PushConfig` (exported as `PushConfig$`): the
 *          transport, registration retries, the foreground rule, the Android channels, when the prompt first shows,
 *          iOS provisional authorization and the Web Push public key.
 * Boundary: the stand-in for what gen writes for this package. Every field has a default, so `.parse({})` gives the
 *           full defaults and a host's generated `PushConfig$` extends it with `Base$.shape.<field>.unwrap()
 *           .default(...)`. The defaults equal `PushOptions`' initializers (tested). The VAPID key is public.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0255 (decision 3).
 */
import { Enum } from "@stackra/contracts";
import { z } from "zod";

import { PUSH_TRANSPORTS } from "#core/constants/push-transports.constant";
import { NotificationImportance } from "#core/enums/notification-importance.enum";
import { PromptMoment } from "#core/enums/prompt-moment.enum";

/** A channel id: snake_case. */
const CHANNEL_ID = /^[a-z][a-z0-9_]*$/;

// shortcut: authored until gen compiles this package's PushOptions into #stackra/schemas; replace with STA-339.
/** The shipped `PushConfig$`. */
export const PUSH_CONFIG_SCHEMA = z.object({
  provider: z.enum(PUSH_TRANSPORTS).default("memory"),
  retries: z.int().min(0).max(10).default(3),
  foregroundBanner: z.boolean().default(true),
  foregroundSound: z.boolean().default(true),
  foregroundBadge: z.boolean().default(true),
  androidChannels: z
    .array(
      z.object({
        id: z.string().regex(CHANNEL_ID),
        nameKey: z.string().min(1),
        importance: z.enum(Enum.values(NotificationImportance)),
        vibrate: z.boolean(),
        sound: z.string().min(1).nullable(),
      }),
    )
    .default(() => []),
  askOn: z.enum(Enum.values(PromptMoment)).default(PromptMoment.Settings),
  iosProvisional: z.boolean().default(false),
  vapidPublicKey: z.string().default(""),
});
