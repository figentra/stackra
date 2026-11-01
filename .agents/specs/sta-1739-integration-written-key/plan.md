# Implementation Plan: a written key on an Integration

**Spec**: `spec.md` · **Linear**: STA-1739 · **Branch**: `figentra/sta-1739-integration-written-key`

This Mac runs only oxfmt and oxlint; tests run on a box through stackra-f4.

| Step | What                                                                                    | Gate               |
| ---- | --------------------------------------------------------------------------------------- | ------------------ |
| 1    | `IntegrationOptions.key`, checked in `readIntegrationOptions`, with a test              | integrations tests |
| 2    | `buildManifest` takes the written key, `integration_key_invalid`, collision via `claim` | gen tests          |
| 3    | pay#5 declares `key: "connectors.<vendor>"`                                             | pay, after 0.2.1   |
