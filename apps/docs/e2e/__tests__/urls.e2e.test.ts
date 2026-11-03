/**
 * Stackra file contract:
 * Purpose: the docs site keeps its URLs (STA-2026 SC-001, SC-002): every path of the Mintlify sitemap captured before
 *          the switch answers 200, `llms.txt` and `llms-full.txt` answer 200 as text and list the pages, `/licensing`
 *          redirects to the install page, a trailing slash redirects to the bare path, and an unknown path answers 404
 *          with the site's 404 page.
 * Boundary: the prerendered site under `wrangler dev`; plain requests, no browser, so the 578 paths stay quick.
 * Runtime: node
 * Governing contract: ADR 0514 (decision 9); ADR 0022 (test placement); STA-2026 (FR-003, FR-004, research R4).
 */
import { readFileSync } from "node:fs";

import { expect, test } from "@playwright/test";

const PATHS = readFileSync(new URL("../fixtures/mintlify-sitemap.txt", import.meta.url), "utf8")
  .split("\n")
  .filter((path) => path.length > 0);

test("every path Mintlify served answers 200", async ({ request }) => {
  const failed: string[] = [];
  for (const path of PATHS) {
    const response = await request.get(path, { maxRedirects: 0 });
    if (response.status() !== 200) failed.push(`${path} ${response.status()}`);
  }
  expect(failed).toEqual([]);
});

test("llms.txt and llms-full.txt answer as text and list the pages", async ({ request }) => {
  for (const file of ["/llms.txt", "/llms-full.txt"]) {
    const response = await request.get(file);
    expect(response.status(), file).toBe(200);
    expect(response.headers()["content-type"], file).toMatch(/^text\/plain/);
  }
  const llms = await (await request.get("/llms.txt")).text();
  expect(llms).toContain("](/quickstart)");
  expect(llms).toContain("](/adr/0001-monorepo-layout)");
});

test("a moved path, a trailing slash and an unknown path", async ({ request }) => {
  const moved = await request.get("/licensing", { maxRedirects: 0 });
  expect(moved.status()).toBe(301);
  expect(moved.headers()["location"]).toMatch(/\/customers\/install$/);
  const slash = await request.get("/adr/0001-monorepo-layout/", { maxRedirects: 0 });
  expect([301, 307, 308]).toContain(slash.status());
  expect(slash.headers()["location"]).toMatch(/\/adr\/0001-monorepo-layout$/);
  const unknown = await request.get("/adr/9999-nothing-here");
  expect(unknown.status()).toBe(404);
  expect(await unknown.text()).toContain("Page not found");
});
