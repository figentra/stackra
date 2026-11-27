---
"@stackra/config": minor
---

Two more secret stores and an opt-in reload helper; boot wiring is STA-2804 (STA-258, ADR 0371 amendment of
2026-11-27). `./node` adds
`GcpSecretManagerSecretStoreDriver` (driver `gcp_secret_manager`, `GcpSecretManagerConfig` at `config.gcp_secret_manager`):
it reads each secret's `latest` or pinned (`NAME@<version>`) version over REST with the runtime's own service-account
token from the metadata server, eight at a time, through the location's regional endpoint when `location` is set, with a
per-request `timeoutMs`; no key and no SDK. It also adds `FileSecretStoreDriver` (driver `file`, `SecretFilesConfig` at
`config.secret_files`), which reads one file per secret from the folder a platform mounts (a Kubernetes Secret volume,
Docker or Compose secrets), for on-premises and air-gapped installs. Every loading driver, AWS included, swaps its copy
only when every read succeeded. `scheduleSecretReload(store, { everySeconds, timeoutMs, onError })` reloads a loading
store on an interval and on `reloadNow()`, one reload at a time, keeping the last good values when a reload fails; each
reload has a deadline (`timeoutMs`, 30 s by default), so a `load()` that never settles is reported to `onError` and the
next tick loads afresh; `reloadNow()`
never rejects, even when `onReload` or `onError` throws, so the interval leaves no unhandled rejection. The `file`
driver opens each file once and checks its kind and size on that handle and on the bytes read, so a file swapped or
grown after the check is never read in unchecked, and opens it non-blocking, so a FIFO named like a secret never
stalls a load. `AwsSecretsManagerConfig` gains `timeoutMs` (10 s by default): the AWS client now has a 3 s connection
timeout, a request timeout that throws and three attempts, where the SDK's defaults never time out. This is the
library half only: `bootApp` still binds the environment store, so no app booted by the framework uses these drivers or
reloads until STA-2804 binds the configured store at boot and adds its interval setting (it waits for a CTO ruling on
the reload policy); a host that wants it now binds and schedules a loading store itself. A reload reaches only code
that reads `SecretStore.get` on each use: a `@Secret` configuration field picks up a new value only on restart.
