/**
 * Stackra file contract:
 * Purpose: unit tests of `sanitizeHtml`: the editor's output passes unchanged; scripts, styles and their content,
 *          event handlers, `style`, comments and unknown tags go; `javascript:` and its encoded and split forms are
 *          refused in `href`; malformed markup becomes text; open tags are closed and stray closes dropped; a narrower
 *          policy is honoured. Every vector of the known-XSS corpus (`fixtures/xss-vectors.fixture.ts`) is sanitized and
 *          the output is parsed by parse5, a browser-grade HTML parser: no active element, event handler, `style` or
 *          unsafe `href` survives, every element is in the policy, and sanitizing twice changes nothing (mutation XSS).
 *          The output's own grammar is checked too: every tag is one the sanitizer wrote and all text and attribute
 *          values are escaped.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); OWASP XSS prevention.
 */
import { describe, expect, it } from "@stackra/testing";
import { parseFragment } from "parse5";

import { RICH_TEXT_HTML_POLICY } from "#core/constants/rich-text-html-policy.constant";
import { XSS_VECTORS } from "#core/functions/__tests__/fixtures/xss-vectors.fixture";
import { sanitizeHtml } from "#core/functions/sanitize-html.function";

/** The parse5 node fields the walk reads. */
interface ParsedNode {
  readonly nodeName: string;
  readonly attrs?: readonly { readonly name: string; readonly value: string }[];
  readonly childNodes?: readonly ParsedNode[];
  readonly content?: ParsedNode;
}

/** Elements that must never survive, whatever the policy says about the rest. */
const FORBIDDEN_ELEMENTS = new Set([
  "script",
  "iframe",
  "object",
  "embed",
  "style",
  "base",
  "meta",
  "link",
  "form",
  "svg",
  "math",
  "template",
  "noscript",
]);

/** A tag the sanitizer writes: a lower-case name and attributes that are lower-case names with escaped values. */
const WRITTEN_TAG = /^<\/?[a-z][a-z0-9-]*(?: [a-z]+="(?:[^"<>'&]|&(?:amp|lt|gt|quot|#39);)*")*>$/;

/** Text the sanitizer writes: no markup characters and only its own five entities. */
const WRITTEN_TEXT = /^(?:[^<>"'&]|&(?:amp|lt|gt|quot|#39);)*$/;

/** Every problem the browser-grade parse of `output` shows, as short messages. */
const problemsOf = (output: string): string[] => {
  const problems: string[] = [];
  const emitted = new Set<string>();
  const parts = output.split(/(<[^>]*>)/);
  for (const [at, part] of parts.entries()) {
    if (at % 2 === 1) {
      if (!WRITTEN_TAG.test(part)) problems.push(`tag not as written: ${part}`);
      emitted.add(/^<\/?([a-z0-9-]+)/.exec(part)?.[1] ?? "");
    } else if (!WRITTEN_TEXT.test(part)) problems.push(`text not escaped: ${part}`);
  }
  const walk = (node: ParsedNode): void => {
    const name = node.nodeName;
    if (!name.startsWith("#")) {
      const allowed = Object.hasOwn(RICH_TEXT_HTML_POLICY.tags, name)
        ? RICH_TEXT_HTML_POLICY.tags[name]
        : undefined;
      if (FORBIDDEN_ELEMENTS.has(name)) problems.push(`forbidden element ${name}`);
      if (allowed === undefined) problems.push(`element ${name} is not in the policy`);
      if (!emitted.has(name)) problems.push(`element ${name} was not emitted as a tag`);
      for (const { name: attribute, value } of node.attrs ?? []) {
        if (attribute.startsWith("on")) problems.push(`event handler ${attribute}`);
        if (attribute === "style") problems.push("style attribute");
        if (!allowed?.includes(attribute)) problems.push(`attribute ${attribute} on ${name}`);
        if (attribute === "href") {
          const clean = value.replaceAll(/[\s\p{Cc}]/gu, "");
          const scheme = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(clean)?.[1]?.toLowerCase();
          if (scheme !== undefined && !["http", "https", "mailto"].includes(scheme)) {
            problems.push(`href scheme ${scheme}`);
          }
        }
      }
    }
    for (const child of node.childNodes ?? []) walk(child);
    if (node.content !== undefined) walk(node.content);
  };
  walk(parseFragment(output) as unknown as ParsedNode);
  return problems;
};

describe("sanitizeHtml known-vector corpus", () => {
  it("holds the corpus the hardening claims to cover", () => {
    expect(XSS_VECTORS.length).toBeGreaterThan(800);
  });

  it("leaves nothing active in the parse5 tree of any output", () => {
    const failures = XSS_VECTORS.map((vector) => ({
      vector: vector.slice(0, 200),
      problems: problemsOf(sanitizeHtml(vector)),
    })).filter(({ problems }) => problems.length > 0);
    expect(failures).toEqual([]);
  });

  it("is stable: sanitizing the output again changes nothing", () => {
    const failures = XSS_VECTORS.filter((vector) => {
      const once = sanitizeHtml(vector);
      return sanitizeHtml(once) !== once;
    }).map((vector) => vector.slice(0, 200));
    expect(failures).toEqual([]);
  });
});

describe("sanitizeHtml", () => {
  it("escapes text and attribute values: & < > \" '", () => {
    expect(sanitizeHtml('<a title="a&b<c>d\'e&quot;f" href="/x">x\'y"z&amp;<w</a>')).toBe(
      '<a title="a&amp;b&lt;c&gt;d&#39;e&quot;f" href="/x">x&#39;y&quot;z&amp;&lt;w</a>',
    );
    expect(sanitizeHtml("&lt;img src=x onerror=1&gt; &#60;b&#62;")).toBe(
      "&lt;img src=x onerror=1&gt; &lt;b&gt;",
    );
  });

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

  it("holds its floor under a reckless host policy", () => {
    const reckless = {
      tags: {
        p: ["onclick", "style", "srcdoc", "formaction", "xlink:href", "title"],
        script: ["src"],
        iframe: ["src"],
        base: ["href"],
        meta: ["http-equiv", "content"],
        form: ["action"],
      },
      dropWithContent: [],
    };
    expect(
      sanitizeHtml(
        '<base href="https://evil.example/"><meta http-equiv="refresh" content="0;url=https://evil.example">' +
          '<p onclick="x()" style="a" srcdoc="b" formaction="c" xlink:href="d" title="kept">t</p>' +
          '<script src="https://evil.example/x.js">x()</script><iframe src="https://evil.example">i</iframe>' +
          '<form action="https://evil.example">f</form>',
        reckless,
      ),
    ).toBe('<p title="kept">t</p>f');
  });
});
