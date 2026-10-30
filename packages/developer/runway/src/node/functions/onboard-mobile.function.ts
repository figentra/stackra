/**
 * Stackra file contract:
 * Purpose: `onboardMobile(request)`, mobile onboarding of one app (`stackra mobile onboard`): runs every step in order
 *          and reports each as done, planned, manual or blocked: identity (fills absent store ids), the EAS project,
 *          the EAS profiles' toolchain pin, the Apple bundle id and its capabilities, the App Store Connect app record,
 *          the Google project, Firebase with its apps and config files, the Analytics link, the Sentry project,
 *          signing, push (the FCM key created in the job, written blind to the vault and handed to EAS), the store key
 *          names, and the Play app with its first upload.
 * Boundary: every external call goes through the request's ports; a dry run makes reads only, writes no file and
 *           plans every change. Writes `runway.yaml` (comments kept) and the Firebase config files into the app's
 *           `assets` folder. A generated key lives only in a local of this function, on its way to the vault and EAS;
 *           secrets in `env` are checked by NAME and never read into the output. Steps never stop the run: one that
 *           needs an earlier step's result is blocked until it is done.
 * Runtime: node
 * Governing contract: ADR 0482; ADR 0439 (decision 6: ids frozen at first upload); ADR 0480 (decisions 4, 5 and 8);
 *                     ADR 0062; ADR 0173.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { parseDocument } from "yaml";

import { AppleCapability } from "#core/enums/apple-capability.enum";
import { GoogleProjectState } from "#core/enums/google-project-state.enum";
import { OnboardStepState } from "#core/enums/onboard-step-state.enum";
import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { mobileIdsOf } from "#core/functions/mobile-ids-of.function";
import { MOBILE_ONBOARD_SETTINGS } from "#node/constants/mobile-onboard-settings.constant";
import { readRunway } from "#node/functions/read-runway.function";
import { toolVersionOf } from "#node/functions/tool-version-of.function";
import type { MobileOnboard } from "#node/types/mobile-onboard.type";
import type { MobileOnboardRequest } from "#node/types/mobile-onboard-request.type";
import type { OnboardStep } from "#node/types/onboard-step.type";

/** The two app platforms. */
type Platform = "ios" | "android";

/**
 * Onboards one mobile app.
 *
 * @throws RunwayInvalidError when the app is not in the root runway's `mobile`.
 * @example
 * const result = await onboardMobile({ repository: ".", app: "academorix", dryRun: true, ...memoryPorts });
 * result.steps.filter((step) => step.state === "manual");
 */
export async function onboardMobile(request: MobileOnboardRequest): Promise<MobileOnboard> {
  const repository = resolve(request.repository);
  const { app, apple, play, expo, google, firebase, sentry, vault } = request;
  const root = readRunway(join(repository, "runway.yaml"), "root");
  const entry = root.mobile?.[app];
  if (entry === undefined)
    throw new RunwayInvalidError("runway.yaml", [
      { path: `mobile.${app}`, message: "No such mobile app in the root runway" },
    ]);
  const dry = request.dryRun === true;
  const env = request.env ?? process.env;
  const settings = MOBILE_ONBOARD_SETTINGS;
  const product = root.product?.key ?? root.project;
  const identity = entry.identity ?? {};
  const both = identity.ios === undefined && identity.android === undefined;
  const platforms: Platform[] = [
    ...(both || identity.ios !== undefined ? (["ios"] as const) : []),
    ...(both || identity.android !== undefined ? (["android"] as const) : []),
  ];
  const ids = mobileIdsOf(product, app, identity);
  const idOf = (platform: Platform): string =>
    platform === "ios" ? ids.bundleId : ids.packageName;
  const name = Object.values(identity.name ?? {})[0] ?? app;
  const slug = `${root.project}-${app}`;
  const assets = entry.assets ?? `assets/mobile/${app}`;
  /** A change made now, or planned on a dry run. */
  const applied = dry ? OnboardStepState.Planned : OnboardStepState.Done;
  const would = (done: string, plan: string): string => (dry ? plan : done);

  const steps: OnboardStep[] = [];
  const edits: [readonly string[], string][] = [];
  const files = new Map<string, string>();
  const step = (
    key: string,
    state: OnboardStepState,
    detail: string,
    manual?: readonly string[],
  ): void => {
    steps.push({ key, state, detail, ...(manual === undefined ? {} : { manual }) });
  };

  // identity: fill only what is absent; a set id is frozen at the first store upload.
  const missingIds = platforms.filter((platform) =>
    platform === "ios"
      ? identity.ios?.bundleId === undefined
      : identity.android?.package === undefined,
  );
  for (const platform of missingIds)
    edits.push([
      ["identity", platform, platform === "ios" ? "bundleId" : "package"],
      idOf(platform),
    ]);
  step(
    "identity",
    missingIds.length === 0 ? OnboardStepState.Done : applied,
    missingIds.length === 0
      ? `keeps ${platforms.map(idOf).join(" and ")}`
      : `${would("wrote", "would write")} ${missingIds.map((platform) => `${platform} ${idOf(platform)}`).join(", ")}`,
  );

  // eas-project
  const owner = entry.eas?.owner ?? settings.easOwner;
  const set = entry.eas?.project;
  let project = set !== undefined && !set.startsWith("ref:") ? set : undefined;
  if (project !== undefined) {
    step("eas-project", OnboardStepState.Done, `${owner}/${slug} is ${project}`);
  } else {
    const found = await expo.findProject(owner, slug);
    if (found !== null) {
      project = found;
      edits.push([["eas", "project"], found]);
      step("eas-project", applied, `${would("linked", "would link")} ${owner}/${slug} (${found})`);
    } else if (dry) {
      step("eas-project", OnboardStepState.Planned, `would create ${owner}/${slug}`);
    } else {
      project = await expo.createProject(owner, slug);
      edits.push([["eas", "project"], project]);
      step("eas-project", OnboardStepState.Done, `created ${owner}/${slug} (${project})`);
    }
  }

  // eas-profiles: written by the mobile job at each build; onboarding checks the pin eas-cli needs.
  const node = toolVersionOf(repository, "node");
  if (node !== undefined && /^\d+\.\d+\.\d+$/.test(node))
    step(
      "eas-profiles",
      OnboardStepState.Done,
      `the mobile job writes eas.json (development, preview, ${entry.eas?.channel ?? "production"}; node ${node})`,
    );
  else
    step("eas-profiles", OnboardStepState.Manual, "mise.toml does not pin node exactly", [
      `Set node = "x.y.z" under [tools] in mise.toml (eas-cli refuses a major alone, STA-1621)`,
    ]);

  // apple-bundle and apple-app-record
  if (platforms.includes("ios")) {
    const wanted = [
      ...(entry.capabilities?.includes("push") === true ? [AppleCapability.PushNotifications] : []),
      ...(entry.signIn?.social.includes("apple") === true ? [AppleCapability.SignInWithApple] : []),
      ...((identity.links ?? []).length > 0 ? [AppleCapability.AssociatedDomains] : []),
    ];
    const bundle = await apple.findBundle(ids.bundleId);
    const lacking = wanted.filter((capability) => !bundle?.capabilities.includes(capability));
    if (bundle !== null && lacking.length === 0) {
      step(
        "apple-bundle",
        OnboardStepState.Done,
        `${ids.bundleId} with ${wanted.join(", ") || "no capability"}`,
      );
    } else {
      if (!dry) {
        const id = bundle?.id ?? (await apple.registerBundle(ids.bundleId, name));
        for (const capability of lacking) await apple.enableCapability(id, capability);
      }
      step(
        "apple-bundle",
        applied,
        `${bundle === null ? `${would("registered", "would register")} ${ids.bundleId}` : ids.bundleId}${lacking.length === 0 ? "" : `, ${would("enabled", "would enable")} ${lacking.join(", ")}`}`,
      );
    }

    const appId = await apple.findApp(ids.bundleId);
    if (appId !== null)
      step("apple-app-record", OnboardStepState.Done, `App Store Connect app ${appId}`);
    else
      step(
        "apple-app-record",
        OnboardStepState.Manual,
        `no App Store Connect app for ${ids.bundleId} (the API cannot create one)`,
        [
          "App Store Connect › Apps › + › New App",
          `Platform iOS; Name ${name}; Primary language ${Object.keys(identity.name ?? { en: name })[0]}; Bundle ID ${ids.bundleId}; SKU ${product}-${app}; User access Full`,
          "Run onboard again: the step finds the record by its bundle id",
        ],
      );
  }

  // google-project: the id the runway names, else the product key; never a generated id.
  const googleId = entry.google?.project ?? product;
  const googleState = await google.projectState(googleId);
  let googleReady = googleState === GoogleProjectState.Ours;
  const taken = (): void =>
    step(
      "google-project",
      OnboardStepState.Manual,
      `the Google Cloud project id ${googleId} is taken`,
      [`Choose another id and set mobile.${app}.google.project`],
    );
  if (googleState === GoogleProjectState.Taken) taken();
  else if (googleReady)
    step("google-project", OnboardStepState.Done, `Google Cloud project ${googleId}`);
  else if (dry)
    step(
      "google-project",
      OnboardStepState.Planned,
      `would create Google Cloud project ${googleId}`,
    );
  else if (await google.createProject(googleId, name)) {
    googleReady = true;
    step("google-project", OnboardStepState.Done, `created Google Cloud project ${googleId}`);
  } else taken();
  if (
    entry.google?.project === undefined &&
    (googleReady || (dry && googleState === GoogleProjectState.Missing))
  )
    edits.push([["google", "project"], googleId]);

  // firebase: on the project, one app per platform, config files into the app's assets.
  let firebaseReady = false;
  if (!googleReady) {
    step(
      "firebase",
      dry && googleState === GoogleProjectState.Missing
        ? OnboardStepState.Planned
        : OnboardStepState.Blocked,
      dry && googleState === GoogleProjectState.Missing
        ? `would add Firebase to ${googleId} and register ${platforms.map(idOf).join(" and ")}`
        : "the Google project comes first",
    );
  } else {
    const changes: string[] = [];
    const on = await firebase.hasFirebase(googleId);
    if (!on) {
      changes.push("add Firebase");
      if (!dry) await firebase.addFirebase(googleId);
    }
    for (const platform of platforms) {
      // On a dry run with Firebase still off there is nothing to look an app up in.
      let appId = on || !dry ? await firebase.findApp(googleId, platform, idOf(platform)) : null;
      if (appId === null) {
        changes.push(`register ${idOf(platform)}`);
        if (!dry) appId = await firebase.createApp(googleId, platform, idOf(platform), name);
      }
      if (appId !== null) {
        const file = join(assets, settings.firebaseFiles[platform]);
        const content = await firebase.configFile(googleId, platform, appId);
        let current: string | undefined;
        try {
          current = readFileSync(join(repository, file), "utf8");
        } catch {
          current = undefined;
        }
        if (current !== content) {
          changes.push(`fetch ${file}`);
          if (!dry) files.set(file, content);
        }
      }
    }
    firebaseReady = !dry || changes.length === 0;
    step(
      "firebase",
      changes.length === 0 ? OnboardStepState.Done : applied,
      changes.length === 0
        ? `Firebase on ${googleId} with ${platforms.map(idOf).join(" and ")}`
        : `${would("did", "would")} ${changes.join(", ")}`,
    );
  }

  // analytics-link
  const account = entry.google?.analyticsAccount;
  if (account === undefined) {
    step("analytics-link", OnboardStepState.Manual, "no Google Analytics account named", [
      `Set mobile.${app}.google.analyticsAccount to Figentra's Google Analytics account id`,
    ]);
  } else if (!firebaseReady) {
    step(
      "analytics-link",
      dry ? OnboardStepState.Planned : OnboardStepState.Blocked,
      dry ? `would link ${googleId} to Analytics account ${account}` : "Firebase comes first",
    );
  } else if (await firebase.analyticsLinked(googleId)) {
    step("analytics-link", OnboardStepState.Done, `${googleId} linked to Google Analytics`);
  } else if (dry) {
    step(
      "analytics-link",
      OnboardStepState.Planned,
      `would link ${googleId} to Analytics account ${account}`,
    );
  } else if (await firebase.linkAnalytics(googleId, account)) {
    step(
      "analytics-link",
      OnboardStepState.Done,
      `linked ${googleId} to Analytics account ${account}`,
    );
  } else {
    step(
      "analytics-link",
      OnboardStepState.Manual,
      "Runway's Google identity may not link Analytics",
      [
        `Google Analytics › Admin › Account access management (account ${account}): add Runway's workload identity principal as Editor, once for every product`,
        "Run onboard again",
      ],
    );
  }

  // sentry
  const sentrySlug = entry.sentry?.project ?? slug;
  if (entry.sentry?.dsn !== undefined) {
    step("sentry", OnboardStepState.Done, `Sentry project ${settings.sentryOrg}/${sentrySlug}`);
  } else {
    let dsn = await sentry.findProject(settings.sentryOrg, sentrySlug);
    const created = dsn === null;
    if (dsn === null && !dry)
      dsn = await sentry.createProject(settings.sentryOrg, settings.sentryTeam, sentrySlug);
    if (dsn !== null) edits.push([["sentry", "dsn"], dsn]);
    step(
      "sentry",
      applied,
      `${created ? would("created", "would create") : would("linked", "would link")} Sentry project ${settings.sentryOrg}/${sentrySlug}`,
    );
  }

  // signing: EAS creates and holds every signing credential on the first production build.
  const credentials =
    project === undefined
      ? undefined
      : await expo.credentials(project, ids.bundleId, ids.packageName);
  if (credentials === undefined) {
    step("signing", OnboardStepState.Blocked, "the EAS project comes first");
  } else {
    const unsigned = platforms.filter((platform) => !credentials[platform].signing);
    step(
      "signing",
      unsigned.length === 0 ? OnboardStepState.Done : OnboardStepState.Planned,
      unsigned.length === 0
        ? "EAS holds the signing credentials"
        : `EAS creates the ${unsigned.join(" and ")} signing credentials on the first production build`,
    );
  }

  // push: iOS through EAS's APNs key; Android through the FCM v1 key, made here and never shown.
  if (entry.capabilities?.includes("push") !== true) {
    step("push", OnboardStepState.Done, "the app has no push capability");
  } else if (credentials === undefined) {
    step("push", OnboardStepState.Blocked, "the EAS project comes first");
  } else {
    const parts: string[] = [];
    let state: OnboardStepState = OnboardStepState.Done;
    if (platforms.includes("ios") && !credentials.ios.push) {
      parts.push("EAS creates the APNs key with iOS signing");
      state = OnboardStepState.Planned;
    }
    if (platforms.includes("android") && !credentials.android.push) {
      const path = `${settings.vaultPath}/${product}`;
      if (!googleReady) {
        parts.push("the Android FCM key waits on the Google project");
        state = OnboardStepState.Blocked;
      } else if (dry) {
        parts.push(
          `would create the ${settings.fcmAccount} key, write it to ${path}/${settings.fcmKey} and hand it to EAS`,
        );
        state = OnboardStepState.Planned;
      } else {
        const email = await google.ensureServiceAccount(
          googleId,
          settings.fcmAccount,
          settings.fcmRole,
        );
        const key = await google.createKey(googleId, email);
        await vault.write(path, settings.fcmKey, key);
        await expo.uploadFcmKey(project as string, ids.packageName, key);
        parts.push(
          `created the ${settings.fcmAccount} key, wrote ${path}/${settings.fcmKey} and handed it to EAS`,
        );
      }
    }
    step("push", state, parts.length === 0 ? "EAS holds the push keys" : parts.join("; "));
  }

  // store-keys: names only (ADR 0480's root kit).
  const names = [
    settings.expoToken,
    ...(platforms.includes("ios") ? settings.appleKeys : []),
    ...(platforms.includes("android") ? settings.playKeys : []),
  ];
  const absent = names.filter((key) => (env[key] ?? "") === "");
  if (dry)
    step("store-keys", OnboardStepState.Planned, `the CI job checks ${names.join(", ")} by name`);
  else if (absent.length === 0)
    step("store-keys", OnboardStepState.Done, `${names.join(", ")} are set`);
  else
    step("store-keys", OnboardStepState.Manual, `${absent.join(", ")} not set`, [
      `Add ${absent.join(", ")} to Infisical ${settings.vaultPath} through ~/Secrets-inbox and pnpm secrets:import (ADR 0480 root kit)`,
    ]);

  // play-app: Play can neither create the app nor take its first bundle.
  if (platforms.includes("android")) {
    const found = await play.findApp(ids.packageName);
    if (found?.hasRelease === true)
      step("play-app", OnboardStepState.Done, `${ids.packageName} has a release`);
    else
      step(
        "play-app",
        OnboardStepState.Manual,
        found === null
          ? `no Play app for ${ids.packageName}`
          : `${ids.packageName} has no release yet (the first upload is by hand)`,
        [
          ...(found === null
            ? [
                `Play Console › Create app: app name ${name}, default language ${Object.keys(identity.name ?? { en: name })[0]}, App, Free, accept the declarations`,
              ]
            : []),
          "Policy › App content: privacy policy URL, app access (the review demo account from assets/store), ads, content rating, target audience, Data safety (answers from pnpm store build)",
          `Test and release › Internal testing › Create new release: upload the first production .aab from EAS (eas build:list --platform android --profile production), package ${ids.packageName}`,
          "Keep Play App Signing on (the default) and roll the release out to internal testers",
          "Users and permissions: invite the root kit's Play service account with release rights",
          "Run onboard again: the step is done once Play shows a release",
        ],
      );
  }

  const written: string[] = [];
  if (!dry) {
    if (edits.length > 0) {
      const document = parseDocument(readFileSync(join(repository, "runway.yaml"), "utf8"));
      for (const [path, value] of edits) document.setIn(["mobile", app, ...path], value);
      writeFileSync(join(repository, "runway.yaml"), document.toString({ lineWidth: 0 }));
      written.push("runway.yaml");
    }
    for (const [file, content] of files) {
      mkdirSync(join(repository, assets), { recursive: true });
      writeFileSync(join(repository, file), content);
      written.push(file);
    }
  }
  return { app, ids, steps, written };
}
