# Security policy

## Reporting a vulnerability

Do not open a public issue. Report privately, by either route:

- GitHub: use "Report a vulnerability" on the repository's Security tab (private vulnerability reporting).
- Email: security@figentra.com

Include the affected package or member, the version or commit, steps to reproduce, and the impact you see.

## What to expect

- Acknowledgement within three business days.
- A fix or mitigation plan once the report is confirmed, and credit in the advisory if you want it.

## Supported versions

| Version                            | Gets security fixes |
| ---------------------------------- | ------------------- |
| The latest release of `@stackra/*` | Yes                 |
| Any earlier release                | No: upgrade         |

Every `@stackra/*` package, and every `@stackra-pro/*` package, is released at one shared version, from `main`
only. A security fix ships as the next release (a new patch or minor); a published version is never replaced and
there are no maintenance branches, so a fix is not back-ported to an older version. Before 1.0, read the release
note of a minor release before upgrading, as it can carry a breaking change. A longer support window is not offered
yet ([support and versioning](https://docs.stackra.figentra.com/customers/support)).

## Verifying a release

Integrity of a published `@stackra/*` package rests on its npm provenance (`npm audit signatures`) and the
cosign-signed CycloneDX SBOM attached to each GitHub release; the release's `sha256sums.txt` is a convenience.

## Scope

The `@stackra/*` packages and the reference apps and services in this repository. Never put a secret value in a
report; name the secret instead. The programme behind this policy is
[ADR 0187](apps/docs/src/docs/adr/0187-security-and-compliance-programme.mdx).
