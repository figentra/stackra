/**
 * Stackra file contract:
 * Purpose: unit tests of `TusUploaderDriver`: it asks the configured endpoint for a resumable upload, starts it on the
 *          tus server with the service's headers and the file's length, sends the bytes in chunks of
 *          `media.tus.chunkBytes`, and after a failed request pauses, asks the server's offset and resumes from there;
 *          it never repeats the creation, gives up once the pauses run out without progress, and turns every refusal
 *          and malformed answer into an `UploadFailedError`.
 * Boundary: test only; `fetch` is stubbed, so no request leaves the process, and the retry pauses are 0 ms.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0222 (decision 2: tus uploads).
 */
import { buildConfig } from "@stackra/config";
import { kindOf } from "@stackra/container";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { MediaConfig } from "#config/media.config";
import { TusUploaderDriver } from "#core/drivers/tus-uploader.driver";
import { UploadFailedError } from "#core/errors/upload-failed.error";
import { Uploader } from "#core/ports/uploader.port";

const TOKEN = { id: "upl_01jb3m0000000000000000000a" };

const RESUMABLE = {
  upload: TOKEN,
  url: "https://uploads.test/files/",
  headers: {
    "tus-resumable": "1.0.0",
    "upload-metadata": "upload dXBsXzAxamIzbTAwMDAwMDAwMDAwMDAwMDAwMDBh",
  },
  expiresAt: "2026-10-24T10:00:00.000Z",
};

const LOCATION = "https://uploads.test/files/upl_01jb3m0000000000000000000a+mpu";

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

/** The tus server's answer to a creation. */
const created = (location = LOCATION) => new Response(null, { status: 201, headers: { location } });

/** The tus server's answer to a `PATCH` or `HEAD` at `offset`. */
const at = (offset: number, status = 204) =>
  new Response(null, { status, headers: { "upload-offset": String(offset) } });

/** A tus uploader sending chunks of `chunkBytes` with `retries` pauses of 0 ms. */
const uploader = (chunkBytes = 4, retries = 2) =>
  new TusUploaderDriver(
    buildConfig(MediaConfig, {
      values: {
        tus: {
          endpoint: RESUMABLE.url,
          chunkBytes,
          retryDelaysMs: Array.from({ length: retries }, () => 0),
        },
      },
    }),
  );

/** A 10-byte video. */
const FILE = new Blob(["0123456789"], { type: "video/mp4" });

/** The headers of a recorded request (none when it was not made). */
const headersOf = (init: RequestInit | undefined): Record<string, string> =>
  (init?.headers ?? {}) as Record<string, string>;

/** The text of a recorded request body. */
const textOf = async (init: RequestInit | undefined): Promise<string> =>
  init?.body instanceof Blob ? init.body.text() : String(init?.body);

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("TusUploaderDriver", () => {
  it("is a driver of Uploader", () => {
    expect(uploader()).toBeInstanceOf(Uploader);
    expect(kindOf(TusUploaderDriver)).toEqual({ kind: "driver", options: { port: Uploader } });
  });

  it("asks for a resumable upload, starts it and sends the bytes in chunks", async () => {
    const calls = stubFetch(Response.json(RESUMABLE), created(), at(4), at(8), at(10));

    expect(await uploader().upload(FILE, "library.videos")).toEqual(TOKEN);

    const [ask, start, ...patches] = calls;
    expect(ask?.url).toBe("/api/uploads/create-resumable");
    expect(ask?.init.method).toBe("POST");
    expect(ask?.init.credentials).toBe("include");
    expect(JSON.parse(String(ask?.init.body))).toEqual({
      bucket: "library.videos",
      mediaType: "video/mp4",
      size: 10,
    });
    expect(start?.url).toBe(RESUMABLE.url);
    expect(start?.init).toEqual({
      method: "POST",
      headers: { ...RESUMABLE.headers, "upload-length": "10" },
    });
    expect(start?.init.credentials).toBeUndefined();
    expect(
      patches.map((call) => [call.url, call.init.method, headersOf(call.init)["upload-offset"]]),
    ).toEqual([
      [LOCATION, "PATCH", "0"],
      [LOCATION, "PATCH", "4"],
      [LOCATION, "PATCH", "8"],
    ]);
    expect(await Promise.all(patches.map((call) => textOf(call.init)))).toEqual([
      "0123",
      "4567",
      "89",
    ]);
    expect(headersOf(patches[0]?.init)["content-type"]).toBe("application/offset+octet-stream");
  });

  it("asks the configured endpoint", async () => {
    const calls = stubFetch(Response.json(RESUMABLE), created(), at(10));
    const custom = new TusUploaderDriver(
      buildConfig(MediaConfig, {
        values: { resumableUploadEndpoint: "https://api.test/media/uploads/create-resumable" },
      }),
    );
    await custom.upload(FILE, null);
    expect(calls[0]?.url).toBe("https://api.test/media/uploads/create-resumable");
    expect(JSON.parse(String(calls[0]?.init.body)).bucket).toBeNull();
  });

  it("resolves a relative Location against the creation URL", async () => {
    const calls = stubFetch(Response.json(RESUMABLE), created("/files/upl_x+mpu"), at(10));
    await uploader(16).upload(FILE, null);
    expect(calls[2]?.url).toBe("https://uploads.test/files/upl_x+mpu");
  });

  it("resumes from the server's offset after a dropped request", async () => {
    const calls = stubFetch(
      Response.json(RESUMABLE),
      created(),
      at(4),
      new TypeError("network down"),
      at(6, 200),
      at(10),
    );

    expect(await uploader(4).upload(FILE, null)).toEqual(TOKEN);

    expect(calls.slice(2).map((call) => call.init.method)).toEqual([
      "PATCH",
      "PATCH",
      "HEAD",
      "PATCH",
    ]);
    const resumed = calls[5]?.init;
    expect(headersOf(resumed)["upload-offset"]).toBe("6");
    expect(await textOf(resumed)).toBe("6789");
    expect(headersOf(calls[4]?.init)["tus-resumable"]).toBe("1.0.0");
  });

  it.each([409, 423, 429, 460, 500, 503])("retries a %s answer", async (status) => {
    const calls = stubFetch(
      Response.json(RESUMABLE),
      created(),
      new Response(null, { status }),
      at(0, 200),
      at(10),
    );
    expect(await uploader(16).upload(FILE, null)).toEqual(TOKEN);
    expect(calls).toHaveLength(5);
  });

  it("gives up once the pauses run out without progress", async () => {
    const calls = stubFetch(
      Response.json(RESUMABLE),
      created(),
      new Response(null, { status: 503 }),
      at(0, 200),
      new Response(null, { status: 503 }),
      at(0, 200),
      new Response(null, { status: 503 }),
    );
    await expect(uploader(16).upload(FILE, null)).rejects.toMatchObject({
      code: "upload_failed",
      status: 503,
    });
    expect(calls).toHaveLength(7);
  });

  it("gets a fresh set of pauses after progress", async () => {
    const calls = stubFetch(
      Response.json(RESUMABLE),
      created(),
      new Response(null, { status: 503 }),
      at(4, 200),
      at(8),
      new Response(null, { status: 503 }),
      at(8, 200),
      at(10),
    );
    expect(await uploader(4, 1).upload(FILE, null)).toEqual(TOKEN);
    expect(calls).toHaveLength(8);
  });

  it("never repeats the creation: a failed start is a refusal", async () => {
    const calls = stubFetch(Response.json(RESUMABLE), new Response(null, { status: 404 }));
    await expect(uploader().upload(FILE, null)).rejects.toMatchObject({ status: 404 });
    expect(calls).toHaveLength(2);

    const offline = stubFetch(Response.json(RESUMABLE), new TypeError("offline"));
    await expect(uploader().upload(FILE, null)).rejects.toMatchObject({ status: 0 });
    expect(offline).toHaveLength(2);
  });

  it("refuses a start without a Location", async () => {
    stubFetch(Response.json(RESUMABLE), new Response(null, { status: 201 }));
    await expect(uploader().upload(FILE, null)).rejects.toMatchObject({ status: 201 });
  });

  it("refuses a tus answer that is not worth a retry", async () => {
    const calls = stubFetch(
      Response.json(RESUMABLE),
      created(),
      new Response(null, { status: 404 }),
    );
    await expect(uploader().upload(FILE, null)).rejects.toMatchObject({
      status: 404,
      serviceCode: null,
    });
    expect(calls).toHaveLength(3);
  });

  it.each([
    ["a missing offset", new Response(null, { status: 204 })],
    [
      "a malformed offset",
      new Response(null, { status: 204, headers: { "upload-offset": "4.5" } }),
    ],
    ["an offset that does not move", at(0)],
    ["an offset past the file", at(11)],
  ])("refuses %s", async (_name, answer) => {
    stubFetch(Response.json(RESUMABLE), created(), answer);
    await expect(uploader().upload(FILE, null)).rejects.toBeInstanceOf(UploadFailedError);
  });

  it("refuses with the service's refusal code and starts nothing", async () => {
    const calls = stubFetch(
      Response.json({ code: "upload_rejected", category: "validation" }, { status: 400 }),
    );
    await expect(uploader().upload(FILE, null)).rejects.toMatchObject({
      status: 400,
      serviceCode: "upload_rejected",
    });
    expect(calls).toHaveLength(1);
  });

  it("refuses a malformed resumable upload instead of trusting it", async () => {
    const calls = stubFetch(Response.json({ upload: { id: "../x" }, url: "", headers: {} }));
    await expect(uploader().upload(FILE, null)).rejects.toMatchObject({
      status: 200,
      serviceCode: null,
    });
    expect(calls).toHaveLength(1);
  });

  it("turns a network failure of the ask into status 0, keeping the cause", async () => {
    const offline = new TypeError("Failed to fetch");
    stubFetch(offline);
    const failure = await uploader()
      .upload(FILE, null)
      .catch((error: unknown) => error);
    expect(failure).toMatchObject({ code: "upload_failed", status: 0, serviceCode: null });
    expect((failure as Error).cause).toBe(offline);
  });
});
