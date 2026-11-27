---
"@stackra/config": minor
---

Two more secret stores and reload on rotation (STA-258, ADR 0371 amendment of 2026-11-27). `./node` adds
`GcpSecretManagerSecretStoreDriver` (driver `gcp_secret_manager`, `GcpSecretManagerConfig` at `config.gcp_secret_manager`):
it reads each secret's `latest` or pinned (`NAME@<version>`) version over REST with the runtime's own service-account
token from the metadata server, eight at a time, through the location's regional endpoint when `location` is set, with a
per-request `timeoutMs`; no key and no SDK. It also adds `FileSecretStoreDriver` (driver `file`, `SecretFilesConfig` at
`config.secret_files`), which reads one file per secret from the folder a platform mounts (a Kubernetes Secret volume,
Docker or Compose secrets), for on-premises and air-gapped installs. Every loading driver, AWS included, swaps its copy
only when every read succeeded. `scheduleSecretReload(store, { everySeconds, onError })` reloads a loading store on an
interval and on `reloadNow()`, one reload at a time, keeping the last good values when a reload fails;
`SecretsConfig.reloadSeconds` (default 0) is its interval. `bootApp` still binds the environment store (STA-2804).
