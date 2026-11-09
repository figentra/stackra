---
"@stackra/ui": minor
---

`PdfPreview` (`@stackra/ui/react`) shows a PDF in the browser's own viewer: a sandboxed frame that sends no referrer, with a download button as the fallback where the browser shows no PDF in a page (many mobile WebViews). No PDF library is added. A cross-origin link (the signed object-storage URL it is meant for) may run the viewer's scripts in its own origin; a same-origin link gets no scripts, so the frame can never lift its sandbox.
