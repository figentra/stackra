/**
 * Stackra file contract:
 * Purpose: `mobileStack(plan)`, the mobile slice of the Pulumi program `stackra infra gen` composes: resolves every
 *          `ref:` fact of a mobile release plan from the stack config (`ref:expo.projectId` reads `expo:projectId`),
 *          checks each resolved fact's shape, and returns the resolved plan for the program to export, so the deploy
 *          jobs read the EAS project, the Apple team, the store records and the channels from one place.
 * Boundary: runs inside a Pulumi program and creates no resource. No Pulumi provider covers EAS, App Store Connect
 *           app records or Play apps, and EAS registers bundle ids, syncs capabilities and holds the signing and
 *           push credentials itself (`targets.eas.credentials: eas-managed`), so those stay the plan's owner tasks
 *           (ADR 0344 decision 11). Agents run `pulumi preview` at most; `up` is the owner's.
 * Runtime: node
 * Governing contract: ADR 0171 (decisions 2 to 4, as amended by 0289 decision 9), ADR 0173 (ids, never secret
 *                     values), ADR 0325 (rule 1: inputs are checked before a deploy starts), ADR 0344 (decision 11).
 */
import { Config } from "@pulumi/pulumi";
import type { RunwayIssue } from "@stackra/runway";

import { MobileInfraInvalidError } from "#core/errors/mobile-infra-invalid.error";
import { configKeyOf } from "#core/functions/config-key-of.function";
import type { MobileInfraPlan } from "#core/types/mobile-infra-plan.type";
import { MOBILE_FACT_PATTERNS } from "#node/constants/mobile-fact-patterns.constant";

/**
 * The plan with every fact resolved from the stack config and checked.
 *
 * @param plan - the plan `mobileInfraPlan` built from the runways.
 * @throws Error (Pulumi's missing-configuration error) when a `ref:` key is not set in the stack config.
 * @throws MobileInfraInvalidError naming every fact whose resolved value has the wrong shape.
 * @example
 * // .stackra/infra/index.ts (generated)
 * export const mobile = mobileStack(plan);
 */
export function mobileStack(plan: MobileInfraPlan): MobileInfraPlan {
  const issues: RunwayIssue[] = [];
  const resolve = (fact: keyof typeof MOBILE_FACT_PATTERNS, value: string): string => {
    const key = configKeyOf(value);
    const colon = key?.indexOf(":") ?? -1;
    // A ref with no dot reads the project's own namespace.
    const resolved =
      key === null
        ? value
        : colon < 0
          ? new Config().require(key)
          : new Config(key.slice(0, colon)).require(key.slice(colon + 1));
    if (!MOBILE_FACT_PATTERNS[fact].test(resolved)) {
      issues.push({
        path: key ?? `root.providers.${fact}`,
        message: `"${resolved}" is not a valid ${fact}`,
      });
    }
    return resolved;
  };

  const { ios, android } = plan;
  const resolved: MobileInfraPlan = {
    ...plan,
    expo: {
      account: resolve("expo.account", plan.expo.account),
      projectId: resolve("expo.projectId", plan.expo.projectId),
    },
    ...(ios === undefined
      ? {}
      : {
          ios: {
            ...ios,
            teamId: resolve("apple.teamId", ios.teamId),
            ...(ios.ascAppId === undefined
              ? {}
              : { ascAppId: resolve("apple.ascAppId", ios.ascAppId) }),
          },
        }),
    ...(android === undefined
      ? {}
      : {
          android: {
            ...android,
            ...(android.playDeveloperId === undefined
              ? {}
              : { playDeveloperId: resolve("google.playDeveloperId", android.playDeveloperId) }),
            ...(android.appSigningSha256 === undefined
              ? {}
              : { appSigningSha256: resolve("google.appSigningSha256", android.appSigningSha256) }),
          },
        }),
  };
  if (issues.length > 0) throw new MobileInfraInvalidError("the Pulumi stack config", issues);
  return resolved;
}
