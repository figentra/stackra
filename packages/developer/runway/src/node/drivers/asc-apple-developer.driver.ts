/**
 * Stackra file contract:
 * Purpose: `AscAppleDeveloperDriver`, the App Store Connect API driver of the `AppleDeveloper` port: finds and
 *          registers bundle ids, enables their capabilities and finds the app record of a bundle id, with an ES256
 *          token signed from the root kit's key.
 * Boundary: `fetch` and `node:crypto` only (no SDK). Reads `ASC_API_KEY_ID`, `ASC_API_ISSUER_ID` and
 *           `ASC_API_PRIVATE_KEY` from the job's environment per request; the token lives 20 minutes and is never kept
 *           or logged. ADR 0480's `tools/scripts/store-asc.mjs` moves onto this driver once it lands (owner Q2).
 * Runtime: node
 * Governing contract: ADR 0482 (decision 4), ADR 0480 (decisions 1 and 3), ADR 0173.
 */
import { createPrivateKey, sign } from "node:crypto";

import { Driver } from "@stackra/container";

import type { AppleCapability } from "#core/enums/apple-capability.enum";
import { AppleDeveloper } from "#core/ports/apple-developer.port";
import type { AppleBundle } from "#core/types/apple-bundle.type";
import { requestJson } from "#node/functions/request-json.function";
import { secretOf } from "#node/functions/secret-of.function";
import type { JsonAnswer } from "#node/types/json-answer.type";

/** The App Store Connect API. */
const BASE = "https://api.appstoreconnect.apple.com/v1";

/** The `data` list of an answer. */
function dataOf(answer: JsonAnswer): Record<string, unknown>[] {
  const data = answer.body["data"];
  return Array.isArray(data) ? (data as Record<string, unknown>[]) : [];
}

/** `value` as base64url JSON, a JWT segment. */
function base64url(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

/**
 * App Store Connect through its API.
 *
 * @example
 * const apple = new AscAppleDeveloperDriver();
 * await apple.findBundle("com.figentra.commerce.staff");
 */
export class AscAppleDeveloperDriver extends Driver(AppleDeveloper) {
  /** The job's environment; a test replaces it. */
  env: Readonly<Record<string, string | undefined>> = process.env;

  /** `fetch`; a test replaces it. */
  fetch: typeof fetch = globalThis.fetch;

  /** The clock, in milliseconds; a test replaces it. */
  now: () => number = Date.now;

  /** The bundle id resource and its capabilities, or `null`. */
  override async findBundle(identifier: string): Promise<AppleBundle | null> {
    const found = dataOf(
      await this.call(
        "find bundle id",
        "GET",
        `/bundleIds?filter[identifier]=${encodeURIComponent(identifier)}`,
      ),
    ).find(
      (item) =>
        (item["attributes"] as { identifier?: unknown } | undefined)?.identifier === identifier,
    );
    if (found === undefined) return null;
    const id = String(found["id"]);
    const capabilities = dataOf(
      await this.call("read capabilities", "GET", `/bundleIds/${id}/bundleIdCapabilities`),
    ).map(
      (item) => (item["attributes"] as { capabilityType?: unknown } | undefined)?.capabilityType,
    );
    return {
      id,
      capabilities: capabilities.filter(
        (type): type is AppleCapability => typeof type === "string",
      ),
    };
  }

  /** Registers an iOS bundle id. */
  override async registerBundle(identifier: string, name: string): Promise<string> {
    const answer = await this.call("register bundle id", "POST", "/bundleIds", {
      data: { type: "bundleIds", attributes: { identifier, name, platform: "IOS" } },
    });
    return String((answer.body["data"] as { id?: unknown } | undefined)?.id);
  }

  /** Enables one capability. */
  override async enableCapability(bundle: string, capability: AppleCapability): Promise<void> {
    await this.call(`enable ${capability}`, "POST", "/bundleIdCapabilities", {
      data: {
        type: "bundleIdCapabilities",
        attributes: { capabilityType: capability },
        relationships: { bundleId: { data: { type: "bundleIds", id: bundle } } },
      },
    });
  }

  /** The app record's id, or `null`. */
  override async findApp(identifier: string): Promise<string | null> {
    const [app] = dataOf(
      await this.call(
        "find app record",
        "GET",
        `/apps?filter[bundleId]=${encodeURIComponent(identifier)}`,
      ),
    );
    return app === undefined ? null : String(app["id"]);
  }

  /** One signed request. */
  private call(what: string, method: string, path: string, body?: unknown): Promise<JsonAnswer> {
    return requestJson(this.fetch, {
      what: `App Store Connect: ${what}`,
      method,
      url: `${BASE}${path}`,
      headers: { authorization: `Bearer ${this.token()}` },
      ...(body === undefined ? {} : { body }),
    });
  }

  /** An ES256 token for 20 minutes, the most Apple accepts. */
  private token(): string {
    const issuedAt = Math.floor(this.now() / 1000);
    const head = base64url({ alg: "ES256", kid: secretOf(this.env, "ASC_API_KEY_ID"), typ: "JWT" });
    const claims = base64url({
      iss: secretOf(this.env, "ASC_API_ISSUER_ID"),
      iat: issuedAt,
      exp: issuedAt + 1200,
      aud: "appstoreconnect-v1",
    });
    const signature = sign("sha256", Buffer.from(`${head}.${claims}`), {
      key: createPrivateKey(secretOf(this.env, "ASC_API_PRIVATE_KEY")),
      dsaEncoding: "ieee-p1363",
    });
    return `${head}.${claims}.${signature.toString("base64url")}`;
  }
}
