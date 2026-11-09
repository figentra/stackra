---
"@stackra/runway": minor
"@stackra/infra-aws-runtime": minor
---

A root runway can declare one `gotenberg` resource, the PDF engine `@stackra/documents` renders through. Runway runs it
as an internal Fargate workload:

- the Chromium image pinned by digest and pulled through the ECR pull-through registry named in
  `shared.network.registry`;
- basic auth on, no URL fetching;
- its own 443-only egress group;
- FARGATE_SPOT outside production.

`ensureGotenbergCredentials` writes the password once and hands every consumer `DOCUMENTS_GOTENBERG_URL` and
`DOCUMENTS_GOTENBERG_AUTHORIZATION`.
