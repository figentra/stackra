# `tasks/`

One folder per task, named `NN-slug`, holding:

- `prompt.md`: the plain-language task, the same text for every framework.
- `start/`: the starting state, per framework where the starter differs.
- `acceptance/`: tests that call the finished app over HTTP, so one test set fits every framework.

Task set v0 (five tasks, added in the next piece): add a field end to end; an authenticated endpoint with
validation; a background job; a list-and-edit page; a business rule changed across layers.
