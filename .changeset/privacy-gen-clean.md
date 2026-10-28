---
"@stackra/privacy": minor
---

`@stackra/privacy` is gen-clean. `SubjectErased` is named `subject.erased`, so its wire name is
`privacy.subject.erased.v1` (was written as `privacy.subject_erased`): a consumer switches to it. `SubjectErased.erased`
and `EraseSubjectOutput.erased` are typed with the new `ErasedRecordsLine` shape (same fields as `ErasedRecords`).
`SubjectPermissions` (`erase`, `export`) and `SubjectExportPermissions` (`purge`) declare the jobs' system permissions;
the package now depends on `@stackra/iam`. `MemorySubjectSaltStoreDriver` takes no constructor argument: seed it with
`put(subjects)`.
