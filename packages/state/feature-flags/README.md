# @stackra/feature-flags

Stackra feature flags: the `Flag` kind, the typed flag references gen writes into `#stackra/flags`, the
`FlagProvider` port with its `config` and `posthog` drivers, the `FlagReader` that serves values, the
`FeatureFlagsConfig` configuration with its shipped schema, the `useFlag` hook and the `fakeFlags` test helper.

**Tier:** `tier:lib` (`packages/state/feature-flags`). Entries `.`, `./contracts`, `./lint`, `./react` and `./testing`.
Depends on `@stackra/contracts`, `@stackra/container`, `@stackra/validation`, `@stackra/config` and zod; React is an
optional peer for `./react`.

A flag is a release switch or an experiment arm. It is never a commercial right: that is an entitlement (ADR 0213
decision 7).

## What is here

| Entry         | Symbol                                                  | Use                                                                                          |
| ------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `.`           | `Flag`                                                  | the kind base: `class XFlag extends Flag({ default, expires, removalIssue, scopes })`        |
| `.`           | `flagRefs`                                              | builds `Flags.<module>.<name>` refs; gen calls it in `#stackra/flags`                        |
| `.`           | `FeatureFlagsConfig`, `FeatureFlagsConfig$`             | key `feature_flags`: `provider`, `values`, `targeting`, `refreshEvery`, PostHog key and host |
| `.`           | `FeatureFlagsOptions`                                   | the shape of the configuration, for restating a field type in an override                    |
| `.`           | `FlagTargeting`                                         | which id flags are split by: `visitor`, `user` (default) or `tenant`                         |
| `.`           | `FlagReader`                                            | the service that loads, holds and serves values                                              |
| `.`           | `ConfigFlagProviderDriver`, `PosthogFlagProviderDriver` | the two drivers of `FlagProvider`                                                            |
| `.`           | `MemoryFlagProviderDriver`                              | `memory`: the values a test sets (STA-1308)                                                  |
| `./contracts` | `FlagProvider`, `FlagContext`                           | the port and the ids it evaluates for                                                        |
| `./lint`      | `FEATURE_FLAGS_LINT_PLUGIN` (default)                   | the `feature-flags` oxlint plugin: `no-plan-targeting`                                       |
| `./react`     | `useFlag`                                               | one flag's current value in a component                                                      |
| `./testing`   | `fakeFlags`                                             | a `FlagsFake` reader whose values a test sets                                                |

## Declaring a flag

One `<name>.flag.ts` per flag, in a module's `access/` group or an app's `flags/` group:

```ts
import { Flag } from "@stackra/feature-flags";

/** Off by default, so a visitor without consent always sees the monthly-first control. */
export class PricingYearlyFirstFlag extends Flag({
  default: false,
  expires: "2027-03-31",
}) {}
```

The key (`web.pricing_yearly_first`) and the label key (`web::flags.pricing_yearly_first.label`) come from the class
name and the module; the owner is the module's CODEOWNERS entry. `expires` is a real `YYYY-MM-DD` day and `scopes`
default to platform and tenant; both are checked when the class is declared.

## Reading a flag

```ts
const yearlyFirst = useFlag(Flags.web.pricing_yearly_first);
```

`useFlag` reads the `FlagReader` of the nearest container. The reader returns the provider's last value for the flag,
or the flag's declared default. The host's flags context calls `reader.watch({ visitor, user, scope })`, which loads
now and every `refreshEvery`. The reader sends the id that `targeting` names as the subject and the tenant as the
group. A failed load keeps the last values. A `null` subject (no consent, nobody signed in) is anonymous: PostHog is
not asked, so every flag stays at its default.

## Providers

- `config`: answers from `FeatureFlagsConfig.values` (build time and runway). For dev, on-prem and air-gapped installs.
- `posthog`: `POST <posthogHost>/flags/?v=2` with the public project key. PostHog keys cannot hold a dot, so the
  flag `web.help_centre` is named `web-help_centre` in PostHog.

## Overriding

```ts
// apps/web/src/config/feature-flags.config.ts
import type { DriverName } from "@stackra/container";
import {
  FeatureFlagsConfig as BaseFeatureFlagsConfig,
  FlagTargeting,
} from "@stackra/feature-flags";
import type { FlagProvider } from "@stackra/feature-flags/contracts";

export class FeatureFlagsConfig extends BaseFeatureFlagsConfig {
  override provider: DriverName<FlagProvider> = "config";
  override values: Record<string, boolean> = {};
  override targeting: FlagTargeting = FlagTargeting.Visitor;
}
```

A key in `values` must be a flag key (`<module>.<name>`), so a typo fails at boot. The PostHog key is public and comes
from the host's env configuration (`featureFlagsPosthogKey`).

## Lint: no plan targeting

A flag is never a commercial right (ADR 0213 decision 7): a paid feature is an entitlement. The `feature-flags` oxlint
plugin refuses a flag named after a plan, tier, edition, entitlement or subscription (`ProPlanFlag`) and a `Flag({...})`
option keyed by one (`plans: [...]`). In this repo the rule is on in the oxlint base preset, which loads the plugin
from its source file, so lint needs no build (ADR 0421). Another repo loads the built entry:

```jsonc
{
  "jsPlugins": ["@stackra/feature-flags/lint"],
  "rules": { "feature-flags/no-plan-targeting": "error" },
}
```

## Testing

```ts
const flags = fakeFlags((fake) => fake.set(Flags.web.help_centre, true));
render(<SiteHeader siteName="Acme" />, { flags });
```

The fake is a real `FlagReader`. Bind it in place of `FlagReader`, through the render helper's `flags` option or
`createTestingModule(...).override(FlagReader, flags)`.
