/**
 * Stackra file contract:
 * Purpose: a product's store presence is data (ADR 0480, ADR 0441 decision 1). This file reads one mobile app of a
 *   product repository, from two places:
 *     the root runway.yaml `mobile.<app>`   identity (bundle id, package, name per locale), capabilities, `store` path
 *     <store>/<locale>/                     name.txt, subtitle.txt, description.md, keywords.txt, privacy.json, and
 *                                           optional shortDescription.txt, promotionalText.txt, whatsNew.txt
 *     <store>/store.yaml                    app-level facts: urls, review contact and notes, the demo account, seed and
 *                                           probe as secret NAMES, TestFlight groups, app groups, frame background
 *   and generates into `<root>/.stackra/store/<app>/`:
 *     screenshots/<target>/<locale>/NN.png  every store size from the CI captures (`--captures`, default
 *                                           `.stackra/captures/<app>/<locale>/<phone|tablet>/`), never committed
 *     apple-privacy.json, play-data-safety.json, privacy-answers.md
 *                                           from privacy.json, checked against the @stackra/consent categories and the
 *                                           SDKs of the root and the template checkout
 *     checklist.md                          what is automated, what is a browser step, what waits for approval
 * Boundary: reads the product repository and, when given, the runway template checkout (`--template`); writes only
 *   under `.stackra/`. No network.
 * Runtime: node
 * Governing contract: ADR 0480; ADR 0441 (decisions 1 to 3, 7); ADR 0439; .agents/skills/mobile-store-listing.
 * Secrets: none. store.yaml names secrets and never holds a value.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const CORE = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const CONSENT_ENUM = "packages/security/consent/src/core/enums/consent-category.enum.ts";
// shortcut: the codes as of ADR 0298, used when this script runs outside a core checkout; read the enum when it is there.
const CONSENT_FALLBACK = ["necessary", "analytics", "crash_replay"];
const NAME_RX = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/;

/** Every generated size: which capture class feeds it, and the store's count limits. */
export const TARGETS = [
  { id: "APP_IPHONE_67", store: "ios", from: "phone", width: 1290, height: 2796, min: 1, max: 10 },
  {
    id: "APP_IPAD_PRO_3GEN_129",
    store: "ios",
    from: "tablet",
    width: 2048,
    height: 2732,
    min: 1,
    max: 10,
    tablet: true,
  },
  {
    id: "phoneScreenshots",
    store: "android",
    from: "phone",
    width: 1080,
    height: 1920,
    min: 2,
    max: 8,
  },
  {
    id: "sevenInchScreenshots",
    store: "android",
    from: "tablet",
    width: 1200,
    height: 1920,
    min: 1,
    max: 8,
    tablet: true,
  },
  {
    id: "tenInchScreenshots",
    store: "android",
    from: "tablet",
    width: 1600,
    height: 2560,
    min: 1,
    max: 8,
    tablet: true,
  },
];

/** Canonical data type → Apple data type and Play category / type. */
export const DATA_TYPES = {
  name: ["NAME", "Personal info", "Name"],
  email_address: ["EMAIL_ADDRESS", "Personal info", "Email address"],
  phone_number: ["PHONE_NUMBER", "Personal info", "Phone number"],
  physical_address: ["PHYSICAL_ADDRESS", "Personal info", "Address"],
  user_id: ["USER_ID", "Personal info", "User IDs"],
  payment_info: ["PAYMENT_INFORMATION", "Financial info", "User payment info"],
  purchase_history: ["PURCHASE_HISTORY", "Financial info", "Purchase history"],
  precise_location: ["PRECISE_LOCATION", "Location", "Precise location"],
  coarse_location: ["COARSE_LOCATION", "Location", "Approximate location"],
  photos_or_videos: ["PHOTOS_OR_VIDEOS", "Photos and videos", "Photos"],
  other_user_content: ["OTHER_USER_CONTENT", "Files and docs", "Files and docs"],
  customer_support: ["CUSTOMER_SUPPORT", "Messages", "Other in-app messages"],
  product_interaction: ["PRODUCT_INTERACTION", "App activity", "App interactions"],
  crash_data: ["CRASH_DATA", "App info and performance", "Crash logs"],
  performance_data: ["PERFORMANCE_DATA", "App info and performance", "Diagnostics"],
  other_diagnostic_data: [
    "OTHER_DIAGNOSTIC_DATA",
    "App info and performance",
    "Other app performance data",
  ],
  device_id: ["DEVICE_ID", "Device or other IDs", "Device or other IDs"],
};

/** Canonical purpose → Apple purpose and Play purpose. */
export const PURPOSES = {
  app_functionality: ["APP_FUNCTIONALITY", "App functionality"],
  analytics: ["ANALYTICS", "Analytics"],
  personalization: ["PRODUCT_PERSONALIZATION", "Personalization"],
  advertising: ["THIRD_PARTY_ADVERTISING", "Advertising or marketing"],
  developer_communications: ["OTHER_PURPOSES", "Developer communications"],
  account_management: ["APP_FUNCTIONALITY", "Account management"],
  fraud_prevention: ["APP_FUNCTIONALITY", "Fraud prevention, security, and compliance"],
};

/** A dependency that collects data → the `source` a data-collection row must name for it. */
export const SDK_SOURCES = {
  "@sentry/react-native": "sentry",
  "posthog-react-native": "posthog",
  "@stackra/analytics": "analytics",
  "expo-location": "location",
  "expo-image-picker": "photos",
  "expo-contacts": "contacts",
};

/** An assets/store locale folder → [App Store Connect locale, Play locale]. Other folder names pass through. */
export const STORE_LOCALES = {
  en: ["en-US", "en-US"],
  ar: ["ar-SA", "ar"],
  fr: ["fr-FR", "fr-FR"],
  de: ["de-DE", "de-DE"],
  es: ["es-ES", "es-ES"],
  it: ["it", "it-IT"],
  nl: ["nl-NL", "nl-NL"],
};

/** A runway capability (ADR 0439) → the App Store Connect bundle id capability it needs; others need none. */
export const CAPABILITIES = {
  push: "PUSH_NOTIFICATIONS",
  "app-groups": "APP_GROUPS",
  "associated-domains": "ASSOCIATED_DOMAINS",
  passkeys: "ASSOCIATED_DOMAINS",
  "sign-in-with-apple": "APPLE_ID_AUTH",
  payments: "IN_APP_PURCHASE",
  nfc: "NFC_TAG_READING",
};

/** The consent category codes, read from the @stackra/consent enum (the single source). */
export function consentCategories(core = CORE) {
  const file = join(core, CONSENT_ENUM);
  if (!existsSync(file)) return CONSENT_FALLBACK;
  return [...readFileSync(file, "utf8").matchAll(/^\s+[A-Z]\w*:\s*"([a-z_]+)",/gm)].map(
    (m) => m[1],
  );
}

const readYaml = (file) => parse(readFileSync(file, "utf8")) ?? {};
const readText = (file) => (existsSync(file) ? readFileSync(file, "utf8").trim() : undefined);
const LIMITS = {
  name: 30,
  subtitle: 30,
  keywords: 100,
  shortDescription: 80,
  promotionalText: 170,
  description: 4000,
};

/**
 * One mobile app of the product at `root`: `{ config, collection, problems }`. `config` is the shape the store
 * clients read (ios, android, urls, review, testflight, screenshots, locales keyed by folder with `asc` and `play`
 * codes). A problem is a fixed, value-free sentence.
 */
export function loadStore(root, app, { core = CORE, template } = {}) {
  const problems = [];
  const runwayFile = join(root, "runway.yaml");
  if (!existsSync(runwayFile)) return { problems: [`${runwayFile} is missing`] };
  const entry = readYaml(runwayFile).mobile?.[app];
  if (!entry) return { problems: [`runway.yaml has no mobile.${app}`] };
  if (!entry.store) return { problems: [`runway.yaml mobile.${app}.store names no folder`] };
  const dir = join(root, entry.store);
  const id = entry.identity ?? {};
  const meta = existsSync(join(dir, "store.yaml")) ? readYaml(join(dir, "store.yaml")) : {};
  const capabilities = (entry.capabilities ?? []).flatMap((c) =>
    CAPABILITIES[c] ? [CAPABILITIES[c]] : [],
  );

  const config = {
    ios: id.ios?.bundleId && {
      bundleId: id.ios.bundleId,
      capabilities: [...new Set(capabilities)],
      appGroups: meta.appGroups ?? [],
      usesNonExemptEncryption: meta.usesNonExemptEncryption ?? false,
      testflight: meta.testflight ?? {},
    },
    android: id.android?.package && { package: id.android.package },
    urls: meta.urls ?? {},
    review: meta.review,
    screenshots: meta.screenshots ?? {},
    locales: {},
  };
  if (!config.ios && !config.android)
    problems.push(`mobile.${app}.identity names neither ios.bundleId nor android.package`);
  for (const k of ["privacyPolicy", "support"])
    if (!config.urls[k]) problems.push(`${entry.store}/store.yaml urls.${k} is missing`);

  const folders = existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
        .toSorted()
    : [];
  if (!folders.length) problems.push(`${entry.store} has no locale folders`);
  let collection;
  for (const locale of folders) {
    const f = (name) => readText(join(dir, locale, name));
    const l = {
      asc: STORE_LOCALES[locale]?.[0] ?? locale,
      play: STORE_LOCALES[locale]?.[1] ?? locale,
      name: f("name.txt") ?? id.name?.[locale],
      subtitle: f("subtitle.txt"),
      description: f("description.md"),
      keywords: f("keywords.txt"),
      shortDescription: f("shortDescription.txt"),
      promotionalText: f("promotionalText.txt"),
      whatsNew: f("whatsNew.txt"),
    };
    for (const k of ["name", "description"])
      if (!l[k]) problems.push(`${entry.store}/${locale}: ${k} is missing`);
    for (const [k, max] of Object.entries(LIMITS))
      if (l[k]?.length > max)
        problems.push(`${entry.store}/${locale}: ${k} is longer than ${max} characters`);
    config.locales[locale] = l;

    // One privacy answer set per app; every locale carries the same file (assets/store README).
    const raw = f("privacy.json");
    if (!raw) problems.push(`${entry.store}/${locale}/privacy.json is missing`);
    else {
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        problems.push(`${entry.store}/${locale}/privacy.json is not valid JSON`);
        continue;
      }
      if (collection && JSON.stringify(parsed) !== JSON.stringify(collection))
        problems.push(`${entry.store}/${locale}/privacy.json differs from the other locales`);
      collection ??= parsed;
    }
  }
  collection ??= { collects: [] };

  const demo = config.review?.demoAccount;
  if (demo)
    for (const k of ["usernameSecret", "passwordSecret"])
      if (!NAME_RX.test(demo[k] ?? ""))
        problems.push(`review.demoAccount.${k} must name a secret (SCREAMING_SNAKE)`);

  const categories = consentCategories(core);
  const sources = new Set();
  for (const [i, row] of (collection.collects ?? []).entries()) {
    sources.add(row.source);
    if (!DATA_TYPES[row.type])
      problems.push(`collects[${i}].type "${row.type}" is not a known data type`);
    if (!categories.includes(row.consent))
      problems.push(
        `collects[${i}].consent "${row.consent}" is not a consent category (${categories.join(", ")})`,
      );
    for (const p of row.purposes ?? [])
      if (!PURPOSES[p]) problems.push(`collects[${i}] purpose "${p}" is not known`);
    if (!row.purposes?.length) problems.push(`collects[${i}] has no purposes`);
  }
  // The SDKs the built app carries: the product root's and the template checkout's dependencies.
  const deps = [root, template]
    .filter((d) => d && existsSync(join(d, "package.json")))
    .flatMap((d) =>
      Object.keys(JSON.parse(readFileSync(join(d, "package.json"), "utf8")).dependencies ?? {}),
    );
  for (const dep of new Set(deps))
    if (SDK_SOURCES[dep] && !sources.has(SDK_SOURCES[dep]))
      problems.push(
        `${dep} is a dependency but privacy.json has no row with source "${SDK_SOURCES[dep]}"`,
      );

  return { config, collection, problems, dir };
}

/** `{ apple, play }` privacy answers from the data-collection rows. */
export function privacyAnswers(collection) {
  const rows = collection.collects ?? [];
  const merge = (key, fn) => {
    const out = new Map();
    for (const r of rows) {
      const k = key(r);
      const prev = out.get(k);
      out.set(k, fn(r, prev));
    }
    return [...out.values()];
  };
  const apple = {
    collectsData: rows.length > 0,
    tracking: rows.some((r) => r.tracking),
    dataTypes: merge(
      (r) => DATA_TYPES[r.type][0],
      (r, p) => ({
        dataType: DATA_TYPES[r.type][0],
        linkedToUser: Boolean(p?.linkedToUser || r.linked),
        usedForTracking: Boolean(p?.usedForTracking || r.tracking),
        purposes: [
          ...new Set([...(p?.purposes ?? []), ...r.purposes.map((x) => PURPOSES[x][0])]),
        ].toSorted(),
      }),
    ),
  };
  const play = {
    collectsData: rows.length > 0,
    encryptedInTransit: rows.every((r) => r.encryptedInTransit !== false),
    deletionRequest: collection.deletion ?? null,
    dataTypes: merge(
      (r) => DATA_TYPES[r.type].slice(1).join(" / "),
      (r, p) => ({
        category: DATA_TYPES[r.type][1],
        type: DATA_TYPES[r.type][2],
        collected: true,
        shared: Boolean(p?.shared || r.shared),
        ephemeral: Boolean((p?.ephemeral ?? true) && r.ephemeral),
        // Optional for the user exactly when a consent category other than `necessary` gates it.
        optional: (p?.optional ?? true) && r.consent !== "necessary",
        purposes: [
          ...new Set([...(p?.purposes ?? []), ...r.purposes.map((x) => PURPOSES[x][1])]),
        ].toSorted(),
      }),
    ),
  };
  return { apple, play };
}

function answersMarkdown({ apple, play }) {
  const lines = ["# Privacy answers (generated; do not edit)", "", "## App Store: App Privacy", ""];
  if (!apple.collectsData) lines.push("Data Not Collected.");
  else {
    lines.push(
      `Tracking: ${apple.tracking ? "yes" : "no"}`,
      "",
      "| Data type | Linked | Tracking | Purposes |",
      "| --- | --- | --- | --- |",
    );
    for (const d of apple.dataTypes)
      lines.push(
        `| ${d.dataType} | ${d.linkedToUser ? "yes" : "no"} | ${d.usedForTracking ? "yes" : "no"} | ${d.purposes.join(", ")} |`,
      );
  }
  lines.push("", "## Google Play: Data safety", "");
  if (!play.collectsData) lines.push("No user data collected or shared.");
  else {
    lines.push(
      `Encrypted in transit: ${play.encryptedInTransit ? "yes" : "no"}`,
      "",
      "| Category / type | Shared | Ephemeral | Optional | Purposes |",
      "| --- | --- | --- | --- | --- |",
    );
    for (const d of play.dataTypes)
      lines.push(
        `| ${d.category} / ${d.type} | ${d.shared ? "yes" : "no"} | ${d.ephemeral ? "yes" : "no"} | ${d.optional ? "yes" : "no"} | ${d.purposes.join(", ")} |`,
      );
  }
  if (play.deletionRequest)
    lines.push(
      "",
      `Account deletion: in app ${play.deletionRequest.inApp ? "yes" : "no"}; web ${play.deletionRequest.url ?? "none"}`,
    );
  return lines.join("\n") + "\n";
}

/** The plan per target and locale, and count problems. Tablet targets only when the app supports tablets. */
export function screenshotPlan(captures, config, { tablet }) {
  const plan = [];
  const problems = [];
  for (const locale of Object.keys(config.locales ?? {}))
    for (const t of TARGETS) {
      if (t.tablet && !tablet) continue;
      if (t.store === "ios" && !config.ios) continue;
      if (t.store === "android" && !config.android) continue;
      const dir = join(captures, locale, t.from);
      const files = existsSync(dir)
        ? readdirSync(dir)
            .filter((f) => f.endsWith(".png"))
            .toSorted()
            .map((f) => join(dir, f))
        : [];
      if (files.length < t.min || files.length > t.max)
        problems.push(
          `${t.id} ${locale}: ${files.length} ${t.from} captures, needs ${t.min} to ${t.max}`,
        );
      plan.push({ target: t, locale, files });
    }
  return { plan, problems };
}

/** Whether the built app supports tablets: the template checkout's app.json when given, else yes (the safe answer). */
export function supportsTablet(template) {
  const file = template && join(template, "app.json");
  if (!file || !existsSync(file)) return true;
  return JSON.parse(readFileSync(file, "utf8")).expo?.ios?.supportsTablet !== false;
}

/** Renders one plan entry: each capture fitted (letterboxed) onto the exact store size, flattened (no alpha). */
async function render(entry, out, background) {
  const { default: sharp } = await import("sharp");
  const dir = join(out, "screenshots", entry.target.id, entry.locale);
  mkdirSync(dir, { recursive: true });
  const written = [];
  for (const [i, file] of entry.files.entries()) {
    const dest = join(dir, `${String(i + 1).padStart(2, "0")}.png`);
    await sharp(file)
      .resize(entry.target.width, entry.target.height, { fit: "contain", background })
      .flatten({ background })
      .png()
      .toFile(dest);
    written.push(dest);
  }
  return written;
}

const box = (ok) => (ok ? "[x]" : "[ ]");

function checklist(config, problems) {
  return [
    "# Store checklist (generated)",
    "",
    "## Source of truth",
    ...(problems.length ? problems.map((p) => `- [ ] ${p}`) : ["- [x] the store data is complete"]),
    "",
    "## Automated (pnpm store, dry-run until the runway-store workflow runs it live)",
    `- ${box(config.ios)} iOS: bundle id, capabilities, version, metadata, review details, screenshots, TestFlight`,
    `- ${box(config.android)} Android: listing, screenshots, internal track`,
    `- ${box(config.review?.probe)} Review demo account: seed and production probe`,
    "",
    "## Browser steps (owner signed in; no agent types a password)",
    "- [ ] App Store Connect: create the app record once (not in the public API)",
    `- [ ] Apple Developer: create the app groups once${config.ios?.appGroups?.length ? ` (${config.ios.appGroups.join(", ")})` : ""}`,
    "- [ ] App Store Connect: App Privacy, from privacy-answers.md",
    "- [ ] Play Console: create the app once; content rating, target audience, Data safety from privacy-answers.md",
    "",
    "## Owner approval (one click each, GitHub environment `store-production`)",
    "- [ ] Submit for App Review",
    "- [ ] Promote to the Play production track",
    "",
  ].join("\n");
}

/**
 * Generates everything for mobile app `app` of the product at `root` into `<root>/.stackra/store/<app>/`.
 * Returns `{ out, config, problems, screenshots }`.
 */
export async function buildStore(
  root,
  app,
  { core = CORE, template, captures, renderImages = true } = {},
) {
  const { config, collection, problems } = loadStore(root, app, { core, template });
  if (!config) return { problems };
  const out = join(root, ".stackra", "store", app);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });

  const answers = privacyAnswers(collection);
  writeFileSync(join(out, "apple-privacy.json"), JSON.stringify(answers.apple, null, 2) + "\n");
  writeFileSync(join(out, "play-data-safety.json"), JSON.stringify(answers.play, null, 2) + "\n");
  writeFileSync(join(out, "privacy-answers.md"), answersMarkdown(answers));

  const shots = screenshotPlan(captures ?? join(root, ".stackra", "captures", app), config, {
    tablet: supportsTablet(template),
  });
  problems.push(...shots.problems);
  const screenshots = {};
  const background = config.screenshots?.background ?? "#FFFFFF";
  for (const entry of shots.plan) {
    if (!entry.files.length) continue;
    const key = `${entry.target.id}/${entry.locale}`;
    screenshots[key] = renderImages ? await render(entry, out, background) : entry.files;
  }
  writeFileSync(join(out, "checklist.md"), checklist(config, problems));
  return { out, config, problems, screenshots };
}
