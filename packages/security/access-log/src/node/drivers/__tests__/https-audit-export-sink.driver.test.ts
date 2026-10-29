/**
 * Stackra file contract:
 * Purpose: unit tests of `HttpsAuditExportSinkDriver`: one NDJSON POST per batch with the bearer token when set and
 *          none when not; an unset endpoint, a network failure and a non-2xx answer are `AuditExportFailedError`
 *          without the token.
 * Boundary: test only; `fetch` is stubbed, so nothing leaves the process.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; STA-1579.
 */
import { buildConfig } from "@stackra/config";
import { SecretStore } from "@stackra/config/contracts";
import { isRefusal } from "@stackra/errors";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { AccessLogConfig } from "#config/access-log.config";
import { AuditExportSink } from "#contracts/ports/audit-export-sink.port";
import { AuditExportFailedError } from "#core/errors/audit-export-failed.error";
import { HttpsAuditExportSinkDriver } from "#node/drivers/https-audit-export-sink.driver";

const URL = "https://siem.acme.example/ingest";
const BATCH = '{"id":"aud_1"}\n';

/** The driver over a config with `values`, and `token` as the `ACCESS_LOG_EXPORT_TOKEN` secret when given. */
const driverOf = (values: Partial<AccessLogConfig>, token?: string) => {
  const secrets = new (class extends SecretStore {
    get(name: string): string | undefined {
      return name === "ACCESS_LOG_EXPORT_TOKEN" ? token : undefined;
    }
  })();
  return new HttpsAuditExportSinkDriver(buildConfig(AccessLogConfig, { values, secrets }));
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe(HttpsAuditExportSinkDriver, () => {
  it("is an AuditExportSink driver", () => {
    expect(driverOf({ exportUrl: URL })).toBeInstanceOf(AuditExportSink);
  });

  it("posts the batch as NDJSON with the bearer token", async () => {
    const fetch = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetch);
    await driverOf({ exportUrl: URL }, "tok_1").push(BATCH);
    expect(fetch).toHaveBeenCalledWith(URL, {
      method: "POST",
      headers: { "content-type": "application/x-ndjson", authorization: "Bearer tok_1" },
      body: BATCH,
    });
  });

  it("sends no authorization header without a token", async () => {
    const fetch = vi.fn(async () => new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetch);
    await driverOf({ exportUrl: URL }).push(BATCH);
    expect(fetch).toHaveBeenCalledWith(URL, {
      method: "POST",
      headers: { "content-type": "application/x-ndjson" },
      body: BATCH,
    });
  });

  it("refuses an unset endpoint, a network failure and a non-2xx answer", async () => {
    await expect(driverOf({}).push(BATCH)).rejects.toSatisfy((error) =>
      isRefusal(error, AuditExportFailedError),
    );
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("offline");
      }),
    );
    await expect(driverOf({ exportUrl: URL }).push(BATCH)).rejects.toSatisfy((error) =>
      isRefusal(error, AuditExportFailedError),
    );
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("no", { status: 401 })),
    );
    const refused = await driverOf({ exportUrl: URL }, "tok_1")
      .push(BATCH)
      .catch((error: unknown) => error);
    expect(isRefusal(refused, AuditExportFailedError)).toBe(true);
    expect(JSON.stringify(refused)).not.toContain("tok_1");
  });
});
