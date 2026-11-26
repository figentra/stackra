---
"@stackra/notifications": minor
"@stackra/oxlint-config": minor
---

A mail body can now carry HTML that a tenant or a client wrote, safely. `useMail()` returns `richText(html, policy?)`, which renders the HTML only as `@stackra/csp`'s `sanitizeHtml` keeps it (the rich-text allowlist: no script, style, event handler, `style` attribute, image or non-http(s)/mailto link), so a branch's welcome note from the console editor can go into a mail without becoming an XSS hole in the mail client; the sanitized text is in the plain-text part too, and a host may pass a narrower `HtmlPolicy`. `@stackra/notifications` now depends on `@stackra/csp`. `@stackra/oxlint-config` turns on `react/no-danger` at error in every `*.mail.tsx`, so a mail body never writes `dangerouslySetInnerHTML` itself: replace any such site with `richText(html)` (STA-2582).
