---
"@stackra/database": minor
---

`CrudService.table` refuses a cursor no earlier page gave (malformed, forged or another table's) with the new
`TableCursorInvalidError` (`table_cursor_invalid`, a validation refusal with the field error on `cursor`, HTTP 400)
instead of letting MikroORM's `CursorError` through as a server error. A cursor failure when the read sent no cursor is
still the server's and is rethrown unchanged (STA-2856).
