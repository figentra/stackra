#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: `pnpm store`, the releaser's one command (ADR 0480). Every step reads the app's `store/` source of truth:
 *     build                      check store/ and generate screenshots, privacy answers and the checklist
 *     ios [--build N]            bundle id, capabilities, version, metadata, review details, screenshots; with
 *                                --build, TestFlight (export compliance, groups, beta review)
 *     android [--version-code N] listing, screenshots; with --version-code, a release on --track (default internal)
 *     review seed|probe          seed the review demo account, then sign in with it on production and see data
 *     submit                     iOS: attach --build to the version and submit for App Review   (owner approval)
 *     promote                    Android: move --version-code to the production track          (owner approval)
 *   Flags: --app <dir> (default apps/mobile), --version <x.y.z>, --dry-run (default) | --live | --record,
 *   --fixtures <dir> (dry-run reads answers from it; record writes them), --replay (tests).
 * Boundary: the store APIs through store-http.mjs. --live and --record run only in GitHub Actions; `submit` and
 *   `promote` only in the `store-production` environment, whose required reviewer is the owner.
 * Runtime: node
 * Governing contract: ADR 0480; ADR 0257 (nobody reads a value).
 * Secrets: ASC_API_*, GOOGLE_PLAY_SERVICE_ACCOUNT_JSON and the secrets store.yaml names come from the environment
 *   (Infisical over OIDC in CI) and leave only inside a request. Output is step names, resource ids and counts.
 */
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { ascCredentials, createAsc } from "./store-asc.mjs";
import { TARGETS, buildStore } from "./store-build.mjs";
import { assertLiveAllowed, createTransport } from "./store-http.mjs";
import { createPlay, playCredentials } from "./store-play.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const USAGE =
  "usage: pnpm store build|ios|android|review seed|review probe|submit|promote [--app dir] [--version v] [--build n] [--version-code n] [--dry-run|--live|--record] [--fixtures dir]";
const APPROVED_ENV = "store-production";

/** Fails unless this run may do an owner-approved step. */
export function assertApproved(mode, env = process.env) {
  if (mode === "dry-run" || mode === "replay") return;
  if (env.STORE_ENVIRONMENT !== APPROVED_ENV)
    throw new Error(`this step runs only in the ${APPROVED_ENV} environment (one owner approval)`);
}

const secret = (env, name, what) => {
  if (!name) return undefined;
  const v = env[name];
  if (v === undefined) throw new Error(`${what}: ${name} is not set in this environment`);
  return v;
};

async function ios({ asc, config, o, say, env, shots }) {
  const { bundleId, name, capabilities = [], testflight = {} } = config.ios;
  const b = await asc.ensureBundleId({
    identifier: bundleId,
    name: name ?? config.locales[Object.keys(config.locales)[0]].name,
  });
  say(`bundle id ${bundleId}: ${b.created ? "created" : "exists"}`);
  const added = await asc.ensureCapabilities(b.id, capabilities);
  say(`capabilities: ${added.length ? `added ${added.join(", ")}` : "up to date"}`);
  const app = await asc.findApp(bundleId);
  if (!app) {
    say("app record: missing; create it in App Store Connect (browser step), then re-run");
    return 1;
  }
  if (!o.version) throw new Error("--version is required");
  const v = await asc.ensureVersion(app.id, o.version);
  say(`version ${o.version}: ${v.created ? "created" : "exists"}`);
  const locales = Object.fromEntries(
    Object.entries(config.locales).map(([k, l]) => [
      k,
      {
        ...l,
        privacyPolicyUrl: config.urls.privacyPolicy,
        supportUrl: config.urls.support,
        marketingUrl: config.urls.marketing,
      },
    ]),
  );
  const locIds = await asc.syncLocalizations(app.id, v.id, locales);
  say(`metadata: ${Object.keys(locIds).length} locales`);
  const r = config.review ?? {};
  await asc.setReviewDetail(v.id, {
    contactFirstName: r.contact?.firstName,
    contactLastName: r.contact?.lastName,
    contactEmail: secret(env, r.contact?.emailSecret, "review contact"),
    contactPhone: secret(env, r.contact?.phoneSecret, "review contact"),
    demoAccountRequired: Boolean(r.demoAccount),
    demoAccountName: secret(env, r.demoAccount?.usernameSecret, "demo account"),
    demoAccountPassword: secret(env, r.demoAccount?.passwordSecret, "demo account"),
    notes: r.notes,
  });
  say("review details: set");
  for (const t of TARGETS.filter((x) => x.store === "ios"))
    for (const [locale, id] of Object.entries(locIds)) {
      const files = shots[`${t.id}/${locale}`];
      if (!files) continue;
      await asc.replaceScreenshots(id, t.id, files);
      say(`screenshots ${t.id} ${locale}: ${files.length}`);
    }
  if (o.build) {
    const build = await asc.findBuild(app.id, o.build);
    if (!build) {
      say(`build ${o.build}: not processed yet; re-run when EAS submit has finished`);
      return 1;
    }
    const groups = await asc.distributeBuild(app.id, build.id, {
      groups: testflight.groups ?? [],
      usesNonExemptEncryption: config.ios.usesNonExemptEncryption ?? false,
    });
    say(`TestFlight build ${o.build}: ${groups.join(", ") || "no groups"}`);
  }
  return 0;
}

async function android({ play, config, o, say, shots }) {
  return play.withEdit(async (edit) => {
    for (const [locale, l] of Object.entries(config.locales)) {
      await edit.setListing(locale, {
        title: l.playTitle ?? l.name,
        shortDescription: l.shortDescription ?? l.subtitle,
        fullDescription: l.description,
      });
      for (const t of TARGETS.filter((x) => x.store === "android")) {
        const files = shots[`${t.id}/${locale}`];
        if (files)
          say(`screenshots ${t.id} ${locale}: ${await edit.replaceImages(locale, t.id, files)}`);
      }
    }
    say(`listing: ${Object.keys(config.locales).length} locales`);
    if (o["version-code"]) {
      const notes = Object.fromEntries(
        Object.entries(config.locales).flatMap(([k, l]) => (l.whatsNew ? [[k, l.whatsNew]] : [])),
      );
      await edit.setTrack(o.track, { versionCodes: [o["version-code"]], name: o.version, notes });
      say(`track ${o.track}: version code ${o["version-code"]}`);
    }
    return 0;
  });
}

/** Seeds (optional) and probes the review demo account. Prints only step results. */
export async function review(action, { config, transport, env, say }) {
  const r = config.review ?? {};
  if (action === "seed") {
    if (!r.seed?.url) throw new Error("store.yaml has no review.seed.url");
    const res = await transport.call({
      method: "POST",
      url: r.seed.url,
      headers: {
        authorization: `Bearer ${secret(env, r.seed.tokenSecret, "seed")}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(r.seed.body ?? { mode: "review" }),
    });
    say(`seed: HTTP ${res.status}`);
  }
  const p = r.probe;
  if (!p?.signIn?.url || !r.demoAccount)
    throw new Error("store.yaml has no review.probe.signIn.url or review.demoAccount");
  const signIn = await transport.call({
    method: "POST",
    url: p.signIn.url,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      [p.signIn.usernameField ?? "email"]: secret(
        env,
        r.demoAccount.usernameSecret,
        "demo account",
      ),
      [p.signIn.passwordField ?? "password"]: secret(
        env,
        r.demoAccount.passwordSecret,
        "demo account",
      ),
    }),
  });
  say(`probe sign-in: HTTP ${signIn.status}`);
  if (signIn.status >= 300) return 1;
  if (p.data?.url) {
    const token = signIn.json?.[p.signIn.tokenField ?? "token"];
    const data = await transport.call({
      method: "GET",
      url: p.data.url,
      headers: token ? { authorization: `Bearer ${token}` } : {},
    });
    const items = Array.isArray(data.json)
      ? data.json.length
      : Array.isArray(data.json?.items)
        ? data.json.items.length
        : data.json
          ? 1
          : 0;
    say(`probe data: HTTP ${data.status}, ${items} item(s)`);
    if (data.status >= 300 || items === 0) return 1;
  }
  return 0;
}

/** Runs the command; returns the exit code. Tests inject `transport`, `env` and `write`. */
export async function main(
  argv,
  { env = process.env, write = (s) => process.stdout.write(s), transport, root = ROOT } = {},
) {
  const say = (s) => write(`${s}\n`);
  let args;
  try {
    args = parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        app: { type: "string", default: "apps/mobile" },
        version: { type: "string" },
        build: { type: "string" },
        "version-code": { type: "string" },
        track: { type: "string", default: "internal" },
        fraction: { type: "string" },
        "dry-run": { type: "boolean" },
        live: { type: "boolean" },
        record: { type: "boolean" },
        replay: { type: "boolean" },
        fixtures: { type: "string" },
      },
    });
  } catch {
    say(USAGE);
    return 2;
  }
  const {
    values: o,
    positionals: [cmd, sub],
  } = args;
  const mode = o.replay ? "replay" : o.record ? "record" : o.live ? "live" : "dry-run";
  try {
    assertLiveAllowed(mode, env);
    const appDir = resolve(root, o.app);
    const built = await buildStore(appDir, {
      root,
      renderImages: cmd === "build" || mode !== "replay",
    });
    if (cmd === "build" || built.problems.length) {
      for (const p of built.problems) say(`problem: ${p}`);
      if (cmd === "build")
        say(
          `generated ${Object.keys(built.screenshots ?? {}).length} screenshot sets into ${built.out ?? "nothing"}`,
        );
      if (built.problems.length) return 1;
      if (cmd === "build") return 0;
    }
    const { config, screenshots: shots } = built;
    transport ??= createTransport({ mode, fixtures: o.fixtures && resolve(root, o.fixtures) });
    let code;
    if (cmd === "ios" || cmd === "submit") {
      if (!config.ios) throw new Error("store.yaml has no ios section");
      const asc = createAsc({
        transport,
        credentials: mode === "dry-run" ? null : ascCredentials(env),
      });
      if (cmd === "ios") code = await ios({ asc, config, o, say, env, shots });
      else {
        assertApproved(mode, env);
        if (!o.version || !o.build) throw new Error("submit needs --version and --build");
        const app = await asc.findApp(config.ios.bundleId);
        if (!app) throw new Error("app record is missing");
        const v = await asc.ensureVersion(app.id, o.version);
        const build = await asc.findBuild(app.id, o.build);
        if (!build) throw new Error(`build ${o.build} is not processed`);
        const { submissionId } = await asc.submitForReview(app.id, v.id, build.id);
        say(`submitted for review: ${submissionId}`);
        code = 0;
      }
    } else if (cmd === "android" || cmd === "promote") {
      if (!config.android) throw new Error("store.yaml has no android section");
      const play = createPlay({
        transport,
        credentials: mode === "dry-run" ? null : playCredentials(env),
        packageName: config.android.package,
      });
      if (cmd === "android") code = await android({ play, config, o, say, shots });
      else {
        assertApproved(mode, env);
        if (!o["version-code"]) throw new Error("promote needs --version-code");
        const fraction = o.fraction ? Number(o.fraction) : undefined;
        await play.withEdit((edit) =>
          edit.setTrack("production", {
            versionCodes: [o["version-code"]],
            name: o.version,
            status: fraction && fraction < 1 ? "inProgress" : "completed",
            userFraction: fraction && fraction < 1 ? fraction : undefined,
          }),
        );
        say(
          `production track: version code ${o["version-code"]}${fraction ? ` at ${fraction}` : ""}`,
        );
        code = 0;
      }
    } else if (cmd === "review" && (sub === "seed" || sub === "probe")) {
      if (sub === "seed") assertApproved(mode, env);
      code = await review(sub, { config, transport, env, say });
    } else {
      say(USAGE);
      return 2;
    }
    if (mode === "dry-run") {
      say(`dry run: ${transport.calls.length} call(s) planned, none sent`);
      for (const c of transport.calls) say(`  ${c.method} ${c.path}`);
    }
    return code;
  } catch (error) {
    say(`store: ${error.message}`);
    return 1;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url))
  process.exitCode = await main(process.argv.slice(2));
