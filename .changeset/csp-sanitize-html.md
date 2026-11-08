---
"@stackra/csp": minor
---

`sanitizeHtml(html, policy?)` makes rich-text HTML safe to render, with no DOM and no new dependency. It rebuilds the
output from parsed parts against an allowlist (`RICH_TEXT_HTML_POLICY`: the editor's paragraphs, headings, lists,
quotes, code, marks and links). Scripts, styles and their content, event handlers, `style`, comments and unknown tags
are dropped, and a link keeps its `href` only for http(s), mailto, relative or fragment URLs once entities and control
characters are taken out. `HtmlPolicy` narrows it.

A floor holds under any `HtmlPolicy`: event handlers, `style`, `srcdoc`, `formaction` and the like are never kept,
script-capable elements always go with their content, and `base`, `meta`, `link`, `embed` and form controls always go.
