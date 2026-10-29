/**
 * Stackra file contract:
 * Purpose: the App Store Connect API client the releaser drives (ADR 0480): bundle ids and capabilities, the app
 *   record lookup, version metadata and review details, screenshot sets, TestFlight groups and beta review, and
 *   submit for review. Idempotent: every `ensure*` reads first and writes only what differs.
 * Boundary: api.appstoreconnect.apple.com through `store-http.mjs`. Not in the public API, so not here: creating the
 *   first app record, app group identifiers and the App Privacy answers (browser steps with the owner signed in).
 * Runtime: node
 * Governing contract: ADR 0480; Apple, App Store Connect API (REST, JSON:API).
 * Secrets: the API key (ASC_API_KEY_ID, ASC_API_ISSUER_ID, ASC_API_PRIVATE_KEY) and the review demo password reach
 *   this file as values from the environment and leave it only inside a request; never printed or returned.
 */
import { createHash, createPrivateKey, sign } from "node:crypto";
import { readFileSync } from "node:fs";
import { basename } from "node:path";

const BASE = "https://api.appstoreconnect.apple.com";
const b64url = (data) => Buffer.from(data).toString("base64url");

/** An ES256 JWT for the App Store Connect API (20 minutes, the maximum Apple accepts). */
export function ascToken({ keyId, issuerId, privateKey }, now = Date.now()) {
  const iat = Math.floor(now / 1000);
  const head = b64url(JSON.stringify({ alg: "ES256", kid: keyId, typ: "JWT" }));
  const body = b64url(
    JSON.stringify({ iss: issuerId, iat, exp: iat + 1200, aud: "appstoreconnect-v1" }),
  );
  const sig = sign("sha256", Buffer.from(`${head}.${body}`), {
    key: createPrivateKey(privateKey),
    dsaEncoding: "ieee-p1363",
  });
  return `${head}.${body}.${b64url(sig)}`;
}

/** Credentials from the environment, or null (a dry run needs none). */
export function ascCredentials(env = process.env) {
  const {
    ASC_API_KEY_ID: keyId,
    ASC_API_ISSUER_ID: issuerId,
    ASC_API_PRIVATE_KEY: privateKey,
  } = env;
  return keyId && issuerId && privateKey ? { keyId, issuerId, privateKey } : null;
}

const rel = (type, id) => ({ data: { type, id } });

/** The client. `credentials` may be null in a dry run or a replay. */
export function createAsc({ transport, credentials, now = Date.now }) {
  const auth = () => (credentials ? `Bearer ${ascToken(credentials, now())}` : "Bearer dry-run");
  const api = async (method, path, body) =>
    (
      await transport.call({
        method,
        url: path.startsWith("https://") ? path : BASE + path,
        headers: { authorization: auth(), "content-type": "application/json" },
        body: body && JSON.stringify(body),
      })
    ).json ?? {};
  const list = async (path) => (await api("GET", path)).data ?? [];
  const write = (method, path, type, attributes, relationships, id) =>
    api(method, path, { data: { type, ...(id && { id }), attributes, relationships } });

  return {
    /** The bundle id resource, created when missing. */
    async ensureBundleId({ identifier, name, platform = "IOS" }) {
      const found = (
        await list(`/v1/bundleIds?filter[identifier]=${encodeURIComponent(identifier)}`)
      ).find((b) => b.attributes?.identifier === identifier);
      if (found) return { id: found.id, created: false };
      const made = await write("POST", "/v1/bundleIds", "bundleIds", {
        identifier,
        name,
        platform,
      });
      return { id: made.data.id, created: true };
    },

    /** Enables each capability type (`PUSH_NOTIFICATIONS`, `APP_GROUPS`, …) not yet on the bundle id. */
    async ensureCapabilities(bundleIdId, capabilityTypes) {
      const have = new Set(
        (await list(`/v1/bundleIds/${bundleIdId}/bundleIdCapabilities`)).map(
          (c) => c.attributes?.capabilityType,
        ),
      );
      const added = [];
      for (const capabilityType of capabilityTypes.filter((c) => !have.has(c))) {
        await write(
          "POST",
          "/v1/bundleIdCapabilities",
          "bundleIdCapabilities",
          { capabilityType },
          { bundleId: rel("bundleIds", bundleIdId) },
        );
        added.push(capabilityType);
      }
      return added;
    },

    /** The app record for a bundle id, or null: the first record is a browser step. */
    async findApp(bundleId) {
      const [app] = await list(`/v1/apps?filter[bundleId]=${encodeURIComponent(bundleId)}`);
      return app ? { id: app.id } : null;
    },

    /** The editable App Store version `versionString`, created when missing. */
    async ensureVersion(appId, versionString, platform = "IOS") {
      const [v] = await list(
        `/v1/apps/${appId}/appStoreVersions?filter[versionString]=${encodeURIComponent(versionString)}&filter[platform]=${platform}`,
      );
      if (v) return { id: v.id, created: false };
      const made = await write(
        "POST",
        "/v1/appStoreVersions",
        "appStoreVersions",
        { platform, versionString },
        { app: rel("apps", appId) },
      );
      return { id: made.data.id, created: true };
    },

    /** App-level (name, subtitle, privacy URL) and version-level (description…) text per locale. Returns locale → version localization id. */
    async syncLocalizations(appId, versionId, locales) {
      const [info] = await list(`/v1/apps/${appId}/appInfos`);
      const infoLocs = info ? await list(`/v1/appInfos/${info.id}/appInfoLocalizations`) : [];
      const verLocs = await list(`/v1/appStoreVersions/${versionId}/appStoreVersionLocalizations`);
      const ids = {};
      for (const [locale, l] of Object.entries(locales)) {
        const appText = {
          name: l.name,
          subtitle: l.subtitle,
          privacyPolicyUrl: l.privacyPolicyUrl,
        };
        const verText = {
          description: l.description,
          keywords: l.keywords,
          promotionalText: l.promotionalText,
          whatsNew: l.whatsNew,
          supportUrl: l.supportUrl,
          marketingUrl: l.marketingUrl,
        };
        const ai = infoLocs.find((x) => x.attributes?.locale === locale);
        if (ai)
          await write(
            "PATCH",
            `/v1/appInfoLocalizations/${ai.id}`,
            "appInfoLocalizations",
            appText,
            undefined,
            ai.id,
          );
        else if (info)
          await write(
            "POST",
            "/v1/appInfoLocalizations",
            "appInfoLocalizations",
            { locale, ...appText },
            { appInfo: rel("appInfos", info.id) },
          );
        const vi = verLocs.find((x) => x.attributes?.locale === locale);
        if (vi) {
          // whatsNew is refused on a first version; Apple answers 409 if it is sent there.
          await write(
            "PATCH",
            `/v1/appStoreVersionLocalizations/${vi.id}`,
            "appStoreVersionLocalizations",
            verText,
            undefined,
            vi.id,
          );
          ids[locale] = vi.id;
        } else {
          const made = await write(
            "POST",
            "/v1/appStoreVersionLocalizations",
            "appStoreVersionLocalizations",
            { locale, ...verText },
            { appStoreVersion: rel("appStoreVersions", versionId) },
          );
          ids[locale] = made.data.id;
        }
      }
      return ids;
    },

    /** Review contact, notes and the demo account (values from the environment, sent blind). */
    async setReviewDetail(versionId, attributes) {
      const current = (await api("GET", `/v1/appStoreVersions/${versionId}/appStoreReviewDetail`))
        .data;
      if (current?.id)
        return write(
          "PATCH",
          `/v1/appStoreReviewDetails/${current.id}`,
          "appStoreReviewDetails",
          attributes,
          undefined,
          current.id,
        );
      return write("POST", "/v1/appStoreReviewDetails", "appStoreReviewDetails", attributes, {
        appStoreVersion: rel("appStoreVersions", versionId),
      });
    },

    /** Replaces the screenshot set `displayType` of one version localization with `files`, in order. */
    async replaceScreenshots(localizationId, displayType, files) {
      const sets = await list(
        `/v1/appStoreVersionLocalizations/${localizationId}/appScreenshotSets`,
      );
      let set = sets.find((s) => s.attributes?.screenshotDisplayType === displayType);
      if (!set)
        set = (
          await write(
            "POST",
            "/v1/appScreenshotSets",
            "appScreenshotSets",
            { screenshotDisplayType: displayType },
            { appStoreVersionLocalization: rel("appStoreVersionLocalizations", localizationId) },
          )
        ).data;
      for (const old of await list(`/v1/appScreenshotSets/${set.id}/appScreenshots`))
        await api("DELETE", `/v1/appScreenshots/${old.id}`);
      for (const file of files) {
        const bytes = readFileSync(file);
        const reserved = (
          await write(
            "POST",
            "/v1/appScreenshots",
            "appScreenshots",
            { fileName: basename(file), fileSize: bytes.length },
            { appScreenshotSet: rel("appScreenshotSets", set.id) },
          )
        ).data;
        for (const op of reserved.attributes?.uploadOperations ?? [])
          await transport.call({
            method: op.method,
            url: op.url,
            headers: Object.fromEntries((op.requestHeaders ?? []).map((h) => [h.name, h.value])),
            body: bytes.subarray(op.offset, op.offset + op.length),
          });
        await write(
          "PATCH",
          `/v1/appScreenshots/${reserved.id}`,
          "appScreenshots",
          { uploaded: true, sourceFileChecksum: createHash("md5").update(bytes).digest("hex") },
          undefined,
          reserved.id,
        );
      }
      return { setId: set.id, count: files.length };
    },

    /** The processed build with this build number, or null. */
    async findBuild(appId, buildNumber) {
      const [b] = await list(
        `/v1/builds?filter[app]=${appId}&filter[version]=${encodeURIComponent(buildNumber)}`,
      );
      return b ? { id: b.id, state: b.attributes?.processingState } : null;
    },

    /** TestFlight: export compliance, the named beta groups, and beta review when an external group is named. */
    async distributeBuild(appId, buildId, { groups = [], usesNonExemptEncryption = false }) {
      await write(
        "PATCH",
        `/v1/builds/${buildId}`,
        "builds",
        { usesNonExemptEncryption },
        undefined,
        buildId,
      );
      const all = await list(`/v1/apps/${appId}/betaGroups`);
      const picked = groups.map((name) => {
        const g = all.find((x) => x.attributes?.name === name);
        if (!g) throw new Error(`TestFlight group "${name}" does not exist`);
        return g;
      });
      for (const g of picked)
        await api("POST", `/v1/betaGroups/${g.id}/relationships/builds`, {
          data: [{ type: "builds", id: buildId }],
        });
      if (picked.some((g) => !g.attributes?.isInternalGroup))
        await write(
          "POST",
          "/v1/betaAppReviewSubmissions",
          "betaAppReviewSubmissions",
          {},
          { build: rel("builds", buildId) },
        );
      return picked.map((g) => g.attributes.name);
    },

    /** Attaches the build to the version and submits it for App Review. The owner-approved step. */
    async submitForReview(appId, versionId, buildId, platform = "IOS") {
      await api(
        "PATCH",
        `/v1/appStoreVersions/${versionId}/relationships/build`,
        rel("builds", buildId),
      );
      const sub = (
        await write(
          "POST",
          "/v1/reviewSubmissions",
          "reviewSubmissions",
          { platform },
          { app: rel("apps", appId) },
        )
      ).data;
      await write("POST", "/v1/reviewSubmissionItems", "reviewSubmissionItems", undefined, {
        reviewSubmission: rel("reviewSubmissions", sub.id),
        appStoreVersion: rel("appStoreVersions", versionId),
      });
      await write(
        "PATCH",
        `/v1/reviewSubmissions/${sub.id}`,
        "reviewSubmissions",
        { submitted: true },
        undefined,
        sub.id,
      );
      return { submissionId: sub.id };
    },
  };
}
