/**
 * Stackra file contract:
 * Purpose: unit tests of `bootApp`: each configuration class is built and bound under its base (a host override
 *          answers for both), the wiring is bound as `AppWiring`, the bound `ErrorReporter` is picked over the console
 *          fallback, given overrides win over the built configuration, an invalid configuration fails boot, and the
 *          roots option boots only the given modules.
 * Boundary: test only; boots real containers over small wirings.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0295 (decisions 7 and 8); ADR 0294 (decision 19).
 */
import { buildConfig, ConfigInvalidError } from "@stackra/config";
import { Driver, Module, Service } from "@stackra/container";
import { ErrorReporter } from "@stackra/errors/contracts";
import { I18nConfig, Locale } from "@stackra/i18n";
import { describe, expect, it } from "@stackra/testing";

import { ConsoleErrorReporterDriver } from "#core/drivers/console-error-reporter.driver";
import { bootApp } from "#core/functions/boot-app.function";
import { AppWiring } from "#core/services/app-wiring.service";

class SiteI18nConfig extends I18nConfig {
  override locales: Locale[] = [Locale.En, Locale.Ar];
}

/** A config that breaks the shipped rule: the default is not a shipped locale. */
class BrokenI18nConfig extends I18nConfig {
  override defaultLocale: Locale = Locale.Ar;
}

class MemoryErrorReporterDriver extends Driver(ErrorReporter) {
  readonly errors: unknown[] = [];

  report(error: unknown): void {
    this.errors.push(error);
  }
}

class GreetingService extends Service {
  greet(): string {
    return "hello";
  }
}

class GreetingModule extends Module({ exports: [GreetingService] }) {}

describe("bootApp", () => {
  it("builds each configuration and binds it under its base and its override", async () => {
    const { container } = await bootApp({
      member: "web",
      config: [{ key: "i18n", provide: I18nConfig, override: SiteI18nConfig }],
    });
    expect(container.get(I18nConfig)).toBeInstanceOf(SiteI18nConfig);
    expect(container.get(I18nConfig).locales).toEqual([Locale.En, Locale.Ar]);
    expect(container.get(SiteI18nConfig)).toBe(container.get(I18nConfig));
  });

  it("binds the wiring as AppWiring", async () => {
    const wiring = { member: "web", contexts: ["i18n"] };
    const booted = await bootApp(wiring);
    expect(booted.container.get(AppWiring).wiring).toBe(wiring);
    expect(booted.wiring).toBe(wiring);
  });

  it("falls back to the console reporter when no ErrorReporter is bound", async () => {
    const { reporter } = await bootApp({ member: "web" });
    expect(reporter).toBeInstanceOf(ConsoleErrorReporterDriver);
  });

  it("picks the bound ErrorReporter", async () => {
    const { reporter } = await bootApp({
      member: "web",
      drivers: [
        {
          port: ErrorReporter,
          candidates: { memory: () => Promise.resolve(MemoryErrorReporterDriver) },
        },
      ],
    });
    expect(reporter).toBeInstanceOf(MemoryErrorReporterDriver);
  });

  it("keeps a given override in place of the built configuration", async () => {
    const config = buildConfig(SiteI18nConfig);
    const { container } = await bootApp(
      { member: "web", config: [{ key: "i18n", provide: I18nConfig, override: SiteI18nConfig }] },
      { overrides: new Map([[I18nConfig, config]]) },
    );
    expect(container.get(I18nConfig)).toBe(config);
  });

  it("fails boot when a configuration breaks its rule", async () => {
    await expect(
      bootApp({
        member: "web",
        config: [{ key: "i18n", provide: I18nConfig, override: BrokenI18nConfig }],
      }),
    ).rejects.toBeInstanceOf(ConfigInvalidError);
  });

  it("boots the given root modules", async () => {
    const { container } = await bootApp(
      {
        member: "greetings",
        root: GreetingModule,
        modules: { greetings: { exports: [GreetingService], dependsOn: [], type: GreetingModule } },
        bindings: [{ module: "greetings", kind: "service", provide: GreetingService }],
      },
      { roots: [GreetingModule] },
    );
    expect(container.get(GreetingService).greet()).toBe("hello");
  });
});
