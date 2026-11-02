---
"@stackra/infra-testbed": patch
---

The testbed's Image Builder components and recipe are kept in AWS when new inputs replace them (`retainOnDelete`). The
provider replaces a fixed-name resource delete-first, and AWS refuses to delete a version an image was built from, so
`pulumi up` failed with ResourceDependencyException once the inputs changed.
