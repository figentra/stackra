/**
 * Stackra file contract:
 * Purpose: the tests of the "Settings and feature flags" guide's examples: the reply deadline reads the default until
 *          the platform or a tenant changes it, and a tenant's value reaches that tenant only; a value out of bounds
 *          and a write at a level the setting does not allow are refused; the new-inbox flag is off by default, on for
 *          the tenant PostHog targets and off for another (the tenant goes to PostHog as the group and the subject),
 *          and PostHog is never asked without a subject; a test sets a flag with `fakeFlags`.
 * Boundary: test only; settings run on `MemorySettingValueStoreDriver` with `support.settings-keys.ts` standing in for
 *           gen's output; PostHog is a stubbed `fetch` that answers per tenant group. The project key is a dummy.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0213; ADR 0307 (rules 22 to 24); ADR 0323; STA-2852.
 */
import { buildConfig } from "@stackra/config";
import type { PublicId, ScopeRef } from "@stackra/contracts";
import { isRefusal } from "@stackra/errors";
import { FlagReader, PosthogFlagProviderDriver } from "@stackra/feature-flags";
import { fakeFlags } from "@stackra/feature-flags/testing";
import {
  MemorySettingValueStoreDriver,
  SettingScope,
  SettingScopeRefusedError,
  SettingsReader,
  SettingValueInvalidError,
  settingsPage,
} from "@stackra/settings";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { FeatureFlagsConfig } from "../feature-flags.config";
import { Flags } from "../flags";
import { ReplyDeadlineService } from "../reply-deadline.service";
import { SupportTenantPage } from "./support.settings-keys";

const ACME: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2a1", path: "platform.acme" };
const GLOBEX: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2g1", path: "platform.globex" };
const ADA = "usr_01j9z3k4m5n6p7q8r9s0t1v2c1" as PublicId<"usr">;
const BEN = "usr_01j9z3k4m5n6p7q8r9s0t1v2c2" as PublicId<"usr">;

/** PostHog's answers: the new inbox is on for Acme's tenant group only. */
const posthog = vi.fn(async (_url: string, init: RequestInit) => {
  const { groups } = JSON.parse(String(init.body)) as { groups: { tenant?: string } };
  const enabled = groups.tenant === ACME.id;
  return Response.json({ flags: { "support-new_inbox": { enabled } } });
});

afterEach(() => {
  vi.unstubAllGlobals();
  posthog.mockClear();
});

describe("Settings and feature flags guide", () => {
  it("reads the default until the platform or a tenant changes it, per tenant", async () => {
    // #region settings
    const settings = new SettingsReader(new MemorySettingValueStoreDriver());
    const deadlines = new ReplyDeadlineService(settings);
    const opened = new Date("2026-11-26T09:00:00Z");

    expect(await deadlines.dueAt(opened, ACME)).toEqual(new Date("2026-11-27T09:00:00Z"));

    // what the generated `support.settings.update` operation does for an Acme admin
    await settings.write(SupportTenantPage, { firstReplyHours: 4 }, { scope: ACME });

    expect(await deadlines.dueAt(opened, ACME)).toEqual(new Date("2026-11-26T13:00:00Z"));
    expect(await deadlines.dueAt(opened, GLOBEX)).toEqual(new Date("2026-11-27T09:00:00Z"));
    // #endregion settings

    // #region platform-default
    const platformPage = settingsPage("support", { scope: SettingScope.Platform });
    await settings.write(platformPage, { firstReplyHours: 48 });

    expect(await deadlines.dueAt(opened, GLOBEX)).toEqual(new Date("2026-11-28T09:00:00Z"));
    expect(await deadlines.dueAt(opened, ACME)).toEqual(new Date("2026-11-26T13:00:00Z"));
    // #endregion platform-default
  });

  it("refuses a value out of its bounds and a level the setting does not allow", async () => {
    const settings = new SettingsReader(new MemorySettingValueStoreDriver());
    // #region refused
    const tooLong = settings.write(SupportTenantPage, { firstReplyHours: 500 }, { scope: ACME });
    await expect(tooLong).rejects.toSatisfy((error) => isRefusal(error, SettingValueInvalidError));

    const forAda = settings.write(SupportTenantPage, { firstReplyHours: 2 }, { user: ADA });
    await expect(forAda).rejects.toSatisfy((error) => isRefusal(error, SettingScopeRefusedError));
    // #endregion refused
  });

  it("turns the new inbox on for the tenants PostHog targets", async () => {
    vi.stubGlobal("fetch", posthog);
    // #region rollout
    const config = buildConfig(FeatureFlagsConfig, { values: { posthogKey: "phc_guide_dummy" } });
    const flags = new FlagReader(config, new PosthogFlagProviderDriver(config));

    expect(flags.get(Flags.support.new_inbox)).toBe(false); // the declared default

    await flags.load({ visitor: null, user: ADA, scope: ACME.id });
    expect(flags.get(Flags.support.new_inbox)).toBe(true);

    await flags.load({ visitor: null, user: BEN, scope: GLOBEX.id });
    expect(flags.get(Flags.support.new_inbox)).toBe(false);
    // #endregion rollout

    const [, first] = posthog.mock.calls[0] ?? [];
    expect(JSON.parse(String(first?.body))).toEqual({
      api_key: "phc_guide_dummy",
      distinct_id: ACME.id,
      groups: { tenant: ACME.id },
    });
  });

  it("never asks PostHog without a subject, and keeps the default", async () => {
    vi.stubGlobal("fetch", posthog);
    const config = buildConfig(FeatureFlagsConfig, { values: { posthogKey: "phc_guide_dummy" } });
    const flags = new FlagReader(config, new PosthogFlagProviderDriver(config));
    await flags.load({ visitor: null, user: null, scope: null });
    expect(flags.get(Flags.support.new_inbox)).toBe(false);
    expect(posthog).not.toHaveBeenCalled();
  });

  it("sets a flag in a test with fakeFlags", () => {
    // #region fake-flags
    const flags = fakeFlags((fake) => fake.set(Flags.support.new_inbox, true));
    expect(flags.get(Flags.support.new_inbox)).toBe(true);
    // #endregion fake-flags
  });
});
