/**
 * Stackra file contract:
 * Purpose: unit tests of `HttpUploaderDriver`: it asks the configured endpoint for a signed upload with the file's
 *          bucket, type and size, puts the bytes to the signed URL with the signed headers, returns the token, and
 *          turns every refusal, malformed answer and network failure into an `UploadFailedError`.
 * Boundary: test only; `fetch` is stubbed, so no request leaves the process.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0222 (decision 2).
 */
import { buildConfig } from "@stackra/config";
import { kindOf } from "@stackra/container";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { MediaConfig } from "#config/media.config";
import { HttpUploaderDriver } from "#core/drivers/http-uploader.driver";
import { UploadFailedError } from "#core/errors/upload-failed.error";
import { Uploader } from "#core/ports/uploader.port";

const TOKEN = { id: "upl_01jb3m0000000000000000000a" };

const SIGNED = {
  upload: TOKEN,
  url: "https://store.test/uploads/upl_01jb3m0000000000000000000a?X-Amz-Signature=abc",
  method: "PUT",
  headers: { "content-type": "image/png", "x-amz-meta-bucket": "catalogue.product_images" },
  expiresAt: "2026-10-24T10:00:00.000Z",
};

/** Answers each `fetch` call with the next of `responses`, recording every call. */
function stubFetch(...responses: (Response | Error)[]) {
  const calls: { url: string; init: RequestInit }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      const next = responses.shift();
      if (next === undefined || next instanceof Error) throw next ?? new Error("no answer");
      return next;
    }),
  );
  return calls;
}

/** An uploader asking `/api/uploads`. */
const uploader = () => new HttpUploaderDriver(buildConfig(MediaConfig));

const FILE = new Blob(["png"], { type: "image/png" });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("HttpUploaderDriver", () => {
  it("is a driver of Uploader", () => {
    expect(uploader()).toBeInstanceOf(Uploader);
    expect(kindOf(HttpUploaderDriver)).toEqual({ kind: "driver", options: { port: Uploader } });
  });

  it("asks for a signed upload, puts the bytes there and returns the token", async () => {
    const calls = stubFetch(Response.json(SIGNED), new Response(null, { status: 200 }));

    expect(await uploader().upload(FILE, "catalogue.product_images")).toEqual(TOKEN);

    const [ask, put] = calls;
    expect(ask?.url).toBe("/api/uploads");
    expect(ask?.init.method).toBe("POST");
    expect(ask?.init.credentials).toBe("include");
    expect(JSON.parse(String(ask?.init.body))).toEqual({
      bucket: "catalogue.product_images",
      mediaType: "image/png",
      size: 3,
    });
    expect(put?.url).toBe(SIGNED.url);
    expect(put?.init).toEqual({ method: "PUT", headers: SIGNED.headers, body: FILE });
  });

  it("sends a null bucket for the member's only bucket", async () => {
    const calls = stubFetch(Response.json(SIGNED), new Response(null, { status: 200 }));
    await uploader().upload(FILE, null);
    expect(JSON.parse(String(calls[0]?.init.body)).bucket).toBeNull();
  });

  it("asks the configured endpoint", async () => {
    const calls = stubFetch(Response.json(SIGNED), new Response(null, { status: 200 }));
    const custom = new HttpUploaderDriver(
      buildConfig(MediaConfig, { values: { uploadEndpoint: "https://api.test/commerce/uploads" } }),
    );
    await custom.upload(FILE, null);
    expect(calls[0]?.url).toBe("https://api.test/commerce/uploads");
  });

  it("refuses with the service's refusal code and puts nothing", async () => {
    const calls = stubFetch(
      Response.json({ code: "upload_rejected", category: "validation" }, { status: 400 }),
    );
    const refused = uploader().upload(FILE, null);
    await expect(refused).rejects.toBeInstanceOf(UploadFailedError);
    await expect(refused).rejects.toMatchObject({ status: 400, serviceCode: "upload_rejected" });
    expect(calls).toHaveLength(1);
  });

  it("refuses an answer that is not an error envelope with no service code", async () => {
    stubFetch(new Response("Bad gateway", { status: 502 }));
    await expect(uploader().upload(FILE, null)).rejects.toMatchObject({
      status: 502,
      serviceCode: null,
    });
  });

  it("refuses a malformed signed upload instead of trusting it", async () => {
    const calls = stubFetch(Response.json({ upload: { id: "../x" }, url: "", headers: {} }));
    await expect(uploader().upload(FILE, null)).rejects.toMatchObject({
      status: 200,
      serviceCode: null,
    });
    expect(calls).toHaveLength(1);
  });

  it("refuses when the store refuses the bytes", async () => {
    stubFetch(Response.json(SIGNED), new Response("SignatureDoesNotMatch", { status: 403 }));
    await expect(uploader().upload(FILE, null)).rejects.toMatchObject({
      code: "upload_failed",
      status: 403,
    });
  });

  it("turns a network failure into status 0, keeping the cause", async () => {
    const offline = new TypeError("Failed to fetch");
    stubFetch(offline);
    const failure = await uploader()
      .upload(FILE, null)
      .catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(UploadFailedError);
    expect(failure).toMatchObject({ status: 0, serviceCode: null });
    expect((failure as Error).cause).toBe(offline);
  });
});
