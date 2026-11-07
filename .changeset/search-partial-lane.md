---
"@stackra/search": minor
---

A multi-word search also returns the rows that hold only some of its words, after every full match: the Postgres
driver adds a partial lane and ranks its rows below every row a full lane found, so full matches keep their order and
partial ones fill the tail. A one-word search is unchanged. The evaluation set's recall@50 now reaches its threshold.
