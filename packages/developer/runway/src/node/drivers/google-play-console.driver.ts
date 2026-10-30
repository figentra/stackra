/**
 * Stackra file contract:
 * Purpose: `GooglePlayConsoleDriver`, the Google Play Developer API driver of the `PlayConsole` port: opens an edit on
 *          the package, reads its tracks to tell whether any release exists, and deletes the edit again, so nothing
 *          changes on Play.
 * Boundary: `fetch` and `node:crypto` only. Signs in as the root kit's service account
 *           (`GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`, read from the job's environment per call) with an RS256 grant; the
 *           access token is used for this call only. A package Play does not know answers 404, which is `null`.
 * Runtime: node
 * Governing contract: ADR 0482 (decisions 4 and 8), ADR 0480 (decisions 1 and 3), ADR 0173.
 */
import { createPrivateKey, sign } from "node:crypto";

import { Driver } from "@stackra/container";

import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { PlayConsole } from "#core/ports/play-console.port";
import type { PlayApp } from "#core/types/play-app.type";
import { requestJson } from "#node/functions/request-json.function";
import { secretOf } from "#node/functions/secret-of.function";

/** The Play Developer API. */
const BASE = "https://androidpublisher.googleapis.com/androidpublisher/v3/applications";

/** The scope the token asks for. */
const SCOPE = "https://www.googleapis.com/auth/androidpublisher";

/** `value` as base64url JSON, a JWT segment. */
function base64url(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

/**
 * Google Play through its API.
 *
 * @example
 * const play = new GooglePlayConsoleDriver();
 * await play.findApp("com.figentra.commerce.staff"); // { hasRelease: true }
 */
export class GooglePlayConsoleDriver extends Driver(PlayConsole) {
  /** The job's environment; a test replaces it. */
  env: Readonly<Record<string, string | undefined>> = process.env;

  /** `fetch`; a test replaces it. */
  fetch: typeof fetch = globalThis.fetch;

  /** The clock, in milliseconds; a test replaces it. */
  now: () => number = Date.now;

  /** Whether Play has the app, and whether a track has a release. */
  override async findApp(packageName: string): Promise<PlayApp | null> {
    const headers = { authorization: `Bearer ${await this.token()}` };
    const app = `${BASE}/${encodeURIComponent(packageName)}`;
    const edit = await requestJson(this.fetch, {
      what: "Google Play: open an edit",
      method: "POST",
      url: `${app}/edits`,
      headers,
      body: {},
      accept: [404],
    });
    if (edit.status === 404) return null;
    const id = String(edit.body["id"]);
    try {
      const tracks = await requestJson(this.fetch, {
        what: "Google Play: read tracks",
        method: "GET",
        url: `${app}/edits/${id}/tracks`,
        headers,
      });
      const list = Array.isArray(tracks.body["tracks"])
        ? (tracks.body["tracks"] as { releases?: unknown }[])
        : [];
      const hasRelease = list.some(
        (track) =>
          Array.isArray(track.releases) &&
          (track.releases as { versionCodes?: unknown }[]).some(
            (release) => Array.isArray(release.versionCodes) && release.versionCodes.length > 0,
          ),
      );
      return { hasRelease };
    } finally {
      await requestJson(this.fetch, {
        what: "Google Play: close the edit",
        method: "DELETE",
        url: `${app}/edits/${id}`,
        headers,
        accept: [404],
      });
    }
  }

  /** An access token for the service account. */
  private async token(): Promise<string> {
    let account: { client_email?: unknown; private_key?: unknown; token_uri?: unknown };
    try {
      account = JSON.parse(
        secretOf(this.env, "GOOGLE_PLAY_SERVICE_ACCOUNT_JSON"),
      ) as typeof account;
    } catch (error) {
      if (error instanceof RunwayUnresolvedError) throw error;
      throw new RunwayUnresolvedError(
        "GOOGLE_PLAY_SERVICE_ACCOUNT_JSON is not a service account key (JSON)",
      );
    }
    const audience =
      typeof account.token_uri === "string"
        ? account.token_uri
        : "https://oauth2.googleapis.com/token";
    const issuedAt = Math.floor(this.now() / 1000);
    const unsigned = `${base64url({ alg: "RS256", typ: "JWT" })}.${base64url({
      iss: account.client_email,
      scope: SCOPE,
      aud: audience,
      iat: issuedAt,
      exp: issuedAt + 3600,
    })}`;
    const signature = sign(
      "sha256",
      Buffer.from(unsigned),
      createPrivateKey(String(account.private_key)),
    );
    const response = await this.fetch(audience, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: `${unsigned}.${signature.toString("base64url")}`,
      }),
    });
    const body = (await response.json().catch(() => ({}))) as { access_token?: unknown };
    if (!response.ok || typeof body.access_token !== "string")
      throw new RunwayUnresolvedError(
        `Google Play: sign in as the service account: HTTP ${response.status}`,
      );
    return body.access_token;
  }
}
