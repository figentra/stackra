/**
 * Stackra file contract:
 * Purpose: `previewServe(request)`, a local edge for one built web surface (`stackra preview serve`): writes the
 *          bundle's `release:` row and the shell line's `shell:` row into the local KV copy with every asset on this
 *          server's origin, then serves, as the edge Worker does: the page (import map, startup record, modulepreload,
 *          stylesheets) for any path without an extension, the shell's own files for a path with one, the bundle and
 *          shell files under `/assets/`, and the API prefixes proxied to the upstream (503 without one).
 * Boundary: reads the build manifest, the bundle folder and the line checkout `buildProduct` left; writes only the
 *           local KV file. Listens on loopback by default. A file path outside its folder is refused. No host rows: the
 *           local origin serves the one surface it was started for. Clients call the page's own origin (`ClientsConfig`
 *           with no `baseUrl`), so the API base is a runtime choice here, not a rebuild.
 * Runtime: node
 * Governing contract: ADR 0437 (decisions 2 and 3); ADR 0436 (decisions 4 and 7); STA-1676.
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { extname, join, resolve, sep } from "node:path";

import { EdgeKvPrefix } from "@stackra/app/contracts";

import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { EDGE_PUBLISH_SETTINGS } from "#node/constants/edge-publish-settings.constant";
import { LINE_CHECKOUT_SETTINGS } from "#node/constants/line-checkout-settings.constant";
import { PREVIEW_SERVE_SETTINGS } from "#node/constants/preview-serve-settings.constant";
import { PRODUCT_BUILD_SETTINGS } from "#node/constants/product-build-settings.constant";
import { LocalEdgeKvDriver } from "#node/drivers/local-edge-kv.driver";
import { readBundles } from "#node/functions/read-bundles.function";
import { releaseOf } from "#node/functions/release-of.function";
import { renderShellPage } from "#node/functions/render-shell-page.function";
import { shellReleaseOf } from "#node/functions/shell-release-of.function";
import type { EdgeRelease } from "#node/types/edge-release.type";
import type { EdgeShellRow } from "#node/types/edge-shell-row.type";
import type { PreviewServer } from "#node/types/preview-server.type";
import type { PreviewServeRequest } from "#node/types/preview-serve-request.type";
import type { ProductBuild } from "#node/types/product-build.type";

/** `<owner>/<name>@<major>`. */
const LINE = /^[a-z][a-z0-9-]*\/([a-z][a-z0-9-]*)@([0-9]+)$/;

/** Response headers a proxied answer does not carry over (the body is already decoded and re-sent whole). */
const HOP_HEADERS = new Set([
  "connection",
  "content-encoding",
  "content-length",
  "keep-alive",
  "transfer-encoding",
]);

/** Writes the file `name` inside `folder`, or 404; a name that leaves the folder is 404 too. */
function sendFile(response: ServerResponse, folder: string, name: string): void {
  const root = resolve(folder);
  const file = resolve(root, decodeURIComponent(name));
  if (!file.startsWith(`${root}${sep}`) || !existsSync(file) || !statSync(file).isFile()) {
    response.writeHead(404, { "content-type": "text/plain" }).end("Not found");
    return;
  }
  const type =
    EDGE_PUBLISH_SETTINGS.contentTypes[extname(file)] ??
    (extname(file) === ".html" ? "text/html" : undefined);
  response
    .writeHead(200, type === undefined ? {} : { "content-type": type })
    .end(readFileSync(file));
}

/** The whole request body. */
async function bodyOf(request: IncomingMessage): Promise<Uint8Array> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(chunk as Buffer);
  // A plain Uint8Array view: fetch's BodyInit types take it, not Node's Buffer.
  return new Uint8Array(Buffer.concat(chunks));
}

/**
 * Starts the local edge for `request.surface` and answers where it serves.
 *
 * @throws RunwayUnresolvedError when there is no build manifest, the surface was not built, or its shell line is not a
 *         line; RunwayInvalidError (from the readers) when the bundle or the shell checkout is missing or malformed.
 * @example
 * const server = await previewServe({ repository: ".", surface: "console", api: "http://127.0.0.1:4000" });
 * server.url; // "http://127.0.0.1:4173"
 */
export async function previewServe(request: PreviewServeRequest): Promise<PreviewServer> {
  const repository = resolve(request.repository);
  const manifestFile = join(repository, PRODUCT_BUILD_SETTINGS.manifest);
  if (!existsSync(manifestFile))
    throw new RunwayUnresolvedError(
      `No build to serve: run stackra build --product --surfaces-only first (${PRODUCT_BUILD_SETTINGS.manifest})`,
    );
  const build = JSON.parse(readFileSync(manifestFile, "utf8")) as ProductBuild;
  const built = build.surfaces[request.surface];
  if (built === undefined)
    throw new RunwayUnresolvedError(
      `The build has no ${request.surface} surface (built: ${Object.keys(build.surfaces).join(", ") || "none"})`,
    );
  const line = LINE.exec(built.shell.line);
  if (line === null) throw new RunwayUnresolvedError(`${built.shell.line} is not a shell line`);
  const [, name = "", major = ""] = line;
  const lineDir = join(repository, PRODUCT_BUILD_SETTINGS.lineDir(request.surface));
  const [bundle] = readBundles(repository, [request.surface]);
  if (bundle === undefined)
    throw new RunwayUnresolvedError(`No ${request.surface} bundle was built`);

  const kv =
    request.kv ??
    Object.assign(new LocalEdgeKvDriver(), {
      file: join(repository, PREVIEW_SERVE_SETTINGS.kvFile),
    });
  const prefixes = request.apiPrefixes ?? PREVIEW_SERVE_SETTINGS.apiPrefixes;
  const { assetsPath } = PREVIEW_SERVE_SETTINGS;
  let folders: [string, string][] = [];
  const releaseKey = `${EdgeKvPrefix.Release}:${build.product}:${request.surface}`;
  const shellKey = `${EdgeKvPrefix.Shell}:${name}:${major}`;

  const handle = async (incoming: IncomingMessage, response: ServerResponse): Promise<void> => {
    const path = new URL(incoming.url ?? "/", "http://local").pathname;

    if (prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
      if (request.api === undefined) {
        response.writeHead(503, { "content-type": "application/json" }).end(
          JSON.stringify({
            error: "api_unavailable",
            message: "No API upstream was given (--api).",
          }),
        );
        return;
      }
      const method = incoming.method ?? "GET";
      const headers = Object.fromEntries(
        Object.entries(incoming.headers).filter(
          (entry): entry is [string, string] => entry[0] !== "host" && typeof entry[1] === "string",
        ),
      );
      try {
        const answer = await fetch(`${request.api.replace(/\/+$/, "")}${incoming.url ?? "/"}`, {
          method,
          headers,
          redirect: "manual",
          ...(method === "GET" || method === "HEAD" ? {} : { body: await bodyOf(incoming) }),
        });
        const out: Record<string, string> = {};
        answer.headers.forEach((value, key) => {
          if (!HOP_HEADERS.has(key)) out[key] = value;
        });
        response.writeHead(answer.status, out).end(Buffer.from(await answer.arrayBuffer()));
      } catch {
        response
          .writeHead(502, { "content-type": "text/plain" })
          .end("The API upstream did not answer");
      }
      return;
    }

    const asset = folders.find(([prefix]) => path.startsWith(prefix));
    if (asset !== undefined) {
      sendFile(response, asset[1], path.slice(asset[0].length));
      return;
    }

    // A path with a file extension is one of the shell's own files (sw.js, favicon.svg), as at the edge.
    if (path.slice(path.lastIndexOf("/") + 1).includes(".")) {
      sendFile(response, join(lineDir, LINE_CHECKOUT_SETTINGS.shellDist), path.slice(1));
      return;
    }

    const release = kv.json<EdgeRelease>(releaseKey);
    const shell = kv.json<EdgeShellRow>(shellKey);
    if (release === null || shell === null) {
      response
        .writeHead(503, { "content-type": "text/plain" })
        .end("Nothing has been released here yet.");
      return;
    }
    const html = renderShellPage({
      shell,
      release,
      title: build.product,
      record: {
        locales: request.locales ?? PREVIEW_SERVE_SETTINGS.locales,
        product: build.product,
        surface: request.surface,
        ...(request.region === undefined ? {} : { region: request.region }),
        realm: EDGE_PUBLISH_SETTINGS.realms[request.surface] ?? EDGE_PUBLISH_SETTINGS.defaultRealm,
        ...(built.preset === undefined ? {} : { preset: built.preset }),
        shell: { major: Number(major), version: shell.version },
        bundles: [release.url],
      },
    });
    response
      .writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" })
      .end(incoming.method === "HEAD" ? undefined : html);
  };

  const server = createServer((incoming, response) => {
    handle(incoming, response).catch(() => {
      if (!response.headersSent) response.writeHead(500, { "content-type": "text/plain" });
      response.end("The local edge failed on this request");
    });
  });
  const host = request.host ?? PREVIEW_SERVE_SETTINGS.host;
  await new Promise<void>((settle, fail) => {
    server.once("error", fail);
    server.listen(request.port ?? PREVIEW_SERVE_SETTINGS.port, host, () => settle());
  });
  const url = `http://${host}:${(server.address() as AddressInfo).port}`;
  const origin = `${url}${assetsPath}`;

  // The rows, written once the origin is known, as a publish would write them.
  const release = releaseOf(bundle, build.product, origin);
  const shell = shellReleaseOf(
    {
      line: built.shell.line,
      major,
      name,
      package: built.shell.package,
      version: built.shell.version,
      from: "registry",
      dir: lineDir,
      steps: [],
    },
    origin,
  );
  await kv.put(releaseKey, JSON.stringify(release));
  await kv.put(shellKey, JSON.stringify(shell satisfies EdgeShellRow));
  folders = [
    [
      `${assetsPath}/${LINE_CHECKOUT_SETTINGS.shellPath}/${name}/${major}/${shell.version}/`,
      join(lineDir, LINE_CHECKOUT_SETTINGS.shellDist),
    ],
    [`${assetsPath}/${build.product}/${request.surface}/${release.version}/`, bundle.folder],
  ];

  return {
    url,
    kv,
    close: () =>
      new Promise<void>((settle) => {
        server.closeAllConnections();
        server.close(() => settle());
      }),
  };
}
