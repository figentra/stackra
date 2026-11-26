/**
 * Stackra file contract:
 * Purpose: integration tests of the ADR 0222 tus upload path on a real tusd: the `tus` uploader asks
 *          `upload.create_resumable` for an upload, tusd's `pre-create` hook reaches `TusHookController` with the hook
 *          password, which admits it under the server's id and media type (a forged `filetype` is replaced), the
 *          uploader sends the bytes in chunks, resumes from tusd's own offset after a request dropped half-way, and
 *          `MediaLibrary.claim` keeps the upload while it is still short; tusd's `post-finish` hook renews the claim
 *          window from the last byte (`uploadExpiresIn`, longer here than the transfer lifetime), then the claim
 *          places the finished file byte for byte (its head read from the stream) and drops tusd's `.info` file. tusd refuses a second start of the same upload, an unknown upload and every
 *          start when the hook password is wrong.
 * Boundary: test only. tusd v2 stores into a temporary folder that the local `FileSystem` disk is rooted at (tusd's
 *           filestore writes `uploads/<id>` and `uploads/<id>.info`, the layout its S3 store keeps under the prefix
 *           `uploads/`). tusd runs in a Testcontainers `tusproject/tusd` container, or as the local binary
 *           `TUSD_BINARY` names when Docker is not at hand; the hook and the action are served from this process.
 * Runtime: node (vitest, int tier)
 * Governing contract: ADR 0182 (test tiers); ADR 0222 (decision 2: tus uploads, services never stream the bytes);
 *                     STA-669.
 */
import { type ChildProcess, spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { chmod, mkdir, mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { createServer, type IncomingMessage, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { buildConfig, MemorySecretStoreDriver } from "@stackra/config";
import { Clock, Duration } from "@stackra/contracts";
import { FilesystemConfig } from "@stackra/filesystem";
import { LocalFileSystemDriver } from "@stackra/filesystem/node";
import { afterAll, beforeAll, describe, expect, it } from "@stackra/testing";
import { GenericContainer, type StartedTestContainer, TestContainers, Wait } from "testcontainers";
import { vi } from "vitest";

import { MediaConfig } from "#config/media.config";
import { Bucket } from "#core/bases/bucket.base";
import { BUCKET_REGISTRY } from "#core/constants/bucket-registry.constant";
import { TusUploaderDriver } from "#core/drivers/tus-uploader.driver";
import { BucketVisibility } from "#core/enums/bucket-visibility.enum";
import { MediaType } from "#core/enums/media-type.enum";
import { UploadIncompleteError } from "#core/errors/upload-incomplete.error";
import { registerBuckets } from "#core/functions/register-buckets.function";
import { MediaLibrary } from "#core/services/media-library.service";
import type { Upload } from "#core/values/upload.value";
import { CreateResumableUploadAction } from "#node/actions/create-resumable-upload.action";
import { TusHookController } from "#node/raw/tus-hook.controller";
import { CreateUploadInput } from "#node/schemas/create-upload-input.schema";

/** The tusd image, pinned to the version this test was proven with. */
const IMAGE = "tusproject/tusd:v2.10.3";

/** The hook password of these tests. */
const SECRET = "tus-hook-password-int";

/** How tusd's container reaches this process. */
const CONTAINER_HOST = "host.testcontainers.internal";

/** One chunk: a 3 MiB file goes in three `PATCH`es. */
const CHUNK = 1_048_576;

/** The wall clock: tusd and the records share it. */
class WallClock extends Clock {
  now(): Date {
    return new Date();
  }
}

class VideosBucket extends Bucket({
  visibility: BucketVisibility.Private,
  maxBytes: 10_000_000,
  accept: [MediaType.Mp4],
}) {}

/** A 3 MiB MP4: an `ftyp` box with the `mp42` brand, then random bytes. */
const VIDEO = (() => {
  const bytes = new Uint8Array(3 * CHUNK + 12_345);
  bytes.set(randomBytes(bytes.length));
  bytes.set([
    0,
    0,
    0,
    0x18,
    ...new TextEncoder().encode("ftypmp42"),
    0,
    0,
    0,
    0,
    ...new TextEncoder().encode("mp42isom"),
  ]);
  return bytes;
})();

let root: string;
let server: Server;
let media: MediaLibrary;
let controller: TusHookController;
let action: CreateResumableUploadAction;
let tusEndpoint: string;
let stopTusd: () => Promise<void>;

/** The headers of a node request as Fetch headers. */
function headersOf(request: IncomingMessage): Headers {
  const headers = new Headers();
  for (const [name, value] of Object.entries(request.headers))
    for (const one of [value ?? []].flat()) headers.append(name, one);
  return headers;
}

/** Serves the tus hook and the `upload.create_resumable` action from this process. */
function serve(): Server {
  return createServer((request, response) => {
    void (async () => {
      const chunks: Buffer[] = [];
      for await (const chunk of request) chunks.push(chunk as Buffer);
      const body = Buffer.concat(chunks);
      if (request.url === "/media/tus-hooks") {
        const answer = await controller.handle(
          new Request(`http://${request.headers.host}${request.url}`, {
            method: request.method ?? "GET",
            headers: headersOf(request),
            ...(request.method === "POST" ? { body } : {}),
          }),
        );
        response.writeHead(answer.status, Object.fromEntries(answer.headers));
        response.end(Buffer.from(await answer.arrayBuffer()));
        return;
      }
      const output = await action.handle(
        CreateUploadInput.create(JSON.parse(body.toString("utf8"))),
      );
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify(output));
    })().catch((error: unknown) => {
      response.writeHead(500, { "content-type": "application/json" });
      response.end(JSON.stringify({ code: "internal", message: String(error) }));
    });
  });
}

/** Starts tusd over `root`, calling the hook at `port` with `password`; answers its creation URL and how to stop it. */
async function startTusd(
  port: number,
  password: string,
): Promise<{ endpoint: string; stop: () => Promise<void> }> {
  const binary = process.env["TUSD_BINARY"];
  const args = (dir: string, hookHost: string, listen: string, tusPort: number) => [
    `-host=${listen}`,
    `-port=${tusPort}`,
    "-base-path=/files/",
    `-upload-dir=${dir}/uploads`,
    `-hooks-http=http://tusd:${password}@${hookHost}:${port}/media/tus-hooks`,
    "-hooks-enabled-events=pre-create,post-finish",
    "-hooks-http-retry=0",
    "-disable-download",
  ];
  if (binary !== undefined && binary !== "") {
    const tusPort = 20_000 + Math.floor(Math.random() * 20_000);
    const child: ChildProcess = spawn(binary, args(root, "127.0.0.1", "127.0.0.1", tusPort), {
      stdio: ["ignore", "pipe", "ignore"],
    });
    await new Promise<void>((ready, failed) => {
      child.once("error", failed);
      child.stdout?.on("data", (data: Buffer) => {
        if (data.toString("utf8").includes("You can now upload files")) ready();
      });
    });
    return {
      endpoint: `http://127.0.0.1:${tusPort}/files/`,
      stop: async () => {
        child.kill("SIGTERM");
      },
    };
  }
  await TestContainers.exposeHostPorts(port);
  const container: StartedTestContainer = await new GenericContainer(IMAGE)
    .withBindMounts([{ source: root, target: "/srv/tusd-data", mode: "rw" }])
    .withCommand(args("/srv/tusd-data", CONTAINER_HOST, "0.0.0.0", 1080))
    .withExposedPorts(1080)
    .withWaitStrategy(Wait.forLogMessage(/You can now upload files/))
    .start();
  return {
    endpoint: `http://${container.getHost()}:${container.getMappedPort(1080)}/files/`,
    stop: async () => {
      await container.stop();
    },
  };
}

/** The tus upload's `.info` file as tusd wrote it. */
async function infoOf(
  id: string,
): Promise<{ ID: string; Size: number; MetaData: Record<string, string> }> {
  return JSON.parse(await readFile(join(root, "uploads", `${id}.info`), "utf8")) as never;
}

/** The server's record of the upload `id`. */
async function recordOf(id: string): Promise<{ expires: string }> {
  return JSON.parse(await readFile(join(root, "uploads", `${id}.json`), "utf8")) as never;
}

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), "stackra-tus-"));
  await mkdir(join(root, "uploads"));
  await chmod(root, 0o777);
  await chmod(join(root, "uploads"), 0o777);
  registerBuckets([{ type: VideosBucket, key: "library.videos" }]);
  server = serve();
  await new Promise<void>((listening) => {
    server.listen(0, "0.0.0.0", listening);
  });
  const tusd = await startTusd((server.address() as AddressInfo).port, SECRET);
  tusEndpoint = tusd.endpoint;
  stopTusd = tusd.stop;
  const disk = new LocalFileSystemDriver(
    buildConfig(FilesystemConfig, { values: { root, url: "https://cdn.test" } }),
  );
  const secrets = new MemorySecretStoreDriver().set("MEDIA_TUS_HOOK_SECRET", SECRET);
  const config = buildConfig(MediaConfig, {
    values: {
      tus: { endpoint: tusEndpoint, chunkBytes: CHUNK, retryDelaysMs: [0, 0, 0] },
      // a transfer window shorter than the claim window, so the post-finish renewal shows in the record
      resumableUploadExpiresIn: Duration.minutes(10),
      uploadExpiresIn: Duration.hours(2),
    },
    secrets,
  });
  media = new MediaLibrary(disk, config, new WallClock());
  controller = new TusHookController(media, config);
  action = new CreateResumableUploadAction(media);
}, 180_000);

afterAll(async () => {
  await stopTusd?.();
  await new Promise<void>((closed) => {
    server.close(() => closed());
  });
  BUCKET_REGISTRY.clear();
  await rm(root, { recursive: true, force: true });
});

/** A tus uploader asking this process's action, with chunks of `CHUNK` and three immediate retries. */
function uploader(): TusUploaderDriver {
  const port = (server.address() as AddressInfo).port;
  return new TusUploaderDriver(
    buildConfig(MediaConfig, {
      values: {
        resumableUploadEndpoint: `http://127.0.0.1:${port}/api/uploads/create-resumable`,
        tus: { endpoint: tusEndpoint, chunkBytes: CHUNK, retryDelaysMs: [0, 0, 0] },
      },
    }),
  );
}

describe("tus uploads through tusd", () => {
  it("admits, resumes after a dropped request, keeps a short upload and claims the finished file", async () => {
    const real = globalThis.fetch;
    const offsets: string[] = [];
    let patches = 0;
    let id = "";
    let claimedEarly: unknown;
    let expiresMidway = 0;
    vi.stubGlobal("fetch", async (url: string, init: RequestInit = {}): Promise<Response> => {
      const headers = { ...(init.headers as Record<string, string>) };
      if (init.method === "POST" && url === tusEndpoint)
        // A client forging the stored type: the hook replaces tusd's metadata whole.
        headers["upload-metadata"] = `${headers["upload-metadata"]},filetype ${btoa("text/html")}`;
      if (init.method !== "PATCH") return real(url, { ...init, headers });
      offsets.push(headers["upload-offset"] ?? "");
      patches += 1;
      if (patches !== 2) return real(url, { ...init, headers });
      // The second chunk: half of it reaches tusd, then the connection drops.
      const half = (init.body as Blob).slice(0, CHUNK / 2);
      expect((await real(url, { ...init, headers, body: half })).status).toBe(204);
      id = new URL(url).pathname.split("/").pop() ?? "";
      claimedEarly = await media
        .claim({ id } as Upload<VideosBucket>, VideosBucket)
        .catch((error: unknown) => error);
      expiresMidway = Date.parse((await recordOf(id)).expires);
      throw new TypeError("network dropped");
    });
    let upload: Upload;
    try {
      upload = await uploader().upload(new Blob([VIDEO], { type: "video/mp4" }), "library.videos");
    } finally {
      vi.unstubAllGlobals();
    }

    expect(id).toBe(upload.id);
    // The third PATCH starts where tusd says the dropped one stopped, not at a chunk boundary.
    expect(offsets).toEqual([
      "0",
      String(CHUNK),
      String(CHUNK + CHUNK / 2),
      String(2 * CHUNK + CHUNK / 2),
    ]);
    expect(claimedEarly).toBeInstanceOf(UploadIncompleteError);
    expect(await infoOf(upload.id)).toMatchObject({
      ID: upload.id,
      Size: VIDEO.length,
      MetaData: { upload: upload.id, filetype: "video/mp4" },
    });
    // Mid-transfer the record expires ten minutes after creation (resumableUploadExpiresIn); tusd's post-finish, sent
    // after it answers the last PATCH, moves it to two hours after the finish (uploadExpiresIn).
    expect(expiresMidway).toBeLessThanOrEqual(Date.now() + 10 * 60 * 1000);
    await expect
      .poll(async () => Date.parse((await recordOf(upload.id)).expires) - expiresMidway, {
        timeout: 10_000,
      })
      .toBeGreaterThan(60 * 60 * 1000);

    const file = await media.claim(upload as Upload<VideosBucket>, VideosBucket);

    expect(file).toMatchObject({
      id: upload.id,
      path: `private/library/videos/${upload.id}.mp4`,
      mediaType: MediaType.Mp4,
      size: VIDEO.length,
    });
    // Byte for byte (a Buffer comparison: a deep equal of 3 MiB is slow).
    expect((await readFile(join(root, file.path))).equals(VIDEO)).toBe(true);
    expect(await readdir(join(root, "uploads"))).toEqual([]);
  });

  it("refuses a second start of an upload, and an upload the server never opened", async () => {
    const opened = await media.createResumableUpload(VideosBucket, {
      mediaType: MediaType.Mp4,
      size: 100,
    });
    const start = (metadata: string) =>
      fetch(tusEndpoint, {
        method: "POST",
        headers: { "tus-resumable": "1.0.0", "upload-length": "100", "upload-metadata": metadata },
      });
    const first = await start(opened.headers["upload-metadata"] ?? "");
    expect(first.status).toBe(201);
    expect(first.headers.get("location")).toContain(opened.upload.id);

    const again = await start(opened.headers["upload-metadata"] ?? "");
    expect(again.status).toBe(409);
    expect(await again.json()).toEqual({ code: "upload_rejected" });

    const unknown = await start(`upload ${btoa("upl_01jb3m0000000000000000000a")}`);
    expect(unknown.status).toBe(404);
    expect(await unknown.json()).toEqual({ code: "upload_incomplete" });

    const resized = await media.createResumableUpload(VideosBucket, {
      mediaType: MediaType.Mp4,
      size: 100,
    });
    const wrongSize = await fetch(tusEndpoint, {
      method: "POST",
      headers: {
        "tus-resumable": "1.0.0",
        "upload-length": "101",
        "upload-metadata": resized.headers["upload-metadata"] ?? "",
      },
    });
    expect(wrongSize.status).toBe(400);
  });

  it("starts nothing when tusd's hook password is wrong", async () => {
    const port = (server.address() as AddressInfo).port;
    const wrong = await startTusd(port, "not-the-password");
    try {
      const opened = await media.createResumableUpload(VideosBucket, {
        mediaType: MediaType.Mp4,
        size: 100,
      });
      const start = await fetch(wrong.endpoint, {
        method: "POST",
        headers: {
          "tus-resumable": "1.0.0",
          "upload-length": "100",
          "upload-metadata": opened.headers["upload-metadata"] ?? "",
        },
      });
      expect(start.status).toBeGreaterThanOrEqual(500);
      const record = JSON.parse(
        await readFile(join(root, "uploads", `${opened.upload.id}.json`), "utf8"),
      );
      expect(record.started).toBe(false);
      expect(
        (await readdir(join(root, "uploads"))).filter((name) => name.startsWith(opened.upload.id)),
      ).toEqual([`${opened.upload.id}.json`]);
    } finally {
      await wrong.stop();
    }
  });
});
