---
"@stackra/runway": minor
---

`devComposeOf(input)` plans the dev compose of a lane from the root runway's `environments.dev.infra`: every block
that is not Encore's own (`gateway`, `postgres`) becomes a Compose service of its kind (`DEV_INFRA_KINDS`: `valkey`,
`seaweedfs`, `mailpit`, `clamav`, `otel-lgtm`) or of its own `containerPorts`, published on 127.0.0.1 at the runway's
ports moved by lane, with health checks, named volumes, SeaweedFS buckets made at start and `when: opt-in` profiles.
It returns the variables a member needs to reach them (`*_VALKEY_URL`, `AWS_ENDPOINT_URL_S3`, `SMTP_HOST`/`SMTP_PORT`,
`OTEL_EXPORTER_OTLP_ENDPOINT`), with SeaweedFS's placeholder AWS key pair apart as `fallbackCredentials` (never a
global variable over a developer's own credential), and refuses a missing image or port, an unknown kind, a bad bucket or two blocks giving
one variable. `writeDevFacts` now writes the gateway's and each container's address into `.stackra/dev/ports.json`,
so a `from-port: valkey` var resolves (STA-2664).
