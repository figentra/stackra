---
"@stackra/cli": minor
"@stackra/runway": patch
---

`stackra dev` starts a service on a workstation that is not linked to Encore Cloud. Gen writes the root runway's `providers.encore.app` into the service's `encore.app`, and with that id `encore run` first read the app's secrets from Encore Cloud, so a new `stackra create` app stopped at "Fetching application secrets failed … not logged in". Before `encore run`, `stackra dev` now asks Encore for the app (`encore secret list` in the member root). When Encore can read it, the run uses the cloud app as before. When it cannot, `stackra dev` prints one line with Encore's reason, runs Encore local-only with the id `""`, and puts gen's `encore.app` back when Encore exits or the run is stopped. Local secret values still come from `.stackra/dev-secrets.json`. Deploys always use the runway's id: Runway's Encore deploy tree refuses a member `encore.app` with the empty id, which only a killed local run can leave behind (run `stackra gen`). ADR 0091, amendment of 2026-11-26.
