---
"@stackra/runway": minor
---

`./node` gains the brand step and the store-screenshot capture job (ADR 0441 as amended, D17 and D19).
`runBrandStep` runs `@stackra/brand-kit` in CI per web surface, per mobile app and per white-label scope, each under
`.stackra/brand`, and `committedBrandOutputs` fails the step when a file a kit asset manifest lists is committed.
`screenshotCaptureJob` defines the simulator capture of every captioned screen per locale with demo data, writing where
the kit's store frames read, and `runScreenshotCapture` runs it on a Mac CI runner. Defaults live in
`BRAND_STEP_SETTINGS` and `SCREENSHOT_CAPTURE_DEFAULTS`.
