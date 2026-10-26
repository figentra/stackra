---
"@stackra/contracts": minor
---

Add the `PrincipalDirectory` port (`supervisorOf(principalId, scope)`, for escalation to a person's supervisor) and
`DataClassification.Regulated` (`regulated`: identifiers a regulator issues or governs, such as a tax registration
number or a national id). Packages that list the classification codes by hand still name four; stackra-164 aligns them.
