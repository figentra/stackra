/**
 * Stackra file contract:
 * Purpose: hold the release automation to its contract (ADR 0480): the transport sends nothing in a dry run and
 *          refuses live outside CI; the App Store Connect and Play clients walk their flows against recorded fixtures;
 *          owner-approved steps refuse outside the `production` environment; the store/ source of truth is checked and turned
 *          into store sizes and privacy answers; no credential or demo password reaches the output.
 * Boundary: throwaway app folders and the fixtures in __fixtures__/store; Apple, Google and Expo are never called.
 * Runtime: node
 * Governing contract: ADR 0022 (tests live in tests folders); ADR 0182 (testing strategy); ADR 0480.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync, randomBytes, verify } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { stringify } from "yaml";
import { ascToken } from "../store-asc.mjs";
import { buildStore, consentCategories, loadStore, privacyAnswers } from "../store-build.mjs";
import { assertLiveAllowed, createTransport, fixtureName, scrub } from "../store-http.mjs";
import { playAssertion } from "../store-play.mjs";
import { assertApproved, main } from "../store.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), "__fixtures__/store");
const canary = () => `fake-${randomBytes(12).toString("hex")}`;
const PNG = Buffer.from("89504e470d0a1a0a", "hex"); // replay never decodes it; 8 bytes, as the upload fixture says

/**
 * A throwaway product repository (ADR 0441): root runway.yaml `mobile.app`, `assets/store/app/<locale>/` files and
 * store.yaml, CI captures under `.stackra/captures/app/`, and a template checkout whose app.json and dependencies the
 * build reads. Returns `{ dir, tpl, args }`, `args` being the CLI flags that point at it.
 */
function product({
  collects = [],
  deps = {},
  exclude = [],
  captures = 2,
  tablet = false,
  review = true,
  ascAppId,
  locales = { en: { "name.txt": "Example", "subtitle.txt": "An example" } },
} = {}) {
  const dir = mkdtempSync(join(tmpdir(), "store-test-"));
  const tpl = join(dir, ".stackra", "mobile", "app");
  mkdirSync(tpl, { recursive: true });
  writeFileSync(
    join(tpl, "app.json"),
    JSON.stringify({ expo: { ios: { supportsTablet: tablet } } }),
  );
  writeFileSync(
    join(tpl, "package.json"),
    JSON.stringify({ dependencies: deps, expo: { autolinking: { exclude } } }),
  );
  writeFileSync(
    join(dir, "runway.yaml"),
    stringify({
      mobile: {
        app: {
          template: "os/mobile@3",
          store: "assets/store/app",
          identity: {
            name: { en: "Example" },
            ios: { bundleId: "com.example.app" },
            android: { package: "com.example.app" },
          },
          capabilities: ["push", "payments", "camera"],
        },
      },
    }),
  );
  const store = join(dir, "assets", "store", "app");
  mkdirSync(store, { recursive: true });
  writeFileSync(
    join(store, "store.yaml"),
    stringify({
      ascAppId,
      urls: { privacyPolicy: "https://example.com/privacy", support: "https://example.com/help" },
      testflight: { groups: ["Internal", "Public Beta"] },
      review: review && {
        contact: { firstName: "Ex", lastName: "Ample", emailSecret: "STORE_REVIEW_CONTACT_EMAIL" },
        demoAccount: {
          usernameSecret: "STORE_REVIEW_DEMO_USERNAME",
          passwordSecret: "STORE_REVIEW_DEMO_PASSWORD",
        },
        seed: {
          url: "https://api.example.com/ops/seed-demo",
          tokenSecret: "STORE_REVIEW_SEED_TOKEN",
        },
        probe: {
          signIn: { url: "https://api.example.com/auth/sign-in" },
          data: { url: "https://api.example.com/me/dashboard" },
        },
      },
    }),
  );
  for (const [locale, files] of Object.entries(locales)) {
    mkdirSync(join(store, locale), { recursive: true });
    const all = {
      "description.md": "An example app.",
      "whatsNew.txt": "Fixes.",
      "privacy.yaml": stringify({ collects }),
      ...files,
    };
    for (const [name, text] of Object.entries(all)) writeFileSync(join(store, locale, name), text);
  }
  const phone = join(dir, ".stackra", "captures", "app", "en", "phone");
  mkdirSync(phone, { recursive: true });
  for (let i = 1; i <= captures; i++) writeFileSync(join(phone, `0${i}.png`), PNG);
  return { dir, tpl, args: ["--root", dir, "--template", tpl] };
}

function secrets() {
  const ec = generateKeyPairSync("ec", { namedCurve: "P-256" });
  const rsa = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const env = {
    ASC_API_KEY_ID: "KEY123",
    ASC_API_ISSUER_ID: "issuer-1",
    ASC_API_PRIVATE_KEY: ec.privateKey.export({ type: "pkcs8", format: "pem" }),
    GOOGLE_PLAY_SERVICE_ACCOUNT_JSON: JSON.stringify({
      client_email: "releaser@example.iam.gserviceaccount.com",
      private_key: rsa.privateKey.export({ type: "pkcs8", format: "pem" }),
      token_uri: "https://oauth2.googleapis.com/token",
    }),
    STORE_REVIEW_CONTACT_EMAIL: `${canary()}@example.com`,
    STORE_REVIEW_DEMO_USERNAME: canary(),
    STORE_REVIEW_DEMO_PASSWORD: canary(),
    STORE_REVIEW_SEED_TOKEN: canary(),
  };
  return { env, ec, rsa };
}

async function run(argv, { env = {}, fixtures } = {}) {
  let out = "";
  const transport = fixtures
    ? createTransport({ mode: "replay", fixtures: join(FIXTURES, fixtures) })
    : undefined;
  const code = await main(argv, { env, transport, write: (s) => (out += s) });
  return { code, out, transport };
}

function assertNoLeak(env, ...texts) {
  for (const [k, v] of Object.entries(env))
    if (k !== "ASC_API_KEY_ID" && k !== "ASC_API_ISSUER_ID")
      for (const t of texts) assert.ok(!t.includes(v), `${k} reached the output`);
}

// --- transport -------------------------------------------------------------------------------------

test("dry run sends nothing and answers writes with a synthetic id", async () => {
  const t = createTransport({
    mode: "dry-run",
    fetchImpl: () => assert.fail("fetch called in a dry run"),
  });
  const w = await t.call({
    method: "POST",
    url: "https://api.appstoreconnect.apple.com/v1/bundleIds",
    body: "{}",
  });
  const r = await t.call({ url: "https://api.appstoreconnect.apple.com/v1/apps" });
  assert.equal(w.json.data.id, "dry-run");
  assert.deepEqual(r.json.data, []);
  assert.deepEqual(
    t.calls.map((c) => c.sent),
    [false, false],
  );
});

test("replay throws on a call with no fixture", async () => {
  const t = createTransport({ mode: "replay", fixtures: join(FIXTURES, "asc") });
  await assert.rejects(
    t.call({ url: "https://api.appstoreconnect.apple.com/v1/nothing" }),
    /no fixture/,
  );
});

test("live and record run only inside GitHub Actions", () => {
  assert.throws(() => assertLiveAllowed("live", {}), /runway-store workflow/);
  assert.throws(() => assertLiveAllowed("record", { GITHUB_ACTIONS: "false" }));
  assertLiveAllowed("live", { GITHUB_ACTIONS: "true" });
  assertLiveAllowed("dry-run", {});
});

test("record scrubs secret-looking fields; a live error names the status and code, never the detail", async () => {
  const dir = mkdtempSync(join(tmpdir(), "store-record-"));
  const secret = canary();
  const fetchImpl = async (url) =>
    new Response(
      url.endsWith("/bad")
        ? JSON.stringify({
            errors: [{ code: "ENTITY_ERROR", detail: `demoAccountPassword ${secret} invalid` }],
          })
        : JSON.stringify({ access_token: secret, data: { demoAccountPassword: secret, ok: true } }),
      { status: url.endsWith("/bad") ? 409 : 200 },
    );
  const t = createTransport({ mode: "record", fixtures: dir, fetchImpl });
  await t.call({ url: "https://api.example.com/good" });
  const saved = readFileSync(join(dir, fixtureName("GET", "https://api.example.com/good")), "utf8");
  assert.ok(!saved.includes(secret));
  assert.match(saved, /"ok": true/);
  await assert.rejects(
    t.call({ url: "https://api.example.com/bad" }),
    (e) => !e.message.includes(secret) && /409 ENTITY_ERROR/.test(e.message),
  );
  assert.deepEqual(scrub({ list: [{ password: "x", name: "n" }] }), {
    list: [{ password: "<scrubbed>", name: "n" }],
  });
});

// --- signing -----------------------------------------------------------------------------------------

test("ASC token is an ES256 JWT Apple can verify", () => {
  const { env, ec } = secrets();
  const jwt = ascToken(
    { keyId: "KEY123", issuerId: "issuer-1", privateKey: env.ASC_API_PRIVATE_KEY },
    1_800_000_000_000,
  );
  const [h, b, s] = jwt.split(".");
  assert.deepEqual(JSON.parse(Buffer.from(h, "base64url")), {
    alg: "ES256",
    kid: "KEY123",
    typ: "JWT",
  });
  const body = JSON.parse(Buffer.from(b, "base64url"));
  assert.equal(body.aud, "appstoreconnect-v1");
  assert.equal(body.exp - body.iat, 1200);
  assert.ok(
    verify(
      "sha256",
      Buffer.from(`${h}.${b}`),
      { key: ec.publicKey, dsaEncoding: "ieee-p1363" },
      Buffer.from(s, "base64url"),
    ),
  );
});

test("Play assertion is an RS256 JWT for the androidpublisher scope", () => {
  const { env, rsa } = secrets();
  const sa = JSON.parse(env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON);
  const jwt = playAssertion({
    clientEmail: sa.client_email,
    privateKey: sa.private_key,
    tokenUri: sa.token_uri,
  });
  const [h, b, s] = jwt.split(".");
  assert.match(JSON.parse(Buffer.from(b, "base64url")).scope, /androidpublisher/);
  assert.ok(
    verify("RSA-SHA256", Buffer.from(`${h}.${b}`), rsa.publicKey, Buffer.from(s, "base64url")),
  );
});

// --- App Store Connect ---------------------------------------------------------------------------------

test("ios: bundle id, capabilities, version, metadata, review, screenshots and TestFlight, from fixtures", async () => {
  const { env } = secrets();
  const { code, out, transport } = await run(
    ["ios", ...product().args, "--version", "1.0.0", "--build", "7", "--replay"],
    { env, fixtures: "asc" },
  );
  assert.equal(code, 0, out);
  assert.match(out, /bundle id com\.example\.app: created/); // the prefix match on com.example.app.widget is not it
  assert.match(out, /capabilities: added PUSH_NOTIFICATIONS\n/);
  assert.match(out, /version 1\.0\.0: created/);
  assert.match(out, /screenshots APP_IPHONE_67 en: 2/);
  assert.match(out, /TestFlight build 7: Internal, Public Beta/);
  const paths = transport.calls.map((c) => `${c.method} ${c.path}`);
  assert.ok(paths.includes("DELETE api.appstoreconnect.apple.com/v1/appScreenshots/OLD1"));
  assert.ok(paths.includes("POST api.appstoreconnect.apple.com/v1/betaAppReviewSubmissions")); // an external group
  assert.ok(!paths.some((p) => p.includes("reviewSubmissions ")), "ios never submits for review");
  assertNoLeak(env, out);
});

test("ios stops at a missing app record (a browser step)", async () => {
  const t = createTransport({ mode: "dry-run" });
  let out = "";
  const code = await main(["ios", ...product().args, "--version", "1.0.0"], {
    env: {},
    transport: t,
    write: (s) => (out += s),
  });
  assert.equal(code, 1);
  assert.match(out, /app record: missing; create it in App Store Connect/);
  assert.match(out, /dry run: \d+ call\(s\) planned, none sent/);
});

test("submit and promote run only in the production environment", async () => {
  assert.throws(() => assertApproved("live", { STORE_ENVIRONMENT: "store" }), /production/);
  assertApproved("live", { STORE_ENVIRONMENT: "production" });
  const { env } = secrets();
  const refused = await main(
    ["submit", ...product().args, "--version", "1.0.0", "--build", "7", "--live"],
    {
      env: { ...env, GITHUB_ACTIONS: "true", STORE_ENVIRONMENT: "store" },
      transport: createTransport({ mode: "replay", fetchImpl: () => assert.fail("sent") }),
      write: () => {},
    },
  );
  assert.equal(refused, 1);
});

test("submit attaches the build and submits the version, from fixtures", async () => {
  const { env } = secrets();
  const { code, out, transport } = await run(
    ["submit", ...product().args, "--version", "1.0.0", "--build", "7", "--replay"],
    { env, fixtures: "asc" },
  );
  assert.equal(code, 0, out);
  assert.match(out, /submitted for review: SUB1/);
  assert.deepEqual(
    transport.calls
      .slice(-4)
      .map((c) => `${c.method} ${c.path.replace("api.appstoreconnect.apple.com", "")}`),
    [
      "PATCH /v1/appStoreVersions/VER1/relationships/build",
      "POST /v1/reviewSubmissions",
      "POST /v1/reviewSubmissionItems",
      "PATCH /v1/reviewSubmissions/SUB1",
    ],
  );
});

// --- Google Play ---------------------------------------------------------------------------------------

test("android: one edit with listing, screenshots and the internal track, validated and committed", async () => {
  const { env } = secrets();
  const { code, out, transport } = await run(
    ["android", ...product().args, "--version", "1.0.0", "--version-code", "12", "--replay"],
    { env, fixtures: "play" },
  );
  assert.equal(code, 0, out);
  assert.match(out, /screenshots phoneScreenshots en: 2/);
  assert.match(out, /track internal: version code 12/);
  const paths = transport.calls.map((c) => c.path);
  assert.equal(paths[0], "oauth2.googleapis.com/token");
  assert.ok(paths.at(-1).endsWith("edits/EDIT1:commit"));
  assertNoLeak(env, out);
});

test("promote: staged production rollout, from fixtures", async () => {
  const { env } = secrets();
  const { code, out } = await run(
    ["promote", ...product().args, "--version-code", "12", "--fraction", "0.1", "--replay"],
    { env, fixtures: "play" },
  );
  assert.equal(code, 0, out);
  assert.match(out, /production track: version code 12 at 0\.1/);
});

// --- review demo account ---------------------------------------------------------------------------------

test("review seed then probe signs in on production and sees data, without printing the credentials", async () => {
  const { env } = secrets();
  const { code, out } = await run(["review", "seed", ...product().args, "--replay"], {
    env,
    fixtures: "review",
  });
  assert.equal(code, 0, out);
  assert.match(out, /seed: HTTP 200\nprobe sign-in: HTTP 200\nprobe data: HTTP 200, 1 item/);
  assertNoLeak(env, out);
});

test("probe refuses when a named secret is not set", async () => {
  const { code, out } = await run(["review", "probe", ...product().args, "--replay"], {
    env: {},
    fixtures: "review",
  });
  assert.equal(code, 1);
  assert.match(out, /STORE_REVIEW_DEMO_USERNAME is not set/);
});

// --- store/ source of truth ------------------------------------------------------------------------------

test("an SDK the mobile job strips for an unlisted capability needs no privacy row", () => {
  const repo = product({ deps: { "expo-location": "x" }, exclude: ["expo-location"] });
  const { problems } = loadStore(repo.dir, "app", { core: ROOT, template: repo.tpl });
  assert.ok(!problems.some((x) => x.includes("expo-location")), problems.join("; "));
});

test("loadStore checks text limits, consent categories, purposes and undeclared SDKs", () => {
  assert.deepEqual(consentCategories(ROOT), [
    "necessary",
    "analytics",
    "crash_replay",
    "marketing",
  ]);
  const repo = product({
    deps: { "@sentry/react-native": "x", "posthog-react-native": "y" },
    collects: [
      {
        type: "crash_data",
        source: "sentry",
        consent: "crash_replay",
        purposes: ["app_functionality"],
      },
      { type: "spaceship", source: "x", consent: "telepathy", purposes: ["fun"] },
    ],
    locales: { en: { "name.txt": "N".repeat(31) } },
  });
  const { problems } = loadStore(repo.dir, "app", { core: ROOT, template: repo.tpl });
  for (const rx of [
    /name is longer than 30/,
    /"spaceship" is not a known data type/,
    /"telepathy" is not a consent category/,
    /purpose "fun"/,
    /posthog-react-native is a dependency/,
  ])
    assert.ok(
      problems.some((p) => rx.test(p)),
      `${rx} in ${problems.join("; ")}`,
    );
  assert.ok(!problems.some((p) => p.includes("@sentry")), "sentry has its row");
});

test("privacy answers: Apple linked/tracking/purposes, Play optional exactly when consent is not necessary", () => {
  const { apple, play } = privacyAnswers({
    collects: [
      {
        type: "email_address",
        source: "identity",
        consent: "necessary",
        purposes: ["account_management"],
        linked: true,
      },
      {
        type: "product_interaction",
        source: "posthog",
        consent: "analytics",
        purposes: ["analytics"],
      },
      {
        type: "product_interaction",
        source: "app",
        consent: "analytics",
        purposes: ["personalization"],
        shared: true,
      },
    ],
    deletion: { inApp: true },
  });
  assert.deepEqual(
    apple.dataTypes.find((d) => d.dataType === "EMAIL_ADDRESS"),
    {
      dataType: "EMAIL_ADDRESS",
      linkedToUser: true,
      usedForTracking: false,
      purposes: ["APP_FUNCTIONALITY"],
    },
  );
  const pi = play.dataTypes.find((d) => d.type === "App interactions");
  assert.deepEqual(pi.purposes, ["Analytics", "Personalization"]);
  assert.equal(pi.shared, true);
  assert.equal(pi.optional, true);
  assert.equal(play.dataTypes.find((d) => d.type === "Email address").optional, false);
  assert.equal(privacyAnswers({ collects: [] }).apple.collectsData, false);
});

test("build fits each capture onto the exact store sizes and reports missing tablet sets", async () => {
  const { default: sharp } = await import("sharp");
  const repo = product({ captures: 0, tablet: true });
  for (const n of [1, 2])
    await sharp({ create: { width: 1179, height: 2556, channels: 4, background: "#336699" } })
      .png()
      .toFile(join(repo.dir, ".stackra/captures/app/en/phone", `0${n}.png`));
  const { problems, screenshots, out } = await buildStore(repo.dir, "app", {
    core: ROOT,
    template: repo.tpl,
  });
  assert.ok(problems.some((p) => /APP_IPAD_PRO_3GEN_129 en: 0 tablet captures/.test(p)));
  for (const [key, w, h] of [
    ["APP_IPHONE_67/en", 1290, 2796],
    ["phoneScreenshots/en", 1080, 1920],
  ]) {
    assert.equal(screenshots[key].length, 2);
    const meta = await sharp(screenshots[key][0]).metadata();
    assert.deepEqual([meta.width, meta.height, meta.hasAlpha], [w, h, false]);
  }
  assert.match(readFileSync(join(out, "privacy-answers.md"), "utf8"), /Data Not Collected/);
  assert.match(readFileSync(join(out, "checklist.md"), "utf8"), /- \[ \] APP_IPAD_PRO_3GEN_129/);
});

test("runway entry and assets/store: store locale codes, capability mapping, one privacy answer set", () => {
  const repo = product({
    locales: {
      en: {},
      ar: { "name.txt": "مثال", "privacy.yaml": stringify({ collects: [{ type: "name" }] }) },
    },
  });
  const { config, problems } = loadStore(repo.dir, "app", { core: ROOT, template: repo.tpl });
  assert.deepEqual([config.locales.ar.asc, config.locales.ar.play], ["ar-SA", "ar"]);
  assert.equal(config.locales.en.name, "Example"); // from runway identity.name when name.txt is absent
  assert.deepEqual(config.ios.capabilities, ["PUSH_NOTIFICATIONS", "IN_APP_PURCHASE"]); // camera needs none
  assert.ok(
    problems.some((x) => /privacy\.yaml differs from the other locales/.test(x)),
    problems.join("; "),
  );
  assert.deepEqual(loadStore(repo.dir, "shop", { core: ROOT }).problems, [
    "runway.yaml has no mobile.shop",
  ]);
});

test("eas-submit writes the product's ascAppId into the template checkout's eas.json, keeping the line's Play profile", async () => {
  const android = {
    serviceAccountKeyPath: "./.stackra/play-service-account.json",
    track: "internal",
  };
  const write = (repo) =>
    writeFileSync(
      join(repo.tpl, "eas.json"),
      JSON.stringify({ submit: { production: { android } } }),
    );
  let out = "";
  const missing = product();
  write(missing);
  assert.equal(await main(["eas-submit", ...missing.args], { write: (t) => (out += t) }), 1);
  assert.match(out, /ascAppId is missing/);

  const repo = product({ ascAppId: 6_450_000_000 });
  write(repo);
  assert.equal(await main(["eas-submit", ...repo.args], { write: () => {} }), 0);
  const eas = JSON.parse(readFileSync(join(repo.tpl, "eas.json"), "utf8"));
  assert.deepEqual(eas.submit.production, { android, ios: { ascAppId: "6450000000" } });
});
