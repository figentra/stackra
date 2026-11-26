/**
 * Stackra file contract:
 * Purpose: unit tests of `bootApp`: each configuration class is built and bound under its base (a host override
 *          answers for both), the wiring is bound as `AppWiring`, the bound `ErrorReporter` is picked over the console
 *          fallback, the environment answers the SecretStore port, given overrides win over the built configuration, an invalid configuration fails boot, a
 *          deployed environment refuses the memory action stores (STA-2798), runway's values of the running environment
 *          win over the defaults (ADR 0296), and the roots option boots only the given modules.
 * Boundary: test only; boots real containers over small wirings.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0295 (decisions 7 and 8); ADR 0294 (decision 19); ADR 0266 (decision 2);
 *                     ADR 0296 (decision 1); STA-2798.
 */
import { StoresConfig } from "@stackra/actions";
import { buildConfig, ConfigInvalidError } from "@stackra/config";
import { SecretStore } from "@stackra/config/contracts";
import { Driver, Module, Service } from "@stackra/container";
import { ErrorReporter } from "@stackra/errors/contracts";
import { I18nConfig, Locale } from "@stackra/i18n";
import { describe, expect, it } from "@stackra/testing";

import { ConsoleErrorReporterDriver } from "#core/drivers/console-error-reporter.driver";
import { bootApp } from "#core/functions/boot-app.function";
import { AppWiring } from "#core/values/app-wiring.value";

class SiteI18nConfig extends I18nConfig {
  override locales: Locale[] = [Locale.En, Locale.Ar];
}

/** A config that breaks the shipped rule: the default is not a shipped locale. */
class BrokenI18nConfig extends I18nConfig {
  override defaultLocale: Locale = Locale.Ar;
}

/** A host that keeps both action stores in Postgres. */
class DurableStoresConfig extends StoresConfig {
  override idempotency = "postgres" as const;

  override rateLimit = "postgres" as const;
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

  it("binds the environment as the SecretStore port, unless the caller overrides it", async () => {
    const { container } = await bootApp({ member: "web" }, { env: { SIGNING_KEY: "k1" } });
    expect(container.get(SecretStore).get("SIGNING_KEY")).toBe("k1");
    const given = Object.assign(Object.create(SecretStore.prototype) as SecretStore, {
      get: () => "given",
    });
    const booted = await bootApp(
      { member: "web" },
      { env: {}, overrides: new Map([[SecretStore, given]]) },
    );
    expect(booted.container.get(SecretStore)).toBe(given);
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

  it("fails boot in a deployed environment that keeps the action stores in memory (STA-2798)", async () => {
    const wiring = { member: "orders", config: [{ key: "actions.stores", provide: StoresConfig }] };
    for (const environment of ["preview", "staging", "production"])
      await expect(bootApp(wiring, { env: { STACKRA_ENVIRONMENT: environment } })).rejects.toThrow(
        new RegExp(
          `^StoresConfig is invalid: idempotency: .*${environment} refuses it.*; rateLimit: `,
        ),
      );
    const dev = await bootApp(wiring, { env: {} });
    expect(dev.container.get(StoresConfig).idempotency).toBe("memory");
    const durable = await bootApp(
      {
        ...wiring,
        config: [{ key: "actions.stores", provide: StoresConfig, override: DurableStoresConfig }],
      },
      { env: { STACKRA_ENVIRONMENT: "production" } },
    );
    expect(durable.container.get(StoresConfig).environment).toBe("production");
  });

  it("applies runway's values of the running environment, so runway selects the action stores (STA-2798)", async () => {
    const wiring = { member: "orders", config: [{ key: "actions.stores", provide: StoresConfig }] };
    const runway = {
      dev: { "actions.stores": { idempotency: "valkey" } },
      production: { "actions.stores": { idempotency: "postgres", rateLimit: "postgres" } },
    };
    // production with runway's durable stores boots, as `stackra db seed --env production` does
    const deployed = await bootApp(wiring, {
      env: { STACKRA_ENVIRONMENT: "production" },
      runway,
    });
    expect(deployed.container.get(StoresConfig).idempotency).toBe("postgres");
    expect(deployed.container.get(StoresConfig).rateLimit).toBe("postgres");
    // unset reads as dev; an environment runway does not name gets none of another's values
    const dev = await bootApp(wiring, { env: {}, runway });
    expect(dev.container.get(StoresConfig).idempotency).toBe("valkey");
    await expect(
      bootApp(wiring, { env: { STACKRA_ENVIRONMENT: "staging" }, runway }),
    ).rejects.toThrow(/^StoresConfig is invalid: idempotency: .*staging refuses it/);
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
