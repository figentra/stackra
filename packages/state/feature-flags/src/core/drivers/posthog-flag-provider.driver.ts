/**
 * Stackra file contract:
 * Purpose: the `posthog` driver of the `FlagProvider` port: it asks PostHog's flags endpoint (`POST <host>/flags/?v=2`)
 *          for one subject, with the tenant as the `tenant` group, and returns the enabled state of every flag.
 * Boundary: plain `fetch`, no vendor SDK. An anonymous subject is never sent: it gets `{}`, so every flag keeps its
 *           default and PostHog stores no identifier. PostHog keys allow only letters, digits, `-` and `_`, so a flag
 *           key's dot is a hyphen there (`web.help_centre` is `web-help_centre` in PostHog); a Stackra key never holds
 *           a hyphen, so the mapping is exact. A response from outside is read defensively: anything but a boolean
 *           `enabled` is ignored.
 * Runtime: isomorphic
 * Governing contract: ADR 0213 (decision 3: PostHog driver); ADR 0071 (no identifier before consent).
 */
import { Driver } from "@stackra/container";

import { FeatureFlagsConfig } from "#config/feature-flags.config";
import { FlagProvider } from "#contracts/ports/flag-provider.port";
import type { FlagContext } from "#contracts/types/flag-context.type";

/** The PostHog group type the scope is sent as; the value is PostHog's stored group type, never change it. */
const SCOPE_GROUP = "tenant";

/** Answers flag values from PostHog's flags endpoint. */
export class PosthogFlagProviderDriver extends Driver(FlagProvider) {
  private readonly config: FeatureFlagsConfig;

  /** @param config - holds the PostHog project key and host. */
  constructor(config: FeatureFlagsConfig) {
    super();
    this.config = config;
  }

  /**
   * PostHog's values for `context`, by Stackra flag key; `{}` for an anonymous subject.
   *
   * @throws Error when no PostHog key is configured, the request fails or PostHog answers with an error status.
   */
  async values(context: FlagContext): Promise<Readonly<Record<string, boolean>>> {
    if (context.subject === null) return {};
    const { posthogKey, posthogHost } = this.config;
    if (posthogKey === null || posthogKey === "")
      throw new Error("FeatureFlagsConfig.posthogKey is not set, so PostHog cannot be asked");
    const response = await fetch(`${posthogHost.replace(/\/+$/, "")}/flags/?v=2`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        api_key: posthogKey,
        distinct_id: context.subject,
        groups: context.scope === null ? {} : { [SCOPE_GROUP]: context.scope },
      }),
    });
    if (!response.ok)
      throw new Error(`PostHog answered the flags request with HTTP ${response.status}`);
    const body = (await response.json()) as {
      flags?: Record<string, { enabled?: unknown } | null>;
    };
    const values: Record<string, boolean> = {};
    for (const [key, flag] of Object.entries(body.flags ?? {}))
      if (typeof flag?.enabled === "boolean") values[key.replace("-", ".")] = flag.enabled;
    return values;
  }
}
