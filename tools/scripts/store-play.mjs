/**
 * Stackra file contract:
 * Purpose: the Google Play Developer API client the releaser drives (ADR 0480): one edit per run, store listing text,
 *   screenshot sets, and track releases (internal, closed, production) with release notes, validated and committed.
 *   The app bundle itself is uploaded by `eas submit` (store-release.yml).
 * Boundary: androidpublisher.googleapis.com and oauth2.googleapis.com through `store-http.mjs`. Not here: creating
 *   the app, the first content-rating and target-audience forms (browser steps with the owner signed in).
 * Runtime: node
 * Governing contract: ADR 0480; Google Play Developer API v3 (edits).
 * Secrets: the service-account key (GOOGLE_PLAY_SERVICE_ACCOUNT_JSON) reaches this file as a value from the
 *   environment and leaves it only as a signed assertion; the access token stays in memory. Neither is printed.
 */
import { createPrivateKey, sign } from "node:crypto";
import { readFileSync } from "node:fs";

const API = "https://androidpublisher.googleapis.com/androidpublisher/v3/applications";
const UPLOAD = "https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications";
const SCOPE = "https://www.googleapis.com/auth/androidpublisher";
const b64url = (data) => Buffer.from(data).toString("base64url");
export const IMAGE_TYPES = ["phoneScreenshots", "sevenInchScreenshots", "tenInchScreenshots"];

/** The parsed service account from the environment, or null (a dry run needs none). */
export function playCredentials(env = process.env) {
  const raw = env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    const { client_email, private_key, token_uri } = JSON.parse(raw);
    return { clientEmail: client_email, privateKey: private_key, tokenUri: token_uri };
  } catch {
    // Never echo the parse error: it quotes the input.
    throw new Error("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON is not valid JSON");
  }
}

/** An RS256 assertion for the OAuth 2.0 JWT bearer grant (one hour). */
export function playAssertion({ clientEmail, privateKey, tokenUri }, now = Date.now()) {
  const iat = Math.floor(now / 1000);
  const head = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const body = b64url(
    JSON.stringify({ iss: clientEmail, scope: SCOPE, aud: tokenUri, iat, exp: iat + 3600 }),
  );
  const sig = sign("RSA-SHA256", Buffer.from(`${head}.${body}`), createPrivateKey(privateKey));
  return `${head}.${body}.${b64url(sig)}`;
}

/** The client for one package. `credentials` may be null in a dry run or a replay. */
export function createPlay({ transport, credentials, packageName, now = Date.now }) {
  let token;
  async function auth() {
    if (!credentials) return "Bearer dry-run";
    if (!token) {
      const r = await transport.call({
        method: "POST",
        url: credentials.tokenUri ?? "https://oauth2.googleapis.com/token",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
          assertion: playAssertion(credentials, now()),
        }).toString(),
      });
      token = r.json?.access_token ?? "dry-run";
    }
    return `Bearer ${token}`;
  }
  const api = async (method, path, body, { upload, type = "application/json" } = {}) =>
    (
      await transport.call({
        method,
        url: `${upload ? UPLOAD : API}/${packageName}${path}`,
        headers: { authorization: await auth(), "content-type": type },
        body: body === undefined || Buffer.isBuffer(body) ? body : JSON.stringify(body),
      })
    ).json ?? {};

  return {
    /** Opens an edit, runs `fn(edit)`, validates and commits it. A failure leaves the edit uncommitted (Play drops it). */
    async withEdit(fn) {
      const { id } = await api("POST", "/edits");
      const e = `/edits/${id}`;
      const edit = {
        id,
        getTrack: (track) => api("GET", `${e}/tracks/${track}`),
        /** One release on `track`: `status` completed | draft | inProgress (with `userFraction`) | halted. */
        setTrack: (track, { versionCodes, status = "completed", name, notes = {}, userFraction }) =>
          api("PUT", `${e}/tracks/${track}`, {
            track,
            releases: [
              {
                name,
                versionCodes: versionCodes.map(String),
                status,
                ...(userFraction !== undefined && { userFraction }),
                releaseNotes: Object.entries(notes).map(([language, text]) => ({ language, text })),
              },
            ],
          }),
        setListing: (language, { title, shortDescription, fullDescription }) =>
          api("PUT", `${e}/listings/${language}`, {
            language,
            title,
            shortDescription,
            fullDescription,
          }),
        /** Replaces every image of `imageType` for `language` with `files`, in order. */
        async replaceImages(language, imageType, files) {
          if (!IMAGE_TYPES.includes(imageType))
            throw new Error(`unknown Play image type ${imageType}`);
          await api("DELETE", `${e}/listings/${language}/${imageType}`);
          for (const f of files)
            await api(
              "POST",
              `${e}/listings/${language}/${imageType}?uploadType=media`,
              readFileSync(f),
              {
                upload: true,
                type: "image/png",
              },
            );
          return files.length;
        },
      };
      const result = await fn(edit);
      await api("POST", `${e}:validate`);
      await api("POST", `${e}:commit`);
      return result;
    },
  };
}
