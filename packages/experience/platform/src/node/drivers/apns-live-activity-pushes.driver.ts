/**
 * Stackra file contract:
 * Purpose: `ApnsLiveActivityPushesDriver`, the `apns` `LiveActivityPushes` driver: one APNs `liveactivity` push over
 *          HTTP/2 with a token-based (ES256 JWT) provider authorisation, to `<apnsBundleId>.push-type.liveactivity`.
 * Boundary: Node only (`node:http2`; APNs refuses HTTP/1.1). The signing key is the platform secrets `APNS_KEY_ID`,
 *           `APNS_TEAM_ID` and `APNS_PRIVATE_KEY` (the `.p8` PEM), read by name and never logged. The JWT is reused for
 *           50 minutes, since APNs refuses one renewed more often than every 20. HTTP 410 and `BadDeviceToken` resolve
 *           `gone`; any other refusal throws with APNs' reason. An end is dismissed after `endedDismissal`.
 * Runtime: node
 * Governing contract: Apple, "Sending notification requests to APNs" and "Establishing a token-based connection to
 *                     APNs"; ADR 0173 (secrets); ADR 0294 (decision 17: dependencies by type); STA-1539.
 */
import { sign } from "node:crypto";
import { connect } from "node:http2";

import type { SecretStore } from "@stackra/config/contracts";
import { Driver } from "@stackra/container";
import { Duration } from "@stackra/contracts";

import type { LiveActivityConfig } from "#config/live-activity.config";
import { LiveActivityPushes } from "#contracts/ports/live-activity-pushes.port";
import type { ActivityProgress } from "#contracts/types/activity-progress.type";
import { liveActivityPushPayload } from "#core/functions/live-activity-push-payload.function";

/** How long a provider JWT is reused: under APNs' one-hour expiry, over its 20-minute renewal floor. */
const TOKEN_LIFETIME_MS = 50 * 60 * 1000;

/** `value` as JSON, base64url-encoded: one JWT segment. */
const segment = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");

/**
 * Live Activity pushes through APNs.
 *
 * @example
 * // generated wiring, node target
 * { port: LiveActivityPushes, candidates: { apns: () => import("@stackra/platform/node").then((m) => m.ApnsLiveActivityPushesDriver) } }
 */
export class ApnsLiveActivityPushesDriver extends Driver(LiveActivityPushes) {
  /** The Live Activity configuration (`apnsBundleId`, `apnsEnvironment`, `endedDismissal`). */
  private readonly config: LiveActivityConfig;

  /** The platform secrets holding the APNs signing key. */
  private readonly secrets: SecretStore;

  /** The provider JWT now in use and when it was issued. */
  private jwt: { readonly value: string; readonly issuedAt: number } | undefined;

  /**
   * @param config - the Live Activity configuration.
   * @param secrets - the secret store.
   */
  constructor(config: LiveActivityConfig, secrets: SecretStore) {
    super();
    this.config = config;
    this.secrets = secrets;
  }

  /** Pushes `progress` to `token`; `gone` when APNs reports the token dead. */
  async send(
    token: string,
    event: "start" | "update" | "end",
    progress: ActivityProgress,
  ): Promise<"sent" | "gone"> {
    if (!/^[0-9a-f]+$/i.test(token)) throw new TypeError("An APNs token is hexadecimal");
    const bundleId = this.config.apnsBundleId;
    if (bundleId === null) throw new TypeError("platform.liveActivity.apnsBundleId is not set");
    const now = new Date();
    const dismissAt = new Date(now.getTime() + Duration.toMilliseconds(this.config.endedDismissal));
    const body = JSON.stringify(liveActivityPushPayload(event, progress, now, dismissAt));
    const { status, reason } = await this.post(token, body, {
      authorization: `bearer ${this.authorization(now.getTime())}`,
      "apns-push-type": "liveactivity",
      "apns-topic": `${bundleId}.push-type.liveactivity`,
      "apns-priority": "10",
      "content-type": "application/json",
    });
    if (status === 200) return "sent";
    if (status === 410 || reason === "BadDeviceToken") return "gone";
    throw new Error(`APNs refused the Live Activity push: ${status} ${reason ?? ""}`.trim());
  }

  /** The provider JWT, renewed once it is 50 minutes old. */
  private authorization(now: number): string {
    if (this.jwt && now - this.jwt.issuedAt < TOKEN_LIFETIME_MS) return this.jwt.value;
    const unsigned = `${segment({ alg: "ES256", kid: this.secret("APNS_KEY_ID") })}.${segment({
      iss: this.secret("APNS_TEAM_ID"),
      iat: Math.floor(now / 1000),
    })}`;
    const signature = sign("sha256", Buffer.from(unsigned), {
      key: this.secret("APNS_PRIVATE_KEY"),
      dsaEncoding: "ieee-p1363",
    }).toString("base64url");
    this.jwt = { value: `${unsigned}.${signature}`, issuedAt: now };
    return this.jwt.value;
  }

  // shortcut: one HTTP/2 connection per push; keep a session open per environment when push volume grows.
  /** One POST to APNs; resolves its status and the reason APNs gave. */
  private post(
    token: string,
    body: string,
    headers: Readonly<Record<string, string>>,
  ): Promise<{ readonly status: number; readonly reason: string | undefined }> {
    const origin =
      this.config.apnsEnvironment === "sandbox"
        ? "https://api.sandbox.push.apple.com"
        : "https://api.push.apple.com";
    return new Promise((resolve, reject) => {
      const session = connect(origin);
      session.on("error", reject);
      const request = session.request({
        ":method": "POST",
        ":path": `/3/device/${token}`,
        ...headers,
      });
      let status = 0;
      let answer = "";
      request.setEncoding("utf8");
      request.on("response", (response) => {
        status = Number(response[":status"]);
      });
      request.on("data", (chunk: string) => {
        answer += chunk;
      });
      request.on("end", () => {
        session.close();
        resolve({ status, reason: readReason(answer) });
      });
      request.on("error", (error) => {
        session.close();
        reject(error);
      });
      request.end(body);
    });
  }

  /** The named secret; throws when the host has not set it. */
  private secret(name: string): string {
    const value = this.secrets.get(name);
    if (value === undefined || value === "") throw new TypeError(`The secret ${name} is not set`);
    return value;
  }
}

/** The `reason` of an APNs error body, or `undefined` when there is none. */
function readReason(answer: string): string | undefined {
  try {
    const parsed: unknown = JSON.parse(answer);
    return typeof parsed === "object" && parsed !== null && "reason" in parsed
      ? String(parsed.reason)
      : undefined;
  } catch {
    return undefined;
  }
}
