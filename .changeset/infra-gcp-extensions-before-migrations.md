---
"@stackra/infra-gcp": minor
---

The Cloud SQL server now holds the extensions the environment's services name before any migration runs.
`gcpRuntimeConfig` takes the parsed service runways as a fourth argument and returns them as `database.extensions`;
when any are named, `gcpRuntime` needs `adminPassword` (the deploy job's, from the vault) and declares the built-in
admin `stackra_admin`, an in-region Secret Manager copy of its password, a service account that alone reads it, and a
Cloud Run job that runs the extension script to completion inside the apply (private IP with TLS, or the connector
socket on a server without a VPC). It runs again only when the extensions, the client image or the server change.
Enable the Secret Manager API where extensions are named, and the Compute Engine API when the server has a private
IP. `DEPLOY_ROLES` gains `roles/secretmanager.admin`, so the deploy identity can create the secret, its version and
the reader's grant; re-apply the foundation stack (`ciAccess`) before the first runtime apply that names an extension.
Direct VPC egress needs no compute role for the deploy identity: the Cloud Run service agent uses the subnet.
