/**
 * Stackra file contract:
 * Purpose: unit tests of `renderMarkdown` and `provenanceOf`: the README subset (headings, lists, tables, code,
 *          quotes), that raw HTML and unsafe links never reach the page, and the provenance summary of a bundle.
 * Boundary: pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0453 (decision 9).
 */
import { provenanceOf } from "#src/browse/provenance-of";
import { renderMarkdown } from "#src/browse/render-markdown";
import { toBase64 } from "#src/bytes/to-base64";

/** A bundle whose DSSE payload is `statement`. */
const bundle = (statement: unknown): string =>
  JSON.stringify({
    dsseEnvelope: { payload: toBase64(new TextEncoder().encode(JSON.stringify(statement))) },
  });

describe("renderMarkdown", () => {
  it("renders the README subset", () => {
    const html = renderMarkdown(
      "## Use it\n\n- one\n- two `x`\n\n1. first\n\n> quoted\n\n---\n\nA *word* and **bold**.",
    );
    expect(html).toBe(
      [
        '<h2 id="use-it">Use it</h2>',
        "<ul><li>one</li><li>two <code>x</code></li></ul>",
        "<ol><li>first</li></ol>",
        "<blockquote><p>quoted</p></blockquote>",
        "<hr>",
        "<p>A <em>word</em> and <strong>bold</strong>.</p>",
      ].join("\n"),
    );
  });

  it("escapes raw HTML and keeps only safe links", () => {
    const html = renderMarkdown(
      "<img src=x onerror=alert(1)>\n\n[a](javascript:alert(1)) [b](https://x.test/?a=1&b=2) [c](data:text/html,x) ![i](https://x.test/i.png)\n\n```\n<script>\n```",
    );
    expect(html).not.toMatch(/<img|<script|javascript:|data:text/);
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(html).toContain('<a href="https://x.test/?a=1&amp;b=2">b</a>');
    expect(html).toContain('<a href="https://x.test/i.png">i</a>');
    expect(html).toContain("<pre><code>&lt;script&gt;</code></pre>");
  });

  it("drops HTML comments, such as the file contract", () => {
    expect(renderMarkdown("<!-- Stackra file contract -->\n# Title")).toBe(
      '<h1 id="title">Title</h1>',
    );
  });
});

describe("provenanceOf", () => {
  it("reads the repository, commit, workflow, ref and run of an SLSA v1 statement", () => {
    expect(
      provenanceOf(
        bundle({
          predicate: {
            buildDefinition: {
              externalParameters: {
                workflow: {
                  repository: "https://github.com/figentra/stackra",
                  path: ".github/workflows/release.yml",
                  ref: "refs/heads/main",
                },
              },
              resolvedDependencies: [{ digest: { gitCommit: "abc123" } }],
            },
            runDetails: {
              metadata: { invocationId: "https://github.com/figentra/stackra/actions/runs/1" },
            },
          },
        }),
        "fallback",
      ),
    ).toEqual({
      repository: "https://github.com/figentra/stackra",
      commit: "abc123",
      workflow: ".github/workflows/release.yml",
      ref: "refs/heads/main",
      run: "https://github.com/figentra/stackra/actions/runs/1",
    });
  });

  it("falls back to the publisher run, and answers null for an unreadable bundle", () => {
    expect(provenanceOf(bundle({}), "https://github.com/x/y/actions/runs/2")?.run).toBe(
      "https://github.com/x/y/actions/runs/2",
    );
    expect(provenanceOf("not json", "r")).toBeNull();
  });
});
