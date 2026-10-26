# Feature Specification: streamed and multipart file writes

**Feature Branch**: `figentra/sta-666-wave12`

**Created**: 2026-10-26

**Status**: Implementing <!-- owner mode: code and tests written, nothing run -->

**Linear**: STA-828

**Clarifications status**: complete

**Input**: OS gate-A gap 10 (services/audit SPEC): exports are built in memory because `write` takes one buffer.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/data/filesystem
- **Cross-service events**: none
- **Tenancy and data**: none (keys are the caller's)
- **Secrets**: none (the SDK's default chain, unchanged)
- **ADR needed**: yes, 0413 (Proposed)
- **New dependencies**: none (`@aws-sdk/client-s3` already present)
- **Deploy modes**: same everywhere
- **Lane**: lite
- **Change risk**: R1

## Requirements

- **FR-001** `FileSystem#writeStream(key, source, options)` with `WriteStreamSource` (`ReadableStream<Uint8Array>` or
  `AsyncIterable<Uint8Array | string>`); the port's default buffers and calls `write`.
- **FR-002** The S3 driver uploads in 8 MiB parts, one PUT below a part, completes in part order, and aborts on failure.
- **FR-003** A failing stream stores nothing on any disk.

## Not built here

- A native streamed path on GCS and Encore buckets (they buffer; resumable uploads when a tenant needs them).
- Tests, typecheck and build are written but not run (owner mode).
