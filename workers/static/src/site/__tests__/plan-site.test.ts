/**
 * Stackra file contract:
 * Purpose: unit tests of the site plan: the URL layout (moving, latest, major, exact), `$id` rewriting on the host
 *          the `$id` names (either of the Worker's two hosts, STA-2892), index.json, the empty site before STA-305, and
 *          the schema validation errors.
 * Boundary: pure; no file system and no git.
 * Runtime: node
 * Governing contract: ADR 0284 (hosted static files); ADR 0022 (test placement).
 */
// @covers sta-322:FR-001 sta-322:FR-003 sta-322:P-001 sta-322:P-003
import type { SchemaRelease, SchemaSource, SiteFile } from "#src/interfaces";
import { planSite } from "#src/site/plan-site";

/** The schemas base of an existing Stackra schema, which keeps its host (ADR 0284 decision 3 as amended). */
const HOST = "https://static.stackra.figentra.com/schemas";
/** The schemas base of a new schema: the Worker's main host (STA-2892). */
const MAIN = "https://static.figentra.com/schemas";

const schema = (path: string, extra: Record<string, unknown> = {}, base = HOST): SchemaSource => ({
  file: `tools/schemas${path}`,
  text: JSON.stringify({ $id: `${base}${path}`, title: path, ...extra }),
});

/** One release holding a single schema whose description names the version. */
const release = (version: string): SchemaRelease => ({
  version,
  schemas: [schema("/mcp.json", { description: version })],
});

const byPath = (files: SiteFile[]): Map<string, string> =>
  new Map(files.map((file) => [file.path, file.body]));

describe("planSite", () => {
  it("builds a valid site with no schemas and no releases", () => {
    const files = byPath(planSite([], []));
    expect([...files.keys()].sort()).toEqual([
      "/404.html",
      "/_headers",
      "/index.html",
      "/schemas/index.json",
    ]);
    expect(JSON.parse(files.get("/schemas/index.json") ?? "")).toEqual({
      host: "static.figentra.com",
      hosts: ["static.figentra.com", "static.stackra.figentra.com"],
      schemas: [],
      releases: [],
    });
  });

  it("publishes a latest schema at its $id path and under /schemas/latest", () => {
    const files = byPath(planSite([schema("/runway/app.json")], []));
    expect(JSON.parse(files.get("/schemas/runway/app.json") ?? "").$id).toBe(
      `${HOST}/runway/app.json`,
    );
    expect(JSON.parse(files.get("/schemas/latest/runway/app.json") ?? "").$id).toBe(
      `${HOST}/latest/runway/app.json`,
    );
    expect(JSON.parse(files.get("/schemas/index.json") ?? "").schemas).toEqual([
      { id: `${HOST}/runway/app.json`, title: "/runway/app.json" },
    ]);
  });

  it("publishes every release at its exact version and the newest of each major at v<major>", () => {
    // Out of order on purpose: 1.10.0 must beat 1.9.0 numerically.
    const files = byPath(planSite([], [release("1.9.0"), release("2.0.0"), release("1.10.0")]));
    for (const version of ["1.9.0", "1.10.0", "2.0.0"]) {
      const exact = JSON.parse(files.get(`/schemas/${version}/mcp.json`) ?? "");
      expect(exact.$id).toBe(`${HOST}/${version}/mcp.json`);
      expect(exact.description).toBe(version);
    }
    expect(JSON.parse(files.get("/schemas/v1/mcp.json") ?? "").description).toBe("1.10.0");
    expect(JSON.parse(files.get("/schemas/v2/mcp.json") ?? "").description).toBe("2.0.0");
    expect(JSON.parse(files.get("/schemas/index.json") ?? "").releases).toEqual([
      "2.0.0",
      "1.10.0",
      "1.9.0",
    ]);
    expect(files.get("/_headers")).toContain(
      "/schemas/1.10.0/*\n  Cache-Control: public, max-age=31536000, immutable",
    );
  });

  it("keeps the other keys of a schema and rewrites only $id", () => {
    const files = byPath(planSite([schema("/mcp.json", { type: "object" })], []));
    const published = JSON.parse(files.get("/schemas/latest/mcp.json") ?? "");
    expect(published).toEqual({
      $id: `${HOST}/latest/mcp.json`,
      title: "/mcp.json",
      type: "object",
    });
  });

  it("keeps the host each $id names: a new schema on the main host, an existing one on the stackra host", () => {
    const files = byPath(
      planSite(
        [schema("/runway/app.json"), schema("/figentra/brand.json", {}, MAIN)],
        [{ version: "1.0.0", schemas: [schema("/figentra/brand.json", {}, MAIN)] }],
      ),
    );
    expect(JSON.parse(files.get("/schemas/figentra/brand.json") ?? "").$id).toBe(
      `${MAIN}/figentra/brand.json`,
    );
    expect(JSON.parse(files.get("/schemas/1.0.0/figentra/brand.json") ?? "").$id).toBe(
      `${MAIN}/1.0.0/figentra/brand.json`,
    );
    expect(JSON.parse(files.get("/schemas/v1/figentra/brand.json") ?? "").$id).toBe(
      `${MAIN}/v1/figentra/brand.json`,
    );
    expect(JSON.parse(files.get("/schemas/latest/runway/app.json") ?? "").$id).toBe(
      `${HOST}/latest/runway/app.json`,
    );
    expect(JSON.parse(files.get("/schemas/index.json") ?? "").schemas).toEqual([
      { id: `${MAIN}/figentra/brand.json`, title: "/figentra/brand.json" },
      { id: `${HOST}/runway/app.json`, title: "/runway/app.json" },
    ]);
  });

  it("rejects one name on both hosts: both hosts serve the same path", () => {
    expect(() => planSite([schema("/mcp.json"), schema("/mcp.json", {}, MAIN)], [])).toThrow(
      /two files would be published at \/schemas\/mcp\.json/,
    );
  });

  it("rejects a schema whose $id names another host", () => {
    const foreign = {
      file: "tools/schemas/x.schema.json",
      text: '{"$id":"https://example.com/schemas/x.json"}',
    };
    expect(() => planSite([foreign], [])).toThrow(
      /must be https:\/\/static\.figentra\.com\/schemas\/<name>\.json or https:\/\/static\.stackra\.figentra\.com\/schemas/,
    );
  });

  it("rejects a schema with no $id or invalid JSON", () => {
    expect(() => planSite([{ file: "a", text: '{"title":"x"}' }], [])).toThrow(/no string "\$id"/);
    expect(() => planSite([{ file: "b", text: "{" }], [])).toThrow(/not valid JSON/);
  });

  it("rejects a $id outside /schemas or on a reserved segment", () => {
    expect(() => planSite([schema("/latest/x.json")], [])).toThrow(/reserved segment "latest"/);
    expect(() => planSite([schema("/v1/x.json")], [])).toThrow(/reserved segment "v1"/);
    const outside = { file: "c", text: '{"$id":"https://static.stackra.figentra.com/x.json"}' };
    expect(() => planSite([outside], [])).toThrow(/must be https/);
  });

  it("rejects two schemas with the same $id", () => {
    expect(() => planSite([schema("/mcp.json"), schema("/mcp.json")], [])).toThrow(
      /two files would be published at \/schemas\/mcp\.json/,
    );
  });
});
