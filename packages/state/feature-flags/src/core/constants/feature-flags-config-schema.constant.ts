/**
 * Stackra file contract:
 * Purpose: `FEATURE_FLAGS_CONFIG_SCHEMA`, the zod schema this package ships for `FeatureFlagsConfig` (exported as
 *          `FeatureFlagsConfig$`): the provider driver, the build-time values, the targeting, the refresh interval and
 *          the PostHog project key and host.
 * Boundary: the stand-in for what gen writes for this package. Every field has a default, so `.parse({})` gives the
 *           full defaults and a host's generated `FeatureFlagsConfig$` extends it. The defaults equal
 *           `FeatureFlagsOptions`' initializers (tested). A value key must be a flag key (`web.help_centre`), so a typo
 *           fails at boot instead of silently leaving the flag at its default. The PostHog key is a public project
 *           key, not a secret. No object-level refinement, so gen's `.extend(...)` stays possible.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0213 (decision 3).
 */
import { Duration, Enum } from "@stackra/contracts";
import { z } from "zod";

import { FlagTargeting } from "#core/enums/flag-targeting.enum";

/** A flag key: `<module>.<name>`, both snake_case. */
const FLAG_KEY = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/;

/** The shortest refresh interval accepted: one second, so a mistake cannot hammer the provider. */
const MIN_REFRESH_MS = 1000;

/** Whether `value` is a `Duration` of at least a second. */
const isRefreshInterval = (value: unknown): value is Duration =>
  typeof value === "string" && Duration.toMilliseconds(value as Duration) >= MIN_REFRESH_MS;

// shortcut: authored until gen compiles this package's FeatureFlagsOptions into #stackra/schemas; replace with STA-339.
/** The shipped `FeatureFlagsConfig$`. */
export const FEATURE_FLAGS_CONFIG_SCHEMA = z.object({
  provider: z.enum(["config", "posthog"]).default("config"),
  values: z.record(z.string().regex(FLAG_KEY), z.boolean()).default(() => ({})),
  targeting: z.enum(Enum.values(FlagTargeting)).default(FlagTargeting.User),
  refreshEvery: z
    .custom<Duration>(isRefreshInterval, { message: "refreshEvery is a Duration of at least 1s" })
    .default(Duration.minutes(5)),
  posthogKey: z.string().nullable().default(null),
  posthogHost: z.string().min(1).default("https://eu.i.posthog.com"),
});
