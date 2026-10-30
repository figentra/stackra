---
"@stackra/panel": minor
---

A record or bulk action whose input needs more than the record id now opens a modal form generated from its input
schema (ADR 0307 rule 3): the record id pre-filled, the declared confirm copy shown, one run per selected record, and
the server's field errors kept on the form with only the refused records left to retry.
