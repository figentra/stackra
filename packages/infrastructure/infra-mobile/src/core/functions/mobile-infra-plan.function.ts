/**
 * Stackra file contract:
 * Purpose: `mobileInfraPlan(root, app, identity)`, the mobile release plan from the root runway (the EAS account and
 *          project in `providers.expo`, the Apple team and App Store record in `providers.apple`, the Play account
 *          and app-signing fingerprint in `providers.google`, `targets.eas.credentials`, and each environment's
 *          mobile destination and channel) and the mobile member's runway (its EAS profiles, store submission and
 *          per-environment profile and channel), with the owner tasks no API can do.
 * Boundary: pure: parsed runways in, a plan out. A `ref:` value stays a ref; the Pulumi slice (`./node`) resolves it
 *           from the stack config. Reports every failure at once. Reads no file and calls no cloud.
 * Runtime: isomorphic
 * Governing contract: ADR 0171 (decisions 2 and 4), ADR 0296 (decisions 1 and 2: member WHAT, root WHERE), ADR 0180,
 *                     ADR 0173 (one EAS environment per runway environment, synced by runway; signing never in
 *                     git), ADR 0344 (decisions 3 and 11), ADR 0345 (decision 2).
 */
import { Enum } from "@stackra/contracts";
import { RunwayEnvironment } from "@stackra/runway";
import type { AppRunway, RootRunway, RunwayIssue } from "@stackra/runway";

import { MobileOwnerStep } from "#core/enums/mobile-owner-step.enum";
import { MobileInfraInvalidError } from "#core/errors/mobile-infra-invalid.error";
import { configKeyOf } from "#core/functions/config-key-of.function";
import type { MobileIdentity } from "#core/types/mobile-identity.type";
import type { MobileInfraPlan } from "#core/types/mobile-infra-plan.type";
import type { MobileOwnerTask } from "#core/types/mobile-owner-task.type";
import type { MobileReleaseEnvironment } from "#core/types/mobile-release-environment.type";

/**
 * The mobile release plan of a repository.
 *
 * @param root - the parsed root runway.
 * @param app - the parsed runway of the mobile member.
 * @param identity - the member's store identities, from its `stackra.config.ts` and manifest.
 * @throws MobileInfraInvalidError naming every invalid path, prefixed `root.`, `app.` or `identity.`: a provider fact
 *         the release needs is missing, signing is not `eas-managed`, an EAS environment has no profile, channel or
 *         EAS environment, two runway environments share one EAS environment, a surface's bundle id does not start
 *         with the app's, or nothing ships through EAS.
 * @example
 * const plan = mobileInfraPlan(readRunway("runway.yaml", "root"), readRunway("apps/mobile/runway.yaml", "app"), {
 *   ios: { bundleId: "example.acme.mobile", surfaces: ["example.acme.mobile.widget"] },
 *   android: { package: "example.acme.mobile" },
 * });
 * plan.ownerTasks[0]; // { step: "eas_project", configKey: "expo:projectId" }
 */
export function mobileInfraPlan(
  root: RootRunway,
  app: AppRunway,
  identity: MobileIdentity,
): MobileInfraPlan {
  const issues: RunwayIssue[] = [];
  // "" only after an issue is recorded, so it never reaches a returned plan.
  const fact = (provider: "expo" | "apple" | "google", key: string): string => {
    const value = root.providers?.[provider]?.[key];
    if (typeof value === "string" && value !== "") return value;
    issues.push({
      path: `root.providers.${provider}.${key}`,
      message:
        value === undefined ? "The mobile release needs it" : "Expected an id or a ref:<path>",
    });
    return "";
  };

  const credentials = root.targets?.["eas"]?.["credentials"];
  if (credentials !== undefined && credentials !== "eas-managed") {
    issues.push({
      path: "root.targets.eas.credentials",
      message: "Signing credentials live in EAS (eas-managed), never in the repository",
    });
  }

  const expo = { account: fact("expo", "account"), projectId: fact("expo", "projectId") };
  const submit = app.release?.mobile?.submit;

  let ios: MobileInfraPlan["ios"];
  if (identity.ios !== undefined) {
    const { bundleId } = identity.ios;
    const surfaces = identity.ios.surfaces ?? [];
    surfaces.forEach((surface, index) => {
      if (!surface.startsWith(`${bundleId}.`)) {
        issues.push({
          path: `identity.ios.surfaces.${index}`,
          message: `A native surface's bundle id starts with ${bundleId}.`,
        });
      }
    });
    ios = {
      bundleId,
      teamId: fact("apple", "teamId"),
      surfaces,
      ...(submit?.ios === true ? { ascAppId: fact("apple", "ascAppId") } : {}),
      ...(surfaces.length > 0 ? { appGroup: `group.${bundleId}` } : {}),
    };
  }

  let android: MobileInfraPlan["android"];
  if (identity.android !== undefined) {
    android = {
      package: identity.android.package,
      ...(submit?.android === true
        ? {
            playDeveloperId: fact("google", "playDeveloperId"),
            appSigningSha256: fact("google", "appSigningSha256"),
          }
        : {}),
    };
  }
  if (ios === undefined && android === undefined) {
    issues.push({ path: "identity", message: "The mobile member targets neither ios nor android" });
  }

  const profiles = app.release?.mobile?.profiles;
  const environments: MobileReleaseEnvironment[] = [];
  const owners = new Map<string, RunwayEnvironment>();
  for (const environment of Enum.values(RunwayEnvironment)) {
    const rootEnvironment = root.environments[environment];
    if (rootEnvironment?.destinations?.mobile !== "eas") continue;
    const mobile = app.environments[environment]?.mobile;
    const profile = mobile?.profile;
    const channel = mobile?.channel ?? rootEnvironment?.mobile?.channel;
    const easEnvironment = profile === undefined ? undefined : profiles?.[profile]?.environment;
    const owner = easEnvironment === undefined ? undefined : owners.get(easEnvironment);
    if (profile === undefined || profiles?.[profile] === undefined) {
      issues.push({
        path: `app.environments.${environment}.mobile.profile`,
        message: `${environment} ships through EAS, so it names one of release.mobile.profiles`,
      });
    } else if (easEnvironment === undefined) {
      issues.push({
        path: `app.release.mobile.profiles.${profile}.environment`,
        message: "A profile names the EAS environment runway syncs its values into",
      });
    } else if (owner !== undefined) {
      issues.push({
        path: `app.release.mobile.profiles.${profile}.environment`,
        message: `EAS environment ${easEnvironment} already belongs to ${owner}; one per runway environment`,
      });
    }
    if (channel === undefined) {
      issues.push({
        path: `app.environments.${environment}.mobile.channel`,
        message: `${environment} has no update channel here or in the root runway`,
      });
    }
    if (profile === undefined || channel === undefined || easEnvironment === undefined) continue;
    owners.set(easEnvironment, environment);
    environments.push({ environment, profile, channel, easEnvironment });
  }
  if (environments.length === 0 && issues.length === 0) {
    issues.push({
      path: "root.environments",
      message: "No environment ships the mobile app through EAS (destinations.mobile: eas)",
    });
  }

  if (issues.length > 0) throw new MobileInfraInvalidError("the mobile release runways", issues);

  const ownerTasks: MobileOwnerTask[] = [];
  const task = (step: MobileOwnerStep, appId?: string, value?: string): void => {
    const configKey = value === undefined ? null : configKeyOf(value);
    ownerTasks.push({
      step,
      ...(appId === undefined ? {} : { appId }),
      ...(configKey === null ? {} : { configKey }),
    });
  };
  task(MobileOwnerStep.EasProject, undefined, expo.projectId);
  if (ios !== undefined) {
    task(MobileOwnerStep.AppleTeam, undefined, ios.teamId);
    if (ios.ascAppId !== undefined)
      task(MobileOwnerStep.AppStoreRecord, ios.bundleId, ios.ascAppId);
    for (const bundleId of [ios.bundleId, ...ios.surfaces])
      task(MobileOwnerStep.IosSigning, bundleId);
    task(MobileOwnerStep.ApnsKey, ios.bundleId);
  }
  if (android !== undefined) {
    if (android.playDeveloperId !== undefined) {
      task(MobileOwnerStep.PlayApp, android.package, android.playDeveloperId);
    }
    if (android.appSigningSha256 !== undefined) {
      task(MobileOwnerStep.PlayAppSigning, android.package, android.appSigningSha256);
    }
    task(MobileOwnerStep.AndroidSigning, android.package);
    task(MobileOwnerStep.FcmKey, android.package);
  }

  return {
    expo,
    ...(ios === undefined ? {} : { ios }),
    ...(android === undefined ? {} : { android }),
    environments,
    ownerTasks,
  };
}
