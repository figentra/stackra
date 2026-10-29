/**
 * Stackra file contract:
 * Purpose: an app's `store/` folder is the source of truth for its store presence (ADR 0480). This file reads and
 *   checks it and generates, into `<app>/.stackra/store/`:
 *     screenshots/<target>/<locale>/NN.png   every store size from the simulator captures in
 *                                            `store/captures/<locale>/<phone|tablet>/*.png`
 *     apple-privacy.json, play-data-safety.json, privacy-answers.md
 *                                            the App Privacy and Data safety answers, from `store/data-collection.yaml`
 *                                            checked against the consent categories (@stackra/consent) and the
 *                                            app's analytics and crash SDKs
 *     checklist.md                           what is automated, what is a browser step, what waits for approval
 * Boundary: reads the app folder and the consent enum; writes only under `<app>/.stackra/store/`. No network.
 * Runtime: node
 * Governing contract: ADR 0480; .agents/skills/mobile-store-listing.
 * Secrets: none. store.yaml names secrets (the review demo account) and never holds a value.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const CONSENT_ENUM = "packages/security/consent/src/core/enums/consent-category.enum.ts";
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

/** The consent category codes, read from the @stackra/consent enum (the single source). */
export function consentCategories(root = ROOT) {
  const text = readFileSync(join(root, CONSENT_ENUM), "utf8");
  return [...text.matchAll(/^\s+[A-Z]\w*:\s*"([a-z_]+)",/gm)].map((m) => m[1]);
}

const readYaml = (file) => parse(readFileSync(file, "utf8")) ?? {};

/** Loads `<app>/store/`; returns `{ config, collection, problems }`. A problem is a fixed, value-free sentence. */
export function loadStore(appDir, { root = ROOT } = {}) {
  const dir = join(appDir, "store");
  const problems = [];
  if (!existsSync(join(dir, "store.yaml"))) return { problems: [`${dir}/store.yaml is missing`] };
  const config = readYaml(join(dir, "store.yaml"));
  const collection = existsSync(join(dir, "data-collection.yaml"))
    ? readYaml(join(dir, "data-collection.yaml"))
    : (problems.push("store/data-collection.yaml is missing"), { collects: [] });

  if (!config.ios?.bundleId && !config.android?.package)
    problems.push("store.yaml names neither ios.bundleId nor android.package");
  const locales = Object.keys(config.locales ?? {});
  if (!locales.length) problems.push("store.yaml has no locales");
  for (const [locale, l] of Object.entries(config.locales ?? {})) {
    for (const k of ["name", "description"])
      if (!l?.[k]) problems.push(`locales.${locale}.${k} is missing`);
    if (l?.name?.length > 30) problems.push(`locales.${locale}.name is longer than 30 characters`);
    if (l?.subtitle?.length > 30)
      problems.push(`locales.${locale}.subtitle is longer than 30 characters`);
    if (l?.keywords?.length > 100)
      problems.push(`locales.${locale}.keywords is longer than 100 characters`);
    if (l?.shortDescription?.length > 80)
      problems.push(`locales.${locale}.shortDescription is longer than 80 characters`);
  }
  for (const k of ["privacyPolicy", "support"])
    if (!config.urls?.[k]) problems.push(`urls.${k} is missing`);

  const demo = config.review?.demoAccount;
  if (demo)
    for (const k of ["usernameSecret", "passwordSecret"])
      if (!NAME_RX.test(demo[k] ?? ""))
        problems.push(`review.demoAccount.${k} must name a secret (SCREAMING_SNAKE)`);

  // Privacy: every row maps to both stores and names a real consent category.
  const categories = consentCategories(root);
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
  // The app's own SDKs: one that collects data needs a row naming it (privacy answers travel with the feature).
  const pkg = existsSync(join(appDir, "package.json"))
    ? JSON.parse(readFileSync(join(appDir, "package.json"), "utf8"))
    : {};
  for (const dep of Object.keys({ ...pkg.dependencies }))
    if (SDK_SOURCES[dep] && !sources.has(SDK_SOURCES[dep]))
      problems.push(
        `${dep} is a dependency but data-collection.yaml has no row with source "${SDK_SOURCES[dep]}"`,
      );

  return { config, collection, problems };
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

/** `{ target → locale → [capture files] }` and count problems. Tablet targets only when the app supports tablets. */
export function screenshotPlan(appDir, config, { tablet }) {
  const captures = join(appDir, "store", config.screenshots?.captures ?? "captures");
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
          `${t.id} ${locale}: ${files.length} ${t.from} captures, needs ${t.min} to ${t.max} (store/captures/${locale}/${t.from}/)`,
        );
      plan.push({ target: t, locale, files });
    }
  return { plan, problems };
}

/** Whether the Expo app config turns on iPad support (the iPad set is then required). */
export function supportsTablet(appDir) {
  const file = join(appDir, "app.json");
  return (
    existsSync(file) && JSON.parse(readFileSync(file, "utf8")).expo?.ios?.supportsTablet === true
  );
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
    ...(problems.length ? problems.map((p) => `- [ ] ${p}`) : ["- [x] store/ is complete"]),
    "",
    "## Automated (pnpm store, dry-run until the store-release workflow runs it live)",
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

/** Generates everything into `<app>/.stackra/store/`. Returns `{ out, problems, screenshots }`. */
export async function buildStore(appDir, { root = ROOT, renderImages = true } = {}) {
  const { config, collection, problems } = loadStore(appDir, { root });
  if (!config) return { problems };
  const out = join(appDir, ".stackra", "store");
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });

  const answers = privacyAnswers(collection);
  writeFileSync(join(out, "apple-privacy.json"), JSON.stringify(answers.apple, null, 2) + "\n");
  writeFileSync(join(out, "play-data-safety.json"), JSON.stringify(answers.play, null, 2) + "\n");
  writeFileSync(join(out, "privacy-answers.md"), answersMarkdown(answers));

  const shots = screenshotPlan(appDir, config, { tablet: supportsTablet(appDir) });
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
