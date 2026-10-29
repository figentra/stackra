# Security policy

## Reporting a vulnerability

Do not open a public issue. Report privately, by either route:

- GitHub: use "Report a vulnerability" on the repository's Security tab (private vulnerability reporting).
- Email: security@figentra.com

Include the affected package or member, the version or commit, steps to reproduce, and the impact you see.

## What to expect

- Acknowledgement within three business days.
- A fix or mitigation plan once the report is confirmed, and credit in the advisory if you want it.

## Verifying a release

Integrity of a published `@stackra/*` package rests on its npm provenance (`npm audit signatures`) and the
cosign-signed CycloneDX SBOM attached to each GitHub release; the release's `sha256sums.txt` is a convenience.

## Scope

The `@stackra/*` packages and the reference apps and services in this repository. Never put a secret value in a
report; name the secret instead. The programme behind this policy is
[ADR 0187](apps/docs/src/docs/adr/0187-security-and-compliance-programme.mdx).
