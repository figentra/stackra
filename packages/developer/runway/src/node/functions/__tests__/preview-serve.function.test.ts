/**
 * Stackra file contract:
 * Purpose: unit tests of `previewServe` over a built product in a temporary folder: it writes the bundle's `release:`
 *          and the shell's `shell:` rows to the local KV with every URL on its own origin; the page carries the import
 *          map, the startup record (product, surface, realm, region, shell version, the bundle URL) and the bundle's
 *          stylesheet; bundle and shell files are served under `/assets/`, a shell file at the root, a path leaving its
 *          folder is 404; `/api` is proxied to the upstream with method, path and body, and answers 503 without one; a
 *          surface the build lacks is refused.
 * Boundary: test only; real loopback sockets on free ports, a fake API upstream, nothing leaves the machine.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0437 (decisions 2 and 3); STA-1676.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "@stackra/testing";

import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { LocalEdgeKvDriver } from "#node/drivers/local-edge-kv.driver";
import { previewServe } from "#node/functions/preview-serve.function";
import type { PreviewServer } from "#node/types/preview-server.type";

let repository = "";
let upstream: Server;
let upstreamUrl = "";
let server: PreviewServer;
let bare: PreviewServer;

/** Writes `content` at `path` under the repository. */
function put(path: string, content: unknown): void {
  const file = join(repository, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, typeof content === "string" ? content : JSON.stringify(content));
}

beforeAll(async () => {
  repository = mkdtempSync(join(tmpdir(), "preview-serve-"));
  put("dist/product/build.json", {
    product: "acme",
    sha: "a".repeat(40),
    version: "1.0.0",
    dryRun: false,
    surfaces: {
      console: {
        shell: {
          line: "os/console@3",
          package: "@figentra/os-console",
          version: "3.0.2",
          importMap: [],
        },
        packages: [],
        hosts: [],
        content: [],
      },
    },
    mobile: {},
    skipped: { mobile: [] },
    planned: [],
  });
  put("dist/bundles/console/1.0.0/bundle.manifest.json", {
    package: "@acme/console",
    surface: "console",
    targets: "console@3",
    version: "1.0.0",
    entry: "index.js",
    modulepreload: ["index.js"],
    css: ["index.css"],
    imports: [],
  });
  put("dist/bundles/console/1.0.0/index.js", "export default () => {};");
  put("dist/bundles/console/1.0.0/index.css", "body{}");
  put(".stackra/lines/console/dist/shell.json", {
    surface: "console",
    line: "3",
    version: "3.0.2",
    entry: "assets/main.js",
    css: ["assets/shell.css"],
    importMap: { imports: { react: "assets/react.js" } },
  });
  put(".stackra/lines/console/dist/assets/main.js", "console.log('shell');");
  put(".stackra/lines/console/dist/sw.js", "self.addEventListener('fetch', () => {});");
  put("secret.txt", "outside");

  upstream = createServer((request, response) => {
    let body = "";
    request.on("data", (chunk: Buffer) => (body += chunk.toString()));
    request.on("end", () => {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ method: request.method, url: request.url, body }));
    });
  });
  await new Promise<void>((settle) => {
    upstream.listen(0, "127.0.0.1", () => settle());
  });
  upstreamUrl = `http://127.0.0.1:${(upstream.address() as AddressInfo).port}`;

  server = await previewServe({
    repository,
    surface: "console",
    port: 0,
    api: upstreamUrl,
    region: "me-central-1",
  });
  // Its own KV file: both servers write the same keys with their own origins.
  bare = await previewServe({
    repository,
    surface: "console",
    port: 0,
    kv: Object.assign(new LocalEdgeKvDriver(), { file: join(repository, "bare-kv.json") }),
  });
});

afterAll(async () => {
  await server.close();
  await bare.close();
  await new Promise<void>((settle) => {
    upstream.close(() => settle());
  });
  rmSync(repository, { recursive: true, force: true });
});

describe("previewServe", () => {
  // @covers sta-1676:FR-001
  it("writes the release and shell rows with every URL on its own origin", () => {
    expect(server.kv.json("release:acme:console")).toMatchObject({
      version: "1.0.0",
      url: `${server.url}/assets/acme/console/1.0.0/index.js`,
      css: [`${server.url}/assets/acme/console/1.0.0/index.css`],
    });
    expect(server.kv.json("shell:console:3")).toMatchObject({
      version: "3.0.2",
      entry: `${server.url}/assets/shells/console/3/3.0.2/assets/main.js`,
    });
  });

  // @covers sta-1676:FR-002
  it("serves the shell page with the import map, startup record and bundle stylesheet", async () => {
    const page = await (await fetch(`${server.url}/orders/42`)).text();
    const record = JSON.parse(
      /<script type="application\/json" id="stackra-startup">(.*?)<\/script>/.exec(page)?.[1] ??
        "{}",
    ) as Record<string, unknown>;

    expect(page).toContain('<script type="importmap">');
    expect(page).toContain(`${server.url}/assets/shells/console/3/3.0.2/assets/react.js`);
    expect(page).toContain(
      `<link rel="stylesheet" crossorigin href="${server.url}/assets/acme/console/1.0.0/index.css">`,
    );
    expect(page).toContain(`${server.url}/assets/shells/console/3/3.0.2/assets/shell.css`);
    expect(page.indexOf("shell.css")).toBeLessThan(page.indexOf("index.css"));
    expect(record).toMatchObject({
      product: "acme",
      surface: "console",
      realm: "tenant",
      region: "me-central-1",
      shell: { major: 3, version: "3.0.2" },
      bundles: [`${server.url}/assets/acme/console/1.0.0/index.js`],
    });
  });

  // @covers sta-1676:FR-002
  it("serves bundle and shell files, a shell file at the root, and refuses a path leaving its folder", async () => {
    const bundle = await fetch(`${server.url}/assets/acme/console/1.0.0/index.js`);
    expect(bundle.headers.get("content-type")).toBe("text/javascript");
    expect(await bundle.text()).toContain("export default");
    expect(
      await (await fetch(`${server.url}/assets/shells/console/3/3.0.2/assets/main.js`)).text(),
    ).toContain("shell");
    expect(await (await fetch(`${server.url}/sw.js`)).text()).toContain("addEventListener");
    expect(
      (await fetch(`${server.url}/assets/acme/console/1.0.0/..%2F..%2F..%2F..%2F..%2Fsecret.txt`))
        .status,
    ).toBe(404);
  });

  // @covers sta-1676:FR-003
  it("proxies /api to the upstream with method, path and body, and answers 503 without one", async () => {
    const answer = await fetch(`${server.url}/api/orders?page=2`, {
      method: "POST",
      body: "hello",
    });
    expect(await answer.json()).toEqual({
      method: "POST",
      url: "/api/orders?page=2",
      body: "hello",
    });
    expect((await fetch(`${bare.url}/api/orders`)).status).toBe(503);
  });

  it("refuses a surface the build lacks", async () => {
    await expect(previewServe({ repository, surface: "till", port: 0 })).rejects.toBeInstanceOf(
      RunwayUnresolvedError,
    );
  });
});
