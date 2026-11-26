/**
 * Stackra file contract:
 * Purpose: unit tests of `TusHookController`: it is a raw controller at `/media/tus-hooks`; it refuses a call without
 *          the hook password, every call while the password is unset, a method other than POST and a body that is not
 *          a tusd hook request; it admits a `pre-create` of a waiting tus upload once, answering tusd with the stored
 *          id and metadata from the server's record; it rejects a repeated, wrongly sized, deferred-length,
 *          concatenated, unknown or expired upload with the status the client sees; its `post-finish` keeps the
 *          finished upload claimable for `uploadExpiresIn`, and one for an unknown, unstarted or expired upload changes
 *          nothing; it acknowledges every other hook.
 * Boundary: test only; `MediaLibrary` runs over the memory `FileSystem` disk with a hand-moved clock, and requests are
 *           built as tusd v2 sends them.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0222 (decision 2: tus uploads); ADR 0294 (decision 25).
 */
import { buildConfig, MemorySecretStoreDriver } from "@stackra/config";
import { kindOf } from "@stackra/container";
import { Clock } from "@stackra/contracts";
import { FilesystemConfig, MemoryFileSystemDriver } from "@stackra/filesystem";
import { afterEach, describe, expect, it } from "@stackra/testing";

import { MediaConfig } from "#config/media.config";
import { Bucket } from "#core/bases/bucket.base";
import { BUCKET_REGISTRY } from "#core/constants/bucket-registry.constant";
import { BucketVisibility } from "#core/enums/bucket-visibility.enum";
import { MediaType } from "#core/enums/media-type.enum";
import { MediaLibrary } from "#core/services/media-library.service";
import { TusHookController } from "#node/raw/tus-hook.controller";

/** A clock a test moves by hand. */
class TestClock extends Clock {
  at = new Date("2026-10-24T09:00:00.000Z");

  now(): Date {
    return new Date(this.at);
  }
}

class VideosBucket extends Bucket({
  visibility: BucketVisibility.Private,
  maxBytes: 1_000_000,
  accept: [MediaType.Mp4],
}) {}

const SECRET = "hook-password-for-tests";

/** A controller over a fresh memory disk, with `secret` in the secret store as the hook password (unset when empty). */
function setup(secret = SECRET) {
  const clock = new TestClock();
  const disk = new MemoryFileSystemDriver(buildConfig(FilesystemConfig), clock);
  const secrets = new MemorySecretStoreDriver();
  if (secret !== "") secrets.set("MEDIA_TUS_HOOK_SECRET", secret);
  const config = buildConfig(MediaConfig, { secrets });
  const media = new MediaLibrary(disk, config, clock);
  return { clock, disk, media, controller: new TusHookController(media, config) };
}

/** The basic `authorization` header of `password`. */
const basic = (password: string, user = "tusd") => `Basic ${btoa(`${user}:${password}`)}`;

/** A tusd v2 hook request of `type` for an upload of `size` bytes with `metadata`. */
function hook(
  type: string,
  upload: Partial<{
    Size: number;
    SizeIsDeferred: boolean;
    MetaData: Record<string, string> | null;
    IsPartial: boolean;
    IsFinal: boolean;
  }> = {},
  authorization: string | null = basic(SECRET),
): Request {
  const body = {
    Type: type,
    Event: {
      Upload: {
        ID: "",
        Size: 0,
        SizeIsDeferred: false,
        Offset: 0,
        MetaData: {},
        IsPartial: false,
        IsFinal: false,
        PartialUploads: null,
        Storage: null,
        ...upload,
      },
      HTTPRequest: { Method: "POST", URI: "/files/", RemoteAddr: "203.0.113.7:51234", Header: {} },
    },
  };
  return new Request("https://api.test/media/tus-hooks", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(authorization === null ? {} : { authorization }),
    },
    body: JSON.stringify(body),
  });
}

/** Opens a tus upload of 1000 bytes into the videos bucket. */
async function open(media: MediaLibrary): Promise<string> {
  const { upload } = await media.createResumableUpload(VideosBucket, {
    mediaType: MediaType.Mp4,
    size: 1000,
  });
  return upload.id;
}

/** The status and refusal code a rejected creation answers the client. */
async function rejection(response: Response): Promise<{ status: number; code: string }> {
  expect(response.status).toBe(200);
  const answer = (await response.json()) as {
    RejectUpload: boolean;
    HTTPResponse: { StatusCode: number; Body: string };
  };
  expect(answer.RejectUpload).toBe(true);
  return {
    status: answer.HTTPResponse.StatusCode,
    code: (JSON.parse(answer.HTTPResponse.Body) as { code: string }).code,
  };
}

afterEach(() => {
  BUCKET_REGISTRY.clear();
});

describe("TusHookController", () => {
  it("is a raw controller at /media/tus-hooks", () => {
    expect(kindOf(TusHookController)?.kind).toBe("controller");
    expect(kindOf(TusHookController)?.options).toEqual({ path: "/media/tus-hooks" });
  });

  it("admits a waiting upload with the server's id and metadata", async () => {
    const { controller, media } = setup();
    const id = await open(media);
    const response = await controller.handle(
      hook("pre-create", {
        Size: 1000,
        MetaData: { upload: id, filetype: "text/html", filename: "../x" },
      }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ChangeFileInfo: { ID: id, MetaData: { upload: id, filetype: "video/mp4" } },
    });
  });

  it("rejects a second start of the same upload with 409", async () => {
    const { controller, media } = setup();
    const id = await open(media);
    await controller.handle(hook("pre-create", { Size: 1000, MetaData: { upload: id } }));
    const again = await controller.handle(
      hook("pre-create", { Size: 1000, MetaData: { upload: id } }),
    );
    expect(await rejection(again)).toEqual({ status: 409, code: "upload_rejected" });
  });

  it("rejects another size, a deferred length and a concatenated upload with 400", async () => {
    const { controller, media } = setup();
    const id = await open(media);
    for (const upload of [
      { Size: 999, MetaData: { upload: id } },
      { Size: 0, SizeIsDeferred: true, MetaData: { upload: id } },
      { Size: 1000, IsPartial: true, MetaData: { upload: id } },
      { Size: 1000, IsFinal: true, MetaData: { upload: id } },
    ])
      // oxlint-disable-next-line no-await-in-loop -- each request is its own rejection
      expect(await rejection(await controller.handle(hook("pre-create", upload)))).toEqual({
        status: 400,
        code: "upload_rejected",
      });
    expect(
      (await controller.handle(hook("pre-create", { Size: 1000, MetaData: { upload: id } })))
        .status,
    ).toBe(200);
  });

  it("rejects an upload that is not waiting with 404", async () => {
    const { controller } = setup();
    for (const MetaData of [
      null,
      {},
      { upload: "../uploads/x" },
      { upload: "upl_01jb3m0000000000000000000a" },
    ])
      // oxlint-disable-next-line no-await-in-loop -- each request is its own rejection
      expect(
        await rejection(await controller.handle(hook("pre-create", { Size: 10, MetaData }))),
      ).toEqual({
        status: 404,
        code: "upload_incomplete",
      });
  });

  it("rejects an expired upload with 410", async () => {
    const { clock, controller, media } = setup();
    const id = await open(media);
    clock.at = new Date("2026-10-25T09:00:00.001Z");
    const response = await controller.handle(
      hook("pre-create", { Size: 1000, MetaData: { upload: id } }),
    );
    expect(await rejection(response)).toEqual({ status: 410, code: "upload_expired" });
  });

  it("keeps a finished upload claimable for uploadExpiresIn after its post-finish", async () => {
    const { clock, controller, disk, media } = setup();
    const id = await open(media);
    await controller.handle(hook("pre-create", { Size: 1000, MetaData: { upload: id } }));
    clock.at = new Date("2026-10-25T08:45:00.000Z");
    const response = await controller.handle(
      hook("post-finish", { Size: 1000, MetaData: { upload: id, filetype: "video/mp4" } }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({});
    expect(
      JSON.parse(
        await disk.read(`uploads/${id}.json`).then((bytes) => new TextDecoder().decode(bytes)),
      ),
    ).toMatchObject({
      expires: "2026-10-25T09:45:00.000Z",
    });
  });

  it("acknowledges a post-finish of an unknown, unstarted or expired upload and changes nothing", async () => {
    const { clock, controller, disk, media } = setup();
    const unstarted = await open(media);
    const late = await open(media);
    await controller.handle(hook("pre-create", { Size: 1000, MetaData: { upload: late } }));
    const before = await disk.list("uploads/");
    const records = await Promise.all(before.map(async (path) => disk.read(path)));
    clock.at = new Date("2026-10-25T09:00:00.001Z");
    for (const metadata of [
      {},
      { upload: "upl_01jb3m0000000000000000000a" },
      { upload: unstarted },
      { upload: late },
    ]) {
      // oxlint-disable-next-line no-await-in-loop -- each hook is its own call
      const response = await controller.handle(hook("post-finish", { MetaData: metadata }));
      expect(response.status).toBe(200);
      // oxlint-disable-next-line no-await-in-loop -- each hook is its own call
      expect(await response.json()).toEqual({});
    }
    expect(await disk.list("uploads/")).toEqual(before);
    expect(await Promise.all(before.map(async (path) => disk.read(path)))).toEqual(records);
  });

  it("acknowledges every other hook with no change", async () => {
    const { controller } = setup();
    for (const type of [
      "post-create",
      "post-receive",
      "pre-finish",
      "post-finish",
      "post-terminate",
    ]) {
      // oxlint-disable-next-line no-await-in-loop -- each hook is its own call
      const response = await controller.handle(hook(type));
      expect(response.status).toBe(200);
      // oxlint-disable-next-line no-await-in-loop -- each hook is its own call
      expect(await response.json()).toEqual({});
    }
  });

  it("refuses a call without the hook password, and admits nothing", async () => {
    const { controller, disk, media } = setup();
    const id = await open(media);
    for (const authorization of [
      null,
      basic("wrong"),
      basic(`${SECRET}x`),
      "Bearer token",
      "Basic !!",
      `Basic ${btoa(SECRET)}`,
    ]) {
      // oxlint-disable-next-line no-await-in-loop -- each request is its own refusal
      const response = await controller.handle(
        hook("pre-create", { Size: 1000, MetaData: { upload: id } }, authorization),
      );
      expect(response.status).toBe(401);
      expect(response.headers.get("www-authenticate")).toBe('Basic realm="tus-hooks"');
    }
    const record = JSON.parse(new TextDecoder().decode(await disk.read(`uploads/${id}.json`)));
    expect(record.started).toBe(false);
  });

  it("refuses every call while the hook password is unset", async () => {
    const { controller, media } = setup("");
    const id = await open(media);
    for (const authorization of [basic(""), basic("anything")])
      // oxlint-disable-next-line no-await-in-loop -- each request is its own refusal
      expect(
        (
          await controller.handle(
            hook("pre-create", { Size: 1000, MetaData: { upload: id } }, authorization),
          )
        ).status,
      ).toBe(401);
  });

  it("refuses another method, a malformed body and an oversized body", async () => {
    const { controller } = setup();
    const url = "https://api.test/media/tus-hooks";
    const authorization = basic(SECRET);
    const get = await controller.handle(new Request(url, { headers: { authorization } }));
    expect(get.status).toBe(405);
    expect(get.headers.get("allow")).toBe("POST");
    for (const body of ["not json", "null", JSON.stringify({ Type: "pre-create" })])
      // oxlint-disable-next-line no-await-in-loop -- each body is its own refusal
      expect(
        (
          await controller.handle(
            new Request(url, { method: "POST", headers: { authorization }, body }),
          )
        ).status,
      ).toBe(400);
    const huge = new Request(url, {
      method: "POST",
      headers: { authorization },
      body: "x".repeat(65_537),
    });
    expect((await controller.handle(huge)).status).toBe(413);
  });
});
