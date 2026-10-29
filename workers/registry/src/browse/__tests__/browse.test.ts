/**
 * Stackra file contract:
 * Purpose: end-to-end tests of the registry browser (STA-1608) over the registry fakes: the list (categories, search,
 *          hidden `internal` scopes and names), the package page (README, dependencies, provenance, install, licence),
 *          the Pro and internal gating through the licence port, English and Arabic, the CSP and cache headers, HTML
 *          escaping, and that the npm routes answer as before.
 * Boundary: test only; D1 is node:sqlite with the real migrations, everything else in memory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0453 (decisions 4, 10 and 13); ADR 0461 (decision 3).
 */
import { activeLicence } from "#src/__tests__/fixtures/memory-bindings.fixture";
import { createTestRegistry, PRO_CLAIMS } from "#src/__tests__/fixtures/registry.fixture";

type Registry = Awaited<ReturnType<typeof createTestRegistry>>;

const CORE = {
  name: "@stackra/core",
  version: "0.1.0",
  license: "MIT",
  description: "Core <b>kernel</b>",
  repository: { type: "git", url: "git+https://github.com/figentra/stackra.git" },
  dependencies: { "@stackra/contracts": "0.1.0", zod: "4.1.0" },
  stackra: { kind: "package", category: "foundation" },
};
const CORE_README = [
  "<!-- Stackra file contract. Purpose: hidden. -->",
  "# @stackra/core",
  "",
  "The **kernel**. See [docs](https://docs.stackra.figentra.com) or [bad](javascript:alert(1)).",
  "",
  "| Entry | Use |",
  "| ----- | --- |",
  "| `.`   | boot |",
  "",
  "```ts",
  "const x = 1 < 2;",
  "```",
].join("\n");
const CONFIG = {
  name: "@stackra/config",
  version: "0.2.0",
  license: "MIT",
  description: "Deploy-time values",
  stackra: { kind: "package", category: "foundation" },
};
const QUEUE = {
  name: "@stackra/queue",
  version: "0.1.0",
  license: "MIT",
  description: "Jobs",
  stackra: { kind: "package", category: "runtime" },
};
const PRO = {
  name: "@stackra-pro/sync",
  version: "0.1.0",
  license: "SEE LICENSE IN LICENSE",
  description: "Sync engine",
  dependencies: { "@stackra/core": "0.1.0" },
  stackra: { kind: "package", category: "data" },
};
const PRO_UI = { ...PRO, name: "@stackra-pro/ui", description: "Internal UI" };
const PRO_FILES = {
  LICENSE: "commercial",
  "README.md": "# Sync\n\nSecret pro readme.",
};

/** A `@figentra` brand kit written straight into D1: the scope is internal and has its own publisher. */
const insertKit = (registry: Registry): void => {
  const at = "2026-10-27T12:00:00.000Z";
  registry.sqlite
    .prepare(
      "INSERT INTO packages (name, scope, kind, created_at, modified_at) VALUES ('@figentra/brand-tamo', '@figentra', 'package', ?, ?)",
    )
    .run(at, at);
  registry.sqlite
    .prepare(
      `INSERT INTO versions (name, version, kind, manifest, integrity, shasum, sha256, signatures, predicate_type, size,
         publisher_run, published_at) VALUES ('@figentra/brand-tamo', '1.0.0', 'package', ?, 'i', 's', 'h', '[]', 'p', 1, 'r', ?)`,
    )
    .run(JSON.stringify({ name: "@figentra/brand-tamo", description: "Tamo brand kit" }), at);
  registry.sqlite
    .prepare(
      "INSERT INTO dist_tags (name, tag, version) VALUES ('@figentra/brand-tamo', 'latest', '1.0.0')",
    )
    .run();
};

/** One HTML request, with an optional licence token. */
const page = async (
  registry: Registry,
  path: string,
  token?: string,
): Promise<{ status: number; html: string; headers: Headers }> => {
  const response = await registry.request(path, token === undefined ? {} : { token });
  return { status: response.status, html: await response.text(), headers: response.headers };
};

describe("registry browser", () => {
  let registry: Registry;

  beforeEach(async () => {
    registry = await createTestRegistry();
    for (const [pkg, files] of [
      [CORE, { "README.md": CORE_README }],
      [CONFIG, {}],
      [QUEUE, {}],
    ] as const)
      expect((await registry.publish(pkg, { files })).status).toBe(201);
    for (const pkg of [PRO, PRO_UI])
      expect(
        (
          await registry.publish(pkg, {
            files: PRO_FILES,
            repository: "figentra/stackra-pro",
            claims: PRO_CLAIMS,
          })
        ).status,
      ).toBe(201);
    insertKit(registry);
    registry.licences.licences.set("stkl_customer", activeLicence());
    registry.licences.licences.set(
      "stkl_internal",
      activeLicence({ internal: true, grants: [{ scope: "@stackra-pro", names: "*" }] }),
    );
  });

  describe("package list", () => {
    it("lists packages grouped by category, marks Pro, and is public", async () => {
      const { status, html, headers } = await page(registry, "/");
      expect(status).toBe(200);
      expect(html).toContain('<html lang="en" dir="ltr">');
      expect(html).toContain(">Foundation <span>2</span></h2>");
      expect(html).toContain(">Runtime <span>1</span></h2>");
      expect(html).toContain(">Data <span>1</span></h2>");
      expect(html).toContain('href="/package/@stackra/core"');
      expect(html).toContain('href="/package/@stackra-pro/sync"');
      expect(html).toContain('<span class="badge pro">Pro</span>');
      expect(html).toContain("4 packages");
      expect(headers.get("cache-control")).toBe("public, max-age=60");
      expect(headers.get("vary")).toBeNull();
    });

    it("never lists an internal scope or an internal name", async () => {
      for (const token of [undefined, "stkl_internal"]) {
        const { html } = await page(registry, "/", token);
        expect(html).not.toContain("@figentra/brand-tamo");
        expect(html).not.toContain("@stackra-pro/ui");
      }
    });

    it("searches names and descriptions", async () => {
      const byDescription = await page(registry, "/?q=deploy-time");
      expect(byDescription.html).toContain("@stackra/config");
      expect(byDescription.html).not.toContain('href="/package/@stackra/core"');
      expect(byDescription.html).toContain('value="deploy-time"');
      const byName = await page(registry, "/?q=queue");
      expect(byName.html).toContain('href="/package/@stackra/queue"');
      const none = await page(registry, "/?q=%3Cscript%3E");
      expect(none.html).toContain("No package matches “&lt;script&gt;”.");
      expect(none.html).not.toContain("<script>alert");
      expect((await page(registry, "/?q=brand-tamo")).html).not.toContain("brand-tamo</bdi>");
    });

    it("serves Arabic under /ar, right to left, with prefixed links", async () => {
      const { status, html } = await page(registry, "/ar/");
      expect(status).toBe(200);
      expect(html).toContain('<html lang="ar" dir="rtl">');
      expect(html).toContain("سجل Stackra");
      expect(html).toContain(">الأساس <span>2</span></h2>");
      expect(html).toContain('href="/ar/package/@stackra/core"');
      expect(html).toContain('href="/" hreflang="en"');
      expect((await page(registry, "/ar")).status).toBe(200);
    });

    it("locks the page down with its CSP: no external request, the one script by hash", async () => {
      const { headers, html } = await page(registry, "/");
      const csp = headers.get("content-security-policy") ?? "";
      expect(csp).toMatch(/default-src 'none'/);
      expect(csp).toMatch(/script-src 'sha256-[A-Za-z0-9+/]+=*'/);
      expect(csp).toMatch(/connect-src 'self'/);
      expect(csp).toMatch(/form-action 'self'/);
      expect(html).not.toMatch(/<(script|link|img)[^>]+(src|href)="https?:/);
      expect(html.match(/<script>/g)).toHaveLength(1);
    });
  });

  describe("package page", () => {
    it("shows an open package in full", async () => {
      const { status, html, headers } = await page(registry, "/package/@stackra/core");
      expect(status).toBe(200);
      expect(headers.get("cache-control")).toBe("public, max-age=60");
      // README: rendered, escaped, comment dropped, unsafe link dropped.
      expect(html).toContain('<h1 id="stackracore">@stackra/core</h1>');
      expect(html).toContain("The <strong>kernel</strong>.");
      expect(html).toContain('<a href="https://docs.stackra.figentra.com">docs</a>');
      expect(html).not.toContain("javascript:");
      expect(html).not.toContain("Stackra file contract");
      expect(html).toContain("<th>Entry</th>");
      expect(html).toContain("const x = 1 &lt; 2;");
      // Metadata, escaped.
      expect(html).toContain("Core &lt;b&gt;kernel&lt;/b&gt;");
      expect(html).not.toContain("Core <b>kernel</b>");
      // Install and licence.
      expect(html).toContain("@stackra:registry=https://npm.stackra.figentra.com/");
      expect(html).toContain("pnpm add @stackra/core");
      expect(html).not.toContain("_authToken");
      expect(html).toContain('<span dir="ltr">MIT</span>');
      // Dependencies: ours linked, others plain.
      expect(html).toContain('href="/package/@stackra/contracts"');
      expect(html).toContain("<bdi>zod</bdi>");
      expect(html).not.toContain('href="/package/zod"');
      // Provenance from the stored statement.
      expect(html).toContain(
        'href="https://github.com/figentra/stackra/commit/0d5f464aabbccddeeff00112233445566778899a"',
      );
      expect(html).toContain(".github/workflows/release.yml@refs/heads/main");
      expect(html).toContain(
        'href="https://github.com/figentra/stackra/actions/runs/42/attempts/1"',
      );
      // Versions and tags.
      expect(html).toContain("<span>latest</span>");
      // The page never links a packument or a tarball.
      expect(html).not.toMatch(/\.tgz|href="\/@stackra/);
    });

    it("keeps the README in KV after the first read", async () => {
      await page(registry, "/package/@stackra/core");
      expect(await registry.cache.get("browse:readme:@stackra/core@0.1.0")).toContain(
        "<strong>kernel</strong>",
      );
    });

    it("shows a Pro package as metadata only without a token that may read it", async () => {
      for (const token of [undefined, "stkl_unknown"]) {
        const { status, html, headers } = await page(registry, "/package/@stackra-pro/sync", token);
        expect(status).toBe(200);
        expect(html).toContain("Sync engine");
        expect(html).toContain("Metadata only.");
        expect(html).toContain("Stackra Pro: a licence is needed.");
        expect(html).toContain("//npm.stackra.figentra.com/:_authToken=${STACKRA_LICENCE_TOKEN}");
        expect(html).not.toContain("Secret pro readme");
        expect(html).not.toContain('id="dependencies"');
        expect(html).not.toContain('id="provenance"');
        expect(headers.get("cache-control")).toBe("private, no-store");
        expect(headers.get("vary")).toBe("authorization");
      }
    });

    it("shows a Pro package in full to a licence that may read it", async () => {
      const { html, headers } = await page(registry, "/package/@stackra-pro/sync", "stkl_customer");
      expect(html).toContain("Secret pro readme");
      expect(html).toContain('href="/package/@stackra/core"');
      expect(html).toContain('id="provenance"');
      expect(html).not.toContain("stkl_customer");
      expect(headers.get("cache-control")).toBe("private, no-store");
    });

    it("answers 404 for an internal name or scope unless the licence may read it", async () => {
      for (const token of [undefined, "stkl_customer"]) {
        expect((await page(registry, "/package/@stackra-pro/ui", token)).status).toBe(404);
        expect((await page(registry, "/package/@figentra/brand-tamo", token)).status).toBe(404);
      }
      const internal = await page(registry, "/package/@stackra-pro/ui", "stkl_internal");
      expect(internal.status).toBe(200);
      expect(internal.html).toContain("Secret pro readme");
    });

    it("answers an HTML 404 for an unknown package or scope", async () => {
      for (const path of [
        "/package/@stackra/none",
        "/package/@other/thing",
        "/ar/package/@stackra/none",
      ]) {
        const { status, html, headers } = await page(registry, path);
        expect(status).toBe(404);
        expect(headers.get("content-type")).toBe("text/html; charset=utf-8");
        expect(html).toContain(path.startsWith("/ar") ? "الحزمة غير موجودة" : "Package not found");
      }
    });

    it("serves the Arabic page right to left, with the README left to right", async () => {
      const { html } = await page(registry, "/ar/package/@stackra/core");
      expect(html).toContain('<html lang="ar" dir="rtl">');
      expect(html).toContain('<article class="readme" lang="en" dir="ltr"');
      expect(html).toContain("التثبيت");
      expect(html).toContain('href="/package/@stackra/core" hreflang="en"');
    });

    it("answers GET only", async () => {
      const response = await registry.request("/package/@stackra/core", {
        method: "PUT",
        body: {},
      });
      expect(response.status).toBe(405);
    });
  });

  describe("npm routes", () => {
    it("answer as before, whatever the Accept header", async () => {
      const packument = await registry.request("/@stackra%2fcore", { accept: "text/html" });
      expect(packument.headers.get("content-type")).toBe("application/json");
      expect(((await packument.json()) as { name: string }).name).toBe("@stackra/core");
      expect((await registry.request("/@stackra-pro/sync")).status).toBe(401);
      expect((await registry.request("/@stackra-pro/sync/-/sync-0.1.0.tgz")).status).toBe(401);
      expect((await registry.request("/@stackra/core/-/core-0.1.0.tgz")).status).toBe(200);
      expect((await registry.request("/-/stackra/v1/catalogue/@stackra-pro/ui")).status).toBe(404);
      for (const path of ["/lodash", "/-/v1/search?text=x", "/package"]) {
        const response = await registry.request(path);
        expect(response.status).toBe(404);
        expect(response.headers.get("content-type")).toBe("application/json");
      }
    });
  });
});
