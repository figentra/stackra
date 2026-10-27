---
"@stackra/experience": minor
"@stackra/builder": patch
---

Node renderer of studio documents (STA-1019, batch stackra-29). experience: new `./server` entry, the node renderer of studio documents. `renderEmailTemplate` draws an email
template (email-safe blocks only) to HTML and a plain-text part; `renderPrintDocument` draws a print document and
prints it to PDF through `@stackra/documents`' `PdfEngine`; `renderServerHtml` is the shared page render. Each checks
the document against its kind first and throws `UnknownBlockError` or `InvalidDocumentError` before drawing. New
types `ServerBlock`, `ServerBlockContext`, `ServerRenderOptions`, `PrintRenderOptions`, `RenderedEmail`,
`RenderedPrint`. New dependency `@stackra/documents` (`./contracts` only; no cycle). builder: docs only, pointing previews and sends at `@stackra/experience/server`.
