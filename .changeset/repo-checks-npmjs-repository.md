---
"@stackra/repo-checks": patch
---

`npmMetadataFor` and the member file check give a member published to npmjs (`UNSCOPED_PACKAGES`, today only the
`create-stackra` initializer) the repository, homepage and issues URLs of `stackra-inc/stackra`, the repository whose
workflow signs its npmjs provenance: npm refuses a provenance publish whose `repository.url` names another repository
(STA-2897). Every other member keeps the repository's own URLs.
