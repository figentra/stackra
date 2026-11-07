/**
 * Stackra file contract:
 * Purpose: unit tests of `sanitizeHtml`: the editor's output passes unchanged; scripts, styles and their content,
 *          event handlers, `style`, comments and unknown tags go; `javascript:` and its encoded and split forms are
 *          refused in `href`; malformed markup becomes text; open tags are closed and stray closes dropped; a narrower
 *          policy is honoured.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); OWASP XSS prevention.
 */
import { describe, expect, it } from "@stackra/testing";

import { sanitizeHtml } from "#core/functions/sanitize-html.function";

describe("sanitizeHtml", () => {
  it("keeps the rich-text editor's output as it is", () => {
    const html =
      '<h2 dir="rtl">Title</h2><p>Some <strong>bold</strong>, <em>em</em> and <a href="https://acme.example/x?a=1&amp;b=2" title="t">a link</a>.</p>' +
      '<ol start="3"><li>one</li></ol><blockquote><p>q</p></blockquote><pre><code>x &lt; y</code></pre><p>a<br>b</p><hr>';
    expect(sanitizeHtml(html)).toBe(html);
  });

  it.each([
    ["<script>alert(1)</script><p>ok</p>", "<p>ok</p>"],
    ["<p>a<script>alert(1)</script>b</p>", "<p>ab</p>"],
    ["<style>p{display:none}</style><p>ok</p>", "<p>ok</p>"],
    ["<SCRIPT SRC=//evil.example/x.js></SCRIPT>", ""],
    ["<script><script>x</script>y</script>z", "z"],
    ['<img src=x onerror="alert(1)">', ""],
    ['<p onclick="alert(1)" style="color:red">x</p>', "<p>x</p>"],
    ['<svg onload="alert(1)"><circle/></svg>ok', "ok"],
    ['<iframe src="https://evil.example"></iframe>', ""],
    ["<!-- <script>alert(1)</script> -->ok", "ok"],
    ["<!doctype html><p>ok</p>", "<p>ok</p>"],
    ["<div><span>kept text</span></div>", "kept text"],
    ['<form action="/x"><input name="a"></form>', ""],
  ])("strips %j", (input, output) => {
    expect(sanitizeHtml(input)).toBe(output);
  });

  it.each([
    ['<a href="javascript:alert(1)">x</a>'],
    ['<a href="JaVaScRiPt:alert(1)">x</a>'],
    ['<a href="java&#x09;script:alert(1)">x</a>'],
    ['<a href="&#106;avascript:alert(1)">x</a>'],
    ['<a href="javascript&colon;alert(1)">x</a>'],
    ['<a href=" \u0001javascript:alert(1)">x</a>'],
    ['<a href="data:text/html;base64,PHNjcmlwdD4=">x</a>'],
    ['<a href="vbscript:msgbox(1)">x</a>'],
  ])("drops the unsafe href of %j", (input) => {
    expect(sanitizeHtml(input)).toBe("<a>x</a>");
  });

  it("keeps a mailto, a relative and a fragment href", () => {
    expect(
      sanitizeHtml(
        '<a href="mailto:a@acme.example">m</a><a href="/docs">r</a><a href="#top">f</a>',
      ),
    ).toBe('<a href="mailto:a@acme.example">m</a><a href="/docs">r</a><a href="#top">f</a>');
  });

  it("turns malformed markup into text and re-escapes every value", () => {
    expect(sanitizeHtml("1 < 2 and <p title='a\"b'>x</p> <b")).toBe("1 &lt; 2 and <p>x</p> &lt;b");
    expect(sanitizeHtml('<a title="&quot;&gt;&lt;script&gt;" href="/x">x</a>')).toBe(
      '<a title="&quot;&gt;&lt;script&gt;" href="/x">x</a>',
    );
    expect(sanitizeHtml("&lt;script&gt;alert(1)&lt;/script&gt;")).toBe(
      "&lt;script&gt;alert(1)&lt;/script&gt;",
    );
  });

  it("closes open tags, drops stray closes, and refuses a bad dir or start", () => {
    expect(sanitizeHtml("<p><strong>x</p></em>y")).toBe("<p><strong>x</strong></p>y");
    expect(sanitizeHtml('<p dir="evil">x</p><ol start="1;x"><li>y</li></ol>')).toBe(
      "<p>x</p><ol><li>y</li></ol>",
    );
  });

  it("honours a narrower policy", () => {
    expect(
      sanitizeHtml('<p>a <a href="https://acme.example">b</a></p>', {
        tags: { p: [] },
        dropWithContent: ["script"],
      }),
    ).toBe("<p>a b</p>");
  });
});
